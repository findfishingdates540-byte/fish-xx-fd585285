import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Users,
  Trophy,
  Shield,
  Sparkles,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "jr_anglers", label: "Junior Angler", description: "Boys & girls 17 and under", emoji: "🌱" },
  { value: "lady_angler", label: "Lady Angler", description: "Women anglers 18 and up", emoji: "👩" },
  { value: "all_anglers", label: "All Anglers", description: "Open to all anglers, any age or gender", emoji: "🎣" },
  { value: "teams", label: "Teams", description: "General fishing team", emoji: "🏆" },
];

const TEAM_TYPES = [
  { value: "team", label: "Team", description: "A group of anglers fishing together" },
  { value: "charter_boat", label: "Charter Boat", description: "A licensed charter operation" },
];

export default function CreateTeam() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("teams");
  const [teamType, setTeamType] = useState("team");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      if (!name.trim()) throw new Error("Team name is required");

      let logoUrl: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `${user.id}/team-logos/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("catch-photos").upload(path, logoFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("catch-photos").getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase.from("fishing_teams").insert({
        name: name.trim(),
        description: description.trim() || null,
        skill_level: 'beginner' as any,
        captain_id: user.id,
        logo_url: logoUrl,
        category: category,
        team_type: teamType,
        location: location.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
      }).select("id").single();
      if (error) throw error;

      // Captain automatically joins as member
      await supabase.from("team_members").insert({
        team_id: data.id,
        user_id: user.id,
        role: "captain",
      });

      return data.id;
    },
    onSuccess: (teamId) => {
      queryClient.invalidateQueries({ queryKey: ["all-teams"] });
      toast.success("Team created! 🎉");
      navigate(`/app/teams/${teamId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const selectedCategory = CATEGORIES.find((c) => c.value === category);

  return (
    <div className="pb-24 min-h-screen">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/teams")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Create a Team</h1>
            <p className="text-xs text-muted-foreground">Build your fishing squad and compete together</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        {/* Team Logo */}
        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Team Identity</h2>
          </div>
          <div className="flex items-center gap-5 mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors shrink-0"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            <div>
              <p className="text-sm font-medium">Team Logo</p>
              <p className="text-xs text-muted-foreground">Optional. Upload a square image for your team badge.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Team Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Reel Warriors" className="mt-1.5" maxLength={50} />
              <p className="text-[10px] text-muted-foreground mt-1">{name.length}/50 characters</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell others about your team's goals, fishing style, and what kind of members you're looking for..."
                rows={3}
                className="mt-1.5"
              />
            </div>
          </div>
        </section>

        {/* Type & Contact */}
        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Type & Contact</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Team Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {TEAM_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTeamType(t.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      teamType === t.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <p className="font-semibold text-sm">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Location <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Miami, FL" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm font-medium">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" className="mt-1.5" type="tel" />
            </div>
            <div>
              <Label className="text-sm font-medium">Website <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" className="mt-1.5" type="url" />
            </div>
          </div>
        </section>

        {/* Category */}
        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Team Category</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Choose the category for your team. This determines which group you compete in.</p>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  category === cat.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
                {category === cat.value && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Sparkles className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Preview */}
        {name && (
          <section className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
            <h3 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Team Preview
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-bold">{name}</p>
                <p className="text-xs text-muted-foreground">{selectedCategory?.label} • You as Captain</p>
              </div>
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/app/teams")}>Cancel</Button>
          <Button
            className="flex-1 gap-2"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !name.trim()}
          >
            <Users className="h-4 w-4" />
            {createMutation.isPending ? "Creating..." : "Create Team"}
          </Button>
        </div>
      </div>
    </div>
  );
}
