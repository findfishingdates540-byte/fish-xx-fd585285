import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Upload } from "lucide-react";
import { usePlatformFeePercent } from "@/hooks/use-platform-fee";

export default function CreatePhotoChallenge() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [entryFee, setEntryFee] = useState("5");
  const [entryFeeEnabled, setEntryFeeEnabled] = useState(true);
  const [isAdminFunded, setIsAdminFunded] = useState(false);
  const [prizeType, setPrizeType] = useState("cash");
  const [prizeDescription, setPrizeDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [votingEndDate, setVotingEndDate] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: platformFeePercent = 10 } = usePlatformFeePercent();

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!title || !startDate || !endDate || !votingEndDate) {
        throw new Error("Please fill all required fields");
      }

      const startMs = new Date(startDate).getTime();
      const endMs = new Date(endDate).getTime();
      const voteEndMs = new Date(votingEndDate).getTime();
      if (endMs <= startMs) {
        throw new Error("Submissions end date must be after the start date");
      }
      if (voteEndMs <= endMs) {
        throw new Error(
          "Voting end date must be AFTER submissions end — otherwise nobody can vote",
        );
      }
      // Require at least a 1-hour voting window so users actually have time to vote
      if (voteEndMs - endMs < 60 * 60 * 1000) {
        throw new Error("Voting window must be at least 1 hour long");
      }

      const { error } = await supabase.from("photo_challenges").insert({
        title,
        description: description || null,
        banner_url: bannerUrl || null,
        entry_fee: entryFeeEnabled ? parseFloat(entryFee) || 0 : 0,
        entry_fee_enabled: entryFeeEnabled,
        platform_fee_percent:
          entryFeeEnabled && prizeType === "cash"
            ? Math.min(100, Math.max(0, platformFeePercent))
            : 0,
        is_admin_funded: !entryFeeEnabled ? isAdminFunded : false,
        prize_type: prizeType,
        prize_description: prizeDescription || null,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        voting_end_date: new Date(votingEndDate).toISOString(),
        status: "upcoming",
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Photo Challenge created!" });
      navigate("/app/photo-challenges");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/photo-challenge-banners/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("catch-photos")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("catch-photos").getPublicUrl(path);
      setBannerUrl(data.publicUrl);
      toast({ title: "Banner uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/photo-challenges")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> Create Photo Challenge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Banner */}
          <div className="space-y-2">
            <Label>Banner Image</Label>
            {bannerUrl ? (
              <div className="relative h-40 rounded-lg overflow-hidden">
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-2 right-2"
                  onClick={() => fileRef.current?.click()}
                >
                  Change
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm">{uploading ? "Uploading..." : "Upload banner"}</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              placeholder="e.g. Best Bass Shot March 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Theme details, rules, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Entry Fee + Prize */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
            <div>
              <p className="text-sm font-medium">Require Entry Fee</p>
              <p className="text-xs text-muted-foreground">
                Off = free challenge (you fund the prize)
              </p>
            </div>
            <Switch checked={entryFeeEnabled} onCheckedChange={setEntryFeeEnabled} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {entryFeeEnabled && (
              <div className="space-y-2">
                <Label>Entry Fee ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.50"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Prize Type</Label>
              <Select value={prizeType} onValueChange={setPrizeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gift_card">Gift Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {entryFeeEnabled && prizeType === "cash" && (
            <div className="rounded-lg border p-3 bg-primary/5">
              <p className="text-xs text-muted-foreground">
                ℹ️ A {platformFeePercent}% platform fee is deducted from the prize pool. The winner receives{" "}
                <span className="font-semibold text-foreground">{Math.max(0, 100 - platformFeePercent)}%</span>{" "}
                of the total pool. No fee applies to gift card prizes.
              </p>
            </div>
          )}

          {!entryFeeEnabled && (
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <div>
                <p className="text-sm font-medium">Admin-funded prize</p>
                <p className="text-xs text-muted-foreground">
                  Mark if you (admin) are funding the prize directly
                </p>
              </div>
              <Switch checked={isAdminFunded} onCheckedChange={setIsAdminFunded} />
            </div>
          )}

          {prizeType === "gift_card" && (
            <div className="space-y-2">
              <Label>Prize Description</Label>
              <Input
                placeholder="e.g. $50 Bass Pro Gift Card"
                value={prizeDescription}
                onChange={(e) => setPrizeDescription(e.target.value)}
              />
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Submissions End *</Label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Voting End *</Label>
              <Input
                type="datetime-local"
                value={votingEndDate}
                onChange={(e) => setVotingEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !title || !startDate || !endDate || !votingEndDate}
            className="w-full"
          >
            {createMutation.isPending ? "Creating..." : "Create Photo Challenge"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
