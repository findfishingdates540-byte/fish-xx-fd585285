import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bold, Camera, Eye, ImagePlus, Italic, ListOrdered, Loader2, ScrollText } from "lucide-react";
import { FormattedRules } from "@/lib/format-rules";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  team: any;
}

async function uploadImage(userId: string, kind: "logo" | "cover", file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/team-${kind}s/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("catch-photos").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("catch-photos").getPublicUrl(path);
  return data.publicUrl;
}

export function EditTeamDialog({ open, onOpenChange, team }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [name, setName] = useState(team.name || "");
  const [description, setDescription] = useState(team.description || "");
  const [location, setLocation] = useState(team.location || "");
  const [website, setWebsite] = useState(team.website || "");
  const [rules, setRules] = useState(team.rules || "");
  const rulesRef = useRef<HTMLTextAreaElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(team.logo_url);
  const [coverPreview, setCoverPreview] = useState<string | null>(team.cover_url);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const handleLogo = (f: File | null) => {
    if (!f) return;
    setLogoFile(f);
    const r = new FileReader();
    r.onloadend = () => setLogoPreview(r.result as string);
    r.readAsDataURL(f);
  };
  const handleCover = (f: File | null) => {
    if (!f) return;
    setCoverFile(f);
    const r = new FileReader();
    r.onloadend = () => setCoverPreview(r.result as string);
    r.readAsDataURL(f);
  };

  const wrapSelection = (before: string, after = before) => {
    const ta = rulesRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? rules.length;
    const end = ta.selectionEnd ?? rules.length;
    const sel = rules.slice(start, end) || "text";
    const next = rules.slice(0, start) + before + sel + after + rules.slice(end);
    setRules(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + sel.length);
    });
  };

  const insertNumberedTemplate = () => {
    const ta = rulesRef.current;
    const tpl = "1. Be respectful.\n2. No spam or self-promo.\n3. Keep posts fishing-related.";
    const next = rules.trim() ? rules + "\n\n" + tpl : tpl;
    setRules(next);
    requestAnimationFrame(() => ta?.focus());
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be signed in");
      if (!name.trim()) throw new Error("Name is required");
      const updates: Record<string, any> = {
        name: name.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
        rules: rules.trim() || null,
      };
      if (logoFile) updates.logo_url = await uploadImage(user.id, "logo", logoFile);
      if (coverFile) updates.cover_url = await uploadImage(user.id, "cover", coverFile);
      const { error } = await supabase.from("fishing_teams").update(updates).eq("id", team.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-detail", team.id] });
      qc.invalidateQueries({ queryKey: ["all-teams"] });
      toast.success("Page updated");
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message || "Failed to update"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit team page</DialogTitle>
          <DialogDescription>Update your cover, logo, About, and Rules. Captains only.</DialogDescription>
        </DialogHeader>

        {/* Cover */}
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cover banner</Label>
          <button
            type="button"
            onClick={() => coverInput.current?.click()}
            className="mt-1.5 relative w-full h-32 rounded-lg overflow-hidden border bg-gradient-to-br from-primary/40 via-primary/20 to-primary/5 group"
          >
            {coverPreview ? (
              <img src={coverPreview} alt="" className="w-full h-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-xs font-medium">
              <ImagePlus className="h-4 w-4" /> Change cover
            </div>
          </button>
          <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={(e) => handleCover(e.target.files?.[0] || null)} />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-4 -mt-2">
          <button
            type="button"
            onClick={() => logoInput.current?.click()}
            className="relative w-20 h-20 rounded-2xl bg-muted overflow-hidden border ring-2 ring-card grid place-items-center text-xl font-bold text-primary group shrink-0"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{name.slice(0, 2).toUpperCase() || "—"}</span>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition grid place-items-center">
              <Camera className="h-4 w-4 text-white" />
            </div>
          </button>
          <div className="text-xs text-muted-foreground">Tap the logo or cover to upload a new image (JPG/PNG).</div>
          <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0] || null)} />
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="t-name">Name</Label>
            <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          <div>
            <Label htmlFor="t-desc">About</Label>
            <Textarea id="t-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} placeholder="What's this team about?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="t-loc">Location</Label>
              <Input id="t-loc" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} placeholder="e.g. Tampa, FL" />
            </div>
            <div>
              <Label htmlFor="t-web">Website</Label>
              <Input id="t-web" value={website} onChange={(e) => setWebsite(e.target.value)} maxLength={200} placeholder="https://…" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label htmlFor="t-rules" className="m-0">Group rules</Label>
              <span className="text-[10px] text-muted-foreground">{rules.length}/2000</span>
            </div>
            <div className="flex flex-wrap items-center gap-1 mb-1.5">
              <Button type="button" variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs" onClick={() => wrapSelection("**")}>
                <Bold className="h-3 w-3" /> Bold
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs" onClick={() => wrapSelection("*")}>
                <Italic className="h-3 w-3" /> Italic
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs" onClick={insertNumberedTemplate}>
                <ListOrdered className="h-3 w-3" /> Numbered list
              </Button>
              <span className="text-[10px] text-muted-foreground ml-auto inline-flex items-center gap-1">
                <Eye className="h-3 w-3" /> Live preview below
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Textarea
                id="t-rules"
                ref={rulesRef}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={8}
                maxLength={2000}
                className="font-mono text-xs"
                placeholder={`1. Be respectful.\n2. No spam or self-promo.\n3. Keep posts fishing-related.\n\nUse **bold** or *italic* for emphasis.`}
              />
              <div className="rounded-xl border bg-card p-4 max-h-64 overflow-y-auto">
                <h4 className="font-bold text-xs mb-2 flex items-center gap-1.5">
                  <ScrollText className="h-3.5 w-3.5 text-primary" /> Sidebar preview
                </h4>
                {rules.trim() ? (
                  <FormattedRules text={rules} className="text-xs text-foreground/90" />
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">Your formatted rules will appear here in the team's right sidebar.</p>
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Supports <code>**bold**</code>, <code>*italic*</code>, numbered (<code>1.</code>) and bulleted (<code>-</code>) lists.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-1.5">
            {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
