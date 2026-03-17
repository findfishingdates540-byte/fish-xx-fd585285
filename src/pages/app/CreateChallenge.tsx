import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ImagePlus,
  Trophy,
  Fish,
  Calendar,
  DollarSign,
  Users,
  Target,
  Sparkles,
  X,
  MapPin,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import defaultBanner from "@/assets/challenge-banner-default.jpg";

const CHALLENGE_TYPES = [
  { value: "largest_fish", label: "Largest Fish", description: "Biggest single catch by weight wins", icon: "🐟" },
  { value: "most_caught", label: "Most Caught", description: "Total number of catches wins", icon: "🎯" },
  { value: "total_weight", label: "Total Weight", description: "Combined weight of all catches wins", icon: "⚖️" },
  { value: "species_variety", label: "Species Variety", description: "Most unique species caught wins", icon: "🌈" },
];

export default function CreateChallenge() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [challengeType, setChallengeType] = useState("largest_fish");
  const [targetSpecies, setTargetSpecies] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [location, setLocation] = useState("");
  const [isOfficial, setIsOfficial] = useState(false);
  const [rules, setRules] = useState("");

  const { data: speciesList = [] } = useQuery({
    queryKey: ["challenge-species-list"],
    queryFn: async () => {
      const { data } = await supabase.from("fish_species").select("id, name").order("name");
      return data || [];
    },
  });

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
      if (!user) throw new Error("Must be logged in");
      if (!title.trim()) throw new Error("Title is required");
      if (!startDate || !endDate) throw new Error("Start and end dates are required");
      if (new Date(endDate) <= new Date(startDate)) throw new Error("End date must be after start date");

      let bannerUrl: string | null = null;
      if (bannerFile) {
        const ext = bannerFile.name.split(".").pop();
        const path = `challenge-banners/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("catch-photos").upload(path, bannerFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("catch-photos").getPublicUrl(path);
        bannerUrl = urlData.publicUrl;
      }

      const prizes: Record<string, any> = {};
      if (prizePool) prizes.total = Number(prizePool);
      if (maxParticipants) prizes.max_participants = Number(maxParticipants);
      if (bannerUrl) prizes.banner_url = bannerUrl;
      if (location) prizes.location = location;

      const rulesObj: Record<string, any> = {};
      if (rules.trim()) rulesObj.description = rules.trim();

      const { error } = await supabase.from("fishing_challenges").insert({
        title: title.trim(),
        description: description.trim() || null,
        challenge_type: challengeType as any,
        target_species_name: targetSpecies && targetSpecies !== "any" ? targetSpecies : null,
        species_id: speciesList.find((s) => s.name === targetSpecies)?.id || null,
        start_date: startDate,
        end_date: endDate,
        created_by: user.id,
        is_official: isOfficial,
        prizes,
        rules: rulesObj,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fishing-challenges"] });
      toast.success("Challenge created successfully! 🏆");
      navigate("/app/challenges");
    },
    onError: (err) => toast.error(err.message),
  });

  const selectedTypeInfo = CHALLENGE_TYPES.find((t) => t.value === challengeType);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="pb-24 min-h-screen">
      {/* Banner Section */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img
          src={bannerPreview || defaultBanner}
          alt="Challenge banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/challenges")} className="bg-background/60 backdrop-blur-sm hover:bg-background/80">
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
          <Badge className="bg-primary/90 text-primary-foreground border-0 mb-2">New Challenge</Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title || "Create Your Challenge"}</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 -mt-2">
        {/* Main Form */}
        <div className="space-y-6 mt-6">
          {/* Basic Info */}
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Challenge Details</h2>
            </div>
            <div>
              <Label className="text-sm font-medium">Challenge Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekend Bass Blitz Championship"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what makes this challenge exciting, any backstory, and what participants can expect..."
                rows={4}
                className="mt-1.5"
              />
            </div>
          </section>

          {/* Challenge Type Selector */}
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Competition Format</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CHALLENGE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setChallengeType(type.value)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                    challengeType === type.value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                  }`}
                >
                  <span className="text-2xl block mb-2">{type.icon}</span>
                  <p className="font-semibold text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                  {challengeType === type.value && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Species & Location */}
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Fish className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Species & Location</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Target Species</Label>
                <Select value={targetSpecies} onValueChange={setTargetSpecies}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Any species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Species</SelectItem>
                    {speciesList.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Location (optional)</Label>
                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Lake Erie, Ohio"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Schedule</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Start Date *</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={today} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm font-medium">End Date *</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || today} className="mt-1.5" />
              </div>
            </div>
            {startDate && endDate && new Date(endDate) > new Date(startDate) && (
              <p className="text-xs text-muted-foreground">
                Duration: {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            )}
          </section>

          {/* Prizes & Limits */}
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Prizes & Participation</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Prize Pool ($)</Label>
                <div className="relative mt-1.5">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    placeholder="0"
                    className="pl-9"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Max Participants</Label>
                <div className="relative mt-1.5">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    placeholder="Unlimited"
                    className="pl-9"
                    min="2"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Rules */}
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Rules & Guidelines</h2>
            </div>
            <Textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Outline the rules for this challenge. E.g.: &#10;• All catches must include a measurement photo&#10;• Fish must be caught within the specified area&#10;• Catch-and-release only&#10;• No live bait"
              rows={5}
            />
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <div>
                <p className="text-sm font-medium">Official Challenge</p>
                <p className="text-xs text-muted-foreground">Mark as an officially sanctioned event</p>
              </div>
              <Switch checked={isOfficial} onCheckedChange={setIsOfficial} />
            </div>
          </section>

          {/* Preview Summary */}
          {title && (
            <section className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
              <h3 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Challenge Preview
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Title:</span> <span className="font-medium">{title}</span></p>
                <p><span className="text-muted-foreground">Format:</span> <span className="font-medium">{selectedTypeInfo?.label}</span></p>
                {targetSpecies && targetSpecies !== "any" && (
                  <p><span className="text-muted-foreground">Species:</span> <span className="font-medium">{targetSpecies}</span></p>
                )}
                {startDate && endDate && (
                  <p><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}</span></p>
                )}
                {prizePool && <p><span className="text-muted-foreground">Prize Pool:</span> <span className="font-medium">${Number(prizePool).toLocaleString()}</span></p>}
                {location && <p><span className="text-muted-foreground">Location:</span> <span className="font-medium">{location}</span></p>}
              </div>
            </section>
          )}

          {/* Submit */}
          <div className="flex gap-3 pb-6">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/app/challenges")}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !title.trim() || !startDate || !endDate}
            >
              <Trophy className="h-4 w-4" />
              {createMutation.isPending ? "Creating..." : "Launch Challenge"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
