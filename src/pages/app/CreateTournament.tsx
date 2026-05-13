import { useRef, useState } from "react";
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
  const { data: platformFeePercent = 10 } = usePlatformFeePercent();

  // Verify the creator either captains or belongs to a team — tournaments are team-only.
  const { data: teamMembership, isLoading: teamCheckLoading } = useQuery({
    queryKey: ["tournament-creator-team", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [captainRes, memberRes] = await Promise.all([
        supabase.from("fishing_teams").select("id, name").eq("captain_id", user!.id).limit(1),
        supabase.from("team_members").select("team_id").eq("user_id", user!.id).limit(1),
      ]);
      const isCaptain = (captainRes.data?.length ?? 0) > 0;
      const isMember = (memberRes.data?.length ?? 0) > 0;
      return { isCaptain, isMember, hasTeam: isCaptain || isMember };
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
      } as any).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success("Tournament created!");
      navigate(`/app/tournaments/${data.id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (gateLoading) {
    return <div className="max-w-lg mx-auto px-4 py-12 text-center text-muted-foreground">Loading…</div>;
  }

  if (!canCreate) {
    const requirementLabel =
      requirement === "premium" ? "Premium members" :
      requirement === "verified" ? "Verified users" :
      requirement === "admin" ? "Admins" : "logged-in users";
    return (
      <div className="max-w-lg mx-auto px-4 pb-32">
        <div className="flex items-center gap-3 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Create Tournament</h1>
        </div>
        <div className="rounded-xl border bg-card p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Tournament hosting is restricted</h2>
          <p className="text-sm text-muted-foreground">
            Only {requirementLabel} can create tournaments right now.
          </p>
          {requirement === "premium" && (
            <Button asChild className="w-full">
              <Link to="/pricing">Upgrade to Premium</Link>
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={() => navigate("/app/tournaments")}>
            Back to tournaments
          </Button>
        </div>
      </div>
    );
  }

  if (teamCheckLoading) {
    return <div className="max-w-lg mx-auto px-4 py-12 text-center text-muted-foreground">Checking team membership…</div>;
  }

  if (!teamMembership?.hasTeam) {
    return (
      <div className="max-w-lg mx-auto px-4 pb-32">
        <div className="flex items-center gap-3 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Create Tournament</h1>
        </div>
        <div className="rounded-xl border bg-card p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">You need a team first</h2>
          <p className="text-sm text-muted-foreground">
            Tournaments are team-based. You must be the captain of a team — or a member of one — before you can host a tournament.
          </p>
          <div className="grid gap-2">
            <Button asChild className="w-full">
              <Link to="/app/teams/new">Create a team</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/app/teams">Browse teams to join</Link>
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate("/app/tournaments")}>
              Back to tournaments
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const selectedFormat = FORMAT_OPTIONS.find((f) => f.value === format);
  const selectedScoring = SCORING_OPTIONS.find((s) => s.value === scoring);

  return (
    <div className="pb-24 min-h-screen">
      {/* Banner hero */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img
          src={bannerPreview || defaultBanner}
          alt="Tournament banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app/tournaments")}
            className="bg-background/60 backdrop-blur-sm hover:bg-background/80"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-lg bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-colors text-sm font-medium"
        >
          <ImagePlus className="h-4 w-4" />
          {bannerPreview ? "Change Banner" : "Upload Banner"}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <Badge className="bg-primary/90 text-primary-foreground border-0 mb-2">
            <Swords className="h-3 w-3 mr-1" /> New Tournament
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {title || "Create Your Tournament"}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 -mt-2">
        <div className="space-y-6 mt-6">
          {/* Teams-only notice */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
            <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-foreground mb-0.5">Team-based bracket</p>
              <p className="text-muted-foreground">
                Tournaments are played between teams. Only team captains can register a team to compete in your bracket.
              </p>
            </div>
          </div>

          {/* Basic Info */}
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Tournament Details</h2>
            </div>
            <div>
              <Label className="text-sm font-medium">Tournament Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Spring Bass Showdown 2026"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's at stake, the vibe, sponsors, anything teams should know before they register…"
                rows={4}
                className="mt-1.5"
              />
            </div>
          </section>

          {/* Format */}
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Swords className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Bracket Format</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                    format === f.value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                  }`}
                >
                  <span className="text-2xl block mb-2">{f.icon}</span>
                  <p className="font-semibold text-sm">{f.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                  {format === f.value && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Scoring */}
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Scoring & Seeding</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SCORING_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setScoring(s.value)}
                  className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                    scoring === s.value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                  }`}
                >
                  <span className="text-xl block mb-1">{s.icon}</span>
                  <p className="font-semibold text-xs">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{s.description}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <Label className="text-sm font-medium">Seeding Method</Label>
                <Select value={seeding} onValueChange={setSeeding}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
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
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
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
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Schedule</h2>
            </div>
            <div>
              <Label className="text-sm font-medium">Registration Closes *</Label>
              <Input
                type="datetime-local"
                value={registrationEnd}
                onChange={(e) => setRegistrationEnd(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Start Date *</Label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">End Date</Label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            {startDate && endDate && new Date(endDate) > new Date(startDate) && (
              <p className="text-xs text-muted-foreground">
                Duration: {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            )}
          </section>

          {/* Prizes */}
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Prize & Entry</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Prize Type</Label>
                <Select value={prizeType} onValueChange={(v) => setPrizeType(v as "cash" | "gift_card")}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
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
                  className="mt-1.5"
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
                  className="mt-1.5"
                />
              </div>
            )}

            {prizeType === "cash" && (
              <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Charge entry fee</p>
                  <p className="text-xs text-muted-foreground">Captains pay via Stripe to register their team</p>
                </div>
                <Switch checked={entryFeeEnabled} onCheckedChange={setEntryFeeEnabled} />
              </div>
            )}

            {prizeType === "cash" && entryFeeEnabled && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Entry Fee per Team ($)</Label>
                  <div className="relative mt-1.5">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="rounded-lg border p-3 bg-primary/5">
                  <p className="text-xs text-muted-foreground">
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
            <section className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
              <h3 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Tournament Preview
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Title:</span> <span className="font-medium">{title}</span></p>
                <p><span className="text-muted-foreground">Format:</span> <span className="font-medium">{selectedFormat?.label}</span></p>
                <p><span className="text-muted-foreground">Scoring:</span> <span className="font-medium">{selectedScoring?.label}</span></p>
                <p><span className="text-muted-foreground">Teams:</span> <span className="font-medium">Up to {maxParticipants}</span></p>
                {startDate && (
                  <p><span className="text-muted-foreground">Starts:</span> <span className="font-medium">{new Date(startDate).toLocaleString()}</span></p>
                )}
                {prizeType === "cash" && entryFeeEnabled && (
                  <p><span className="text-muted-foreground">Entry:</span> <span className="font-medium">${entryFee} per team</span></p>
                )}
                {prizeDescription && (
                  <p><span className="text-muted-foreground">Prize:</span> <span className="font-medium">{prizeDescription}</span></p>
                )}
              </div>
            </section>
          )}

          {/* Submit */}
          <div className="flex gap-3 pb-6">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/app/tournaments")}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !title.trim() || !registrationEnd || !startDate}
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
