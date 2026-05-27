import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Swords,
  Lock,
  ImagePlus,
  Trophy,
  Target,
  Users,
  Calendar,
  DollarSign,
  Sparkles,
  Gift,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { usePlatformFeePercent } from "@/hooks/use-platform-fee";
import { useCanCreateTournament } from "@/hooks/use-tournament-creator-requirement";
import { useIsAdmin } from "@/hooks/use-is-admin";
import defaultBanner from "@/assets/tournament-banner-default.jpg";

const FORMAT_OPTIONS = [
  { value: "single_elimination", label: "Single Elimination", description: "One loss and you're out", icon: "⚔️" },
  { value: "double_elimination", label: "Double Elimination", description: "Losers' bracket second chance", icon: "🛡️" },
];

const SCORING_OPTIONS = [
  { value: "biggest_catch", label: "Biggest Catch", description: "Heaviest single fish wins the matchup", icon: "🐟" },
  { value: "total_weight", label: "Total Weight", description: "Combined weight across the round", icon: "⚖️" },
  { value: "most_catches", label: "Most Catches", description: "Most fish landed wins", icon: "🎯" },
];

const CreateTournament = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canCreate, requirement, isLoading: gateLoading } = useCanCreateTournament();
  const { isAdmin } = useIsAdmin();
  const { data: platformFeePercent = 10 } = usePlatformFeePercent();

  // Tournaments are team-only and only captains can register a team — load captained teams.
  // Admins can host on behalf of any team, so they get the full team list.
  const { data: captainTeams = [], isLoading: teamCheckLoading } = useQuery({
    queryKey: ["tournament-creator-captain-teams", user?.id, isAdmin],
    enabled: !!user?.id,
    queryFn: async () => {
      const query = supabase
        .from("fishing_teams")
        .select("id, name, logo_url")
        .order("created_at", { ascending: false });
      const { data, error } = isAdmin
        ? await query
        : await query.eq("captain_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("single_elimination");
  const [seeding, setSeeding] = useState("random");
  const [scoring, setScoring] = useState("biggest_catch");
  const [maxParticipants, setMaxParticipants] = useState("16");
  const [entryFeeEnabled, setEntryFeeEnabled] = useState(false);
  const [entryFee, setEntryFee] = useState("5");
  const [prizeType, setPrizeType] = useState<"cash" | "gift_card">("cash");
  const [prizeDescription, setPrizeDescription] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creatorTeamId, setCreatorTeamId] = useState<string>("");

  // Default the team selection to the first captained team once loaded
  useEffect(() => {
    if (!creatorTeamId && captainTeams.length > 0) {
      setCreatorTeamId(captainTeams[0].id);
    }
  }, [captainTeams, creatorTeamId]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login required");
      if (!title.trim()) throw new Error("Title is required");
      if (!registrationEnd) throw new Error("Registration end date is required");
      if (!startDate) throw new Error("Start date is required");
      if (!isAdmin && !creatorTeamId) throw new Error("Please select the team you'll compete with");

      // Optional banner upload
      let bannerUrl: string | null = null;
      if (bannerFile) {
        const ext = bannerFile.name.split(".").pop();
        const path = `${user.id}/tournament-banners/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("catch-photos")
          .upload(path, bannerFile, { upsert: true });
        if (upErr) throw upErr;
        bannerUrl = supabase.storage.from("catch-photos").getPublicUrl(path).data.publicUrl;
      }

      const { data, error } = await supabase.from("tournaments").insert({
        title: title.trim(),
        description: description.trim() || null,
        format,
        seeding_method: seeding,
        scoring_method: scoring,
        max_participants: parseInt(maxParticipants),
        entry_fee: entryFeeEnabled && prizeType === "cash" ? parseFloat(entryFee) || 0 : 0,
        entry_fee_enabled: entryFeeEnabled && prizeType === "cash",
        prize_type: prizeType,
        prize_description: prizeDescription.trim() || null,
        gift_card_code: prizeType === "gift_card" ? giftCardCode.trim() || null : null,
        registration_end: new Date(registrationEnd).toISOString(),
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        status: "registration",
        created_by: user.id,
        banner_url: bannerUrl,
        creator_team_id: creatorTeamId || null,
      } as any).select().single();

      if (error) throw error;

      // Auto-register the creator's team as the first participant (free entry for the host).
      // Admins hosting without a team are skipped.
      if (creatorTeamId) {
        const { error: partErr } = await supabase
          .from("tournament_participants")
          .insert({
            tournament_id: data.id,
            user_id: user.id,
            team_id: creatorTeamId,
            has_paid: true,
          } as any);
        if (partErr) console.error("Failed to auto-register host team:", partErr);
      }

      return data;
    },
    onSuccess: (data: any) => {
      toast.success("Tournament created!");
      navigate(`/app/tournaments/${data.id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (gateLoading) {
    return <div className="scoreboard-hub min-h-screen -mx-4 md:-mx-0"><div className="max-w-lg mx-auto px-4 py-12 text-center sb-text-muted">Loading…</div></div>;
  }

  if (!canCreate) {
    const requirementLabel =
      requirement === "premium" ? "Premium members" :
      requirement === "verified" ? "Verified users" :
      requirement === "admin" ? "Admins" : "logged-in users";
    return (
      <div className="scoreboard-hub min-h-screen -mx-4 md:-mx-0 pb-32">
        <div className="max-w-lg mx-auto px-4 flex items-center gap-3 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-[hsl(var(--sb-surface-2))]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Create Tournament</h1>
        </div>
        <div className="max-w-lg mx-auto px-4">
        <div className="sb-card p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-[hsl(var(--sb-cyan-soft))] flex items-center justify-center">
            <Lock className="h-6 w-6 sb-cyan" />
          </div>
          <h2 className="text-lg font-semibold">Tournament hosting is restricted</h2>
          <p className="text-sm sb-text-muted">
            Only {requirementLabel} can create tournaments right now.
          </p>
          {requirement === "premium" && (
            <Button asChild className="w-full sb-bg-cyan border-0 hover:opacity-90">
              <Link to="/pricing">Upgrade to Premium</Link>
            </Button>
          )}
          <Button variant="ghost" className="w-full hover:bg-[hsl(var(--sb-surface-2))]" onClick={() => navigate("/app/tournaments")}>
            Back to tournaments
          </Button>
        </div>
        </div>
      </div>
    );
  }

  if (teamCheckLoading) {
    return <div className="scoreboard-hub min-h-screen -mx-4 md:-mx-0"><div className="max-w-lg mx-auto px-4 py-12 text-center sb-text-muted">Checking team membership…</div></div>;
  }

  if (captainTeams.length === 0 && !isAdmin) {
    return (
      <div className="scoreboard-hub min-h-screen -mx-4 md:-mx-0 pb-32">
        <div className="max-w-lg mx-auto px-4 flex items-center gap-3 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-[hsl(var(--sb-surface-2))]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Create Tournament</h1>
        </div>
        <div className="max-w-lg mx-auto px-4">
        <div className="sb-card p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-[hsl(var(--sb-cyan-soft))] flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 sb-cyan" />
          </div>
          <h2 className="text-lg font-semibold">You need to captain a team first</h2>
          <p className="text-sm sb-text-muted">
            Tournaments are team-based and only team captains can host or register. Create a team (you'll be its captain) before launching a tournament.
          </p>
          <div className="grid gap-2">
            <Button asChild className="w-full sb-bg-cyan border-0 hover:opacity-90">
              <Link to="/app/teams/new">Create a team</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-[hsl(var(--sb-border))] bg-[hsl(var(--sb-surface-2))]">
              <Link to="/app/teams">Browse existing teams</Link>
            </Button>
            <Button variant="ghost" className="w-full hover:bg-[hsl(var(--sb-surface-2))]" onClick={() => navigate("/app/tournaments")}>
              Back to tournaments
            </Button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  const selectedFormat = FORMAT_OPTIONS.find((f) => f.value === format);
  const selectedScoring = SCORING_OPTIONS.find((s) => s.value === scoring);
  const selectedTeam = captainTeams.find((t) => t.id === creatorTeamId);

  return (
    <div className="scoreboard-hub min-h-screen -mx-4 md:-mx-0 pb-24">
      {/* Banner hero */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img
          src={bannerPreview || defaultBanner}
          alt="Tournament banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sb-surface))] via-[hsl(var(--sb-surface))]/60 to-transparent" />
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app/tournaments")}
            className="bg-[hsl(var(--sb-surface))]/60 backdrop-blur-sm hover:bg-[hsl(var(--sb-surface))]/80"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--sb-surface))]/60 backdrop-blur-sm hover:bg-[hsl(var(--sb-surface))]/80 transition-colors text-sm font-medium"
        >
          <ImagePlus className="h-4 w-4" />
          {bannerPreview ? "Change Banner" : "Upload Banner"}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <Badge className="sb-bg-cyan border-0 mb-2">
            <Swords className="h-3 w-3 mr-1" /> New Tournament
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground text-white">
            {title || "Create Your Tournament"}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 -mt-2">
        <div className="space-y-6 mt-6">
          {/* Teams-only notice */}
          <div className="rounded-xl border border-[hsl(var(--sb-cyan))]/40 bg-[hsl(var(--sb-cyan-soft))] p-4 flex items-start gap-3">
            <Users className="h-4 w-4 sb-cyan mt-0.5 shrink-0" />
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-foreground mb-0.5 text-white">Team-based bracket</p>
              <p className="sb-text-muted">
                Tournaments are played between teams. Only team captains can register a team to compete in your bracket.
              </p>
            </div>
          </div>

          {/* Your team selector */}
          <section className="sb-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 sb-cyan" />
              <h2 className="font-bold">Your Team</h2>
            </div>
            <p className="text-xs sb-text-muted -mt-2">
              Pick the team you'll compete with. They'll be auto-registered as the first entrant when the tournament launches.
            </p>
            {captainTeams.length === 1 ? (
              <div className="flex items-center gap-3 rounded-lg border border-[hsl(var(--sb-border))] p-3 bg-[hsl(var(--sb-surface-2))]">
                {selectedTeam?.logo_url ? (
                  <img src={selectedTeam.logo_url} alt={selectedTeam.name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-[hsl(var(--sb-cyan-soft))] flex items-center justify-center">
                    <Users className="h-5 w-5 sb-cyan" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{selectedTeam?.name}</p>
                  <p className="text-xs sb-text-muted">You're the captain</p>
                </div>
                <Badge className="text-[10px] sb-bg-cyan border-0">Captain</Badge>
              </div>
            ) : (
              <div className="grid gap-2">
                {captainTeams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setCreatorTeamId(t.id)}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                      creatorTeamId === t.id
                        ? "border-[hsl(var(--sb-cyan))] bg-[hsl(var(--sb-cyan-soft))]"
                        : "border-[hsl(var(--sb-border))] bg-[hsl(var(--sb-surface-2))] hover:border-[hsl(var(--sb-cyan))]/50"
                    }`}
                  >
                    {t.logo_url ? (
                      <img src={t.logo_url} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[hsl(var(--sb-cyan-soft))] flex items-center justify-center">
                        <Users className="h-5 w-5 sb-cyan" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{t.name}</p>
                      <p className="text-xs sb-text-muted">You're the captain</p>
                    </div>
                    {creatorTeamId === t.id && (
                      <div className="h-5 w-5 rounded-full sb-bg-cyan flex items-center justify-center">
                        <Sparkles className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Basic Info */}
          <section className="sb-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-5 w-5 sb-cyan" />
              <h2 className="font-bold">Tournament Details</h2>
            </div>
            <div>
              <Label className="text-sm font-medium">Tournament Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Spring Bass Showdown 2026"
                className="mt-1.5 bg-[hsl(var(--sb-surface-2))] border-[hsl(var(--sb-border))] focus-visible:ring-[hsl(var(--sb-cyan))]"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's at stake, the vibe, sponsors, anything teams should know before they register…"
                rows={4}
                className="mt-1.5 bg-[hsl(var(--sb-surface-2))] border-[hsl(var(--sb-border))] focus-visible:ring-[hsl(var(--sb-cyan))]"
              />
            </div>
          </section>

          {/* Format */}
          <section className="sb-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Swords className="h-5 w-5 sb-cyan" />
              <h2 className="font-bold">Bracket Format</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                    format === f.value
                      ? "border-[hsl(var(--sb-cyan))] bg-[hsl(var(--sb-cyan-soft))] shadow-sm"
                      : "border-[hsl(var(--sb-border))] bg-[hsl(var(--sb-surface-2))] hover:border-[hsl(var(--sb-cyan))]/50"
                  }`}
                >
                  <span className="text-2xl block mb-2">{f.icon}</span>
                  <p className="font-semibold text-sm">{f.label}</p>
                  <p className="text-xs sb-text-muted mt-0.5">{f.description}</p>
                  {format === f.value && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full sb-bg-cyan flex items-center justify-center">
                      <Sparkles className="h-3 w-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Scoring */}
          <section className="sb-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-5 w-5 sb-cyan" />
              <h2 className="font-bold">Scoring & Seeding</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SCORING_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setScoring(s.value)}
                  className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                    scoring === s.value
                      ? "border-[hsl(var(--sb-cyan))] bg-[hsl(var(--sb-cyan-soft))] shadow-sm"
                      : "border-[hsl(var(--sb-border))] bg-[hsl(var(--sb-surface-2))] hover:border-[hsl(var(--sb-cyan))]/50"
                  }`}
                >
                  <span className="text-xl block mb-1">{s.icon}</span>
                  <p className="font-semibold text-xs">{s.label}</p>
                  <p className="text-[11px] sb-text-muted mt-0.5 leading-snug">{s.description}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <Label className="text-sm font-medium">Seeding Method</Label>
                <Select value={seeding} onValueChange={setSeeding}>
                  <SelectTrigger className="mt-1.5 bg-[hsl(var(--sb-surface-2))] border-[hsl(var(--sb-border))]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="random">Random Draw</SelectItem>
                    <SelectItem value="ranked">Ranked (by team score)</SelectItem>
                    <SelectItem value="manual">Manual (admin sets)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Max Teams</Label>
                <Select value={maxParticipants} onValueChange={setMaxParticipants}>
                  <SelectTrigger className="mt-1.5 bg-[hsl(var(--sb-surface-2))] border-[hsl(var(--sb-border))]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 teams</SelectItem>
                    <SelectItem value="8">8 teams</SelectItem>
                    <SelectItem value="16">16 teams</SelectItem>
                    <SelectItem value="32">32 teams</SelectItem>
                    <SelectItem value="64">64 teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section className="sb-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-5 w-5 sb-cyan" />
              <h2 className="font-bold">Schedule</h2>
            </div>
            <div>
              <Label className="text-sm font-medium">Registration Closes *</Label>
              <Input
                type="datetime-local"
                value={registrationEnd}
                onChange={(e) => setRegistrationEnd(e.target.value)}
                className="mt-1.5 bg-[hsl(var(--sb-surface-2))] border-[hsl(var(--sb-border))] focus-visible:ring-[hsl(var(--sb-cyan))]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Start Date *</Label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5 bg-[hsl(var(--sb-surface-2))] border-[hsl(var(--sb-border))] focus-visible:ring-[hsl(var(--sb-cyan))]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">End Date</Label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5 bg-[hsl(var(--sb-surface-2))] border-[hsl(var(--sb-border))] focus-visible:ring-[hsl(var(--sb-cyan))]"
                />
              </div>
            </div>
            {startDate && endDate && new Date(endDate) > new Date(startDate) && (
              <p className="text-xs sb-text-muted">
                Duration: {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            )}
          </section>

          {/* Prizes */}
          <section className="sb-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-5 w-5 sb-cyan" />
              <h2 className="font-bold">Prize & Entry</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Prize Type</Label>
                <Select value={prizeType} onValueChange={(v) => setPrizeType(v as "cash" | "gift_card")}>
                  <SelectTrigger className="mt-1.5 bg-[hsl(var(--sb-surface-2))] border-[hsl(var(--sb-border))]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash (paid pool)</SelectItem>
                    <SelectItem value="gift_card">Gift Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Prize Description</Label>
                <Input
                  value={prizeDescription}
                  onChange={(e) => setPrizeDescription(e.target.value)}
                  placeholder="e.g. $500 cash + trophy"
                  className="mt-1.5 bg-[hsl(var(--sb-surface-2))] border-[hsl(var(--sb-border))] focus-visible:ring-[hsl(var(--sb-cyan))]"
                />
              </div>
            </div>

            {prizeType === "gift_card" && (
              <div>
                <Label className="text-sm font-medium">Gift Card Code (sent to winning team captain)</Label>
                <Input
                  value={giftCardCode}
                  onChange={(e) => setGiftCardCode(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX"
                  className="mt-1.5 bg-[hsl(var(--sb-surface-2))] border-[hsl(var(--sb-border))] focus-visible:ring-[hsl(var(--sb-cyan))]"
                />
              </div>
            )}

            {prizeType === "cash" && (
              <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--sb-border))] p-3 bg-[hsl(var(--sb-surface-2))]">
                <div>
                  <p className="text-sm font-medium">Charge entry fee</p>
                  <p className="text-xs sb-text-muted">Captains pay via Stripe to register their team</p>
                </div>
                <Switch checked={entryFeeEnabled} onCheckedChange={setEntryFeeEnabled} />
              </div>
            )}

            {prizeType === "cash" && entryFeeEnabled && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Entry Fee per Team ($)</Label>
                  <div className="relative mt-1.5">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sb-text-muted" />
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      className="pl-9 bg-[hsl(var(--sb-surface-2))] border-[hsl(var(--sb-border))] focus-visible:ring-[hsl(var(--sb-cyan))]"
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-[hsl(var(--sb-cyan))]/30 p-3 bg-[hsl(var(--sb-cyan-soft))]">
                  <p className="text-xs sb-text-muted">
                    ℹ️ A {platformFeePercent}% platform fee is deducted from the prize pool. The winning team receives{" "}
                    <span className="font-semibold text-foreground">{Math.max(0, 100 - platformFeePercent)}%</span>{" "}
                    of total entries collected. No fee applies to gift card prizes.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Preview */}
          {title && (
            <section className="rounded-xl border-2 border-dashed border-[hsl(var(--sb-cyan))]/40 bg-[hsl(var(--sb-cyan-soft))] p-5">
              <h3 className="font-bold text-sm sb-cyan mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Tournament Preview
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="sb-text-muted">Title:</span> <span className="font-medium">{title}</span></p>
                <p><span className="sb-text-muted">Format:</span> <span className="font-medium">{selectedFormat?.label}</span></p>
                <p><span className="sb-text-muted">Scoring:</span> <span className="font-medium">{selectedScoring?.label}</span></p>
                <p><span className="sb-text-muted">Teams:</span> <span className="font-medium">Up to {maxParticipants}</span></p>
                {startDate && (
                  <p><span className="sb-text-muted">Starts:</span> <span className="font-medium">{new Date(startDate).toLocaleString()}</span></p>
                )}
                {prizeType === "cash" && entryFeeEnabled && (
                  <p><span className="sb-text-muted">Entry:</span> <span className="font-medium">${entryFee} per team</span></p>
                )}
                {prizeDescription && (
                  <p><span className="sb-text-muted">Prize:</span> <span className="font-medium">{prizeDescription}</span></p>
                )}
                {selectedTeam && (
                  <p><span className="sb-text-muted">Your Team:</span> <span className="font-medium">{selectedTeam.name}</span></p>
                )}
              </div>
            </section>
          )}

          {/* Submit */}
          <div className="flex gap-3 pb-6">
            <Button
              variant="outline"
              className="flex-1 border-[hsl(var(--sb-border))] bg-[hsl(var(--sb-surface-2))] hover:bg-[hsl(var(--sb-surface))]"
              onClick={() => navigate("/app/tournaments")}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2 sb-bg-cyan border-0 hover:opacity-90"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !title.trim() || !registrationEnd || !startDate || !creatorTeamId}
            >
              <Trophy className="h-4 w-4" />
              {createMutation.isPending ? "Creating..." : "Launch Tournament"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTournament;
