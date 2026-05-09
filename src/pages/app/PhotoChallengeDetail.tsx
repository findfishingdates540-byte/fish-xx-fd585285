import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lightbox } from "@/components/ui/lightbox";
import { LiveCameraCapture, type CaptureMetadata } from "@/components/ui/live-camera-capture";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Camera, Clock, Crown, DollarSign, Gift, Heart,
  Trophy, Upload, Users, Vote, ImageIcon, CreditCard, Copy, CheckCircle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function PhotoChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [payingEntry, setPayingEntry] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [capturePreview, setCapturePreview] = useState<string | null>(null);
  const [pendingCapture, setPendingCapture] = useState<CaptureMetadata | null>(null);

  // Handle payment callback — mark entry as paid client-side as a fallback
  // in case the Stripe webhook is delayed or fails
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment || !user || !id) return;

    if (payment === "success") {
      // Optimistically mark the entry as paid to handle webhook race condition
      const markPaid = async () => {
        const { error } = await supabase
          .from("photo_challenge_entries")
          .update({ has_paid: true })
          .eq("challenge_id", id)
          .eq("user_id", user.id);
        if (error) {
          console.error("Fallback payment update failed:", error);
        }
        qc.invalidateQueries({ queryKey: ["photo-challenge-entries", id] });
      };
      markPaid();
      toast({ title: "Payment successful!", description: "Your entry fee has been paid." });
    } else if (payment === "cancelled") {
      toast({ title: "Payment cancelled", description: "You can pay later to complete your entry.", variant: "destructive" });
    }
  }, [searchParams, id, qc, user]);

  // Fetch challenge
  const { data: challenge, isLoading } = useQuery({
    queryKey: ["photo-challenge", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_photo_challenges_safe");
      if (error) throw error;
      // Find the specific challenge by id
      const challenges = data || [];
      return challenges.find((c: any) => c.id === id) || null;
    },
    enabled: !!id,
  });

  // Fetch entries with profiles
  const { data: entries = [] } = useQuery({
    queryKey: ["photo-challenge-entries", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photo_challenge_entries")
        .select("*")
        .eq("challenge_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data || []).map((e: any) => e.user_id))];
      const { data: profiles } = await supabase
        .from("profiles_safe")
        .select("id, display_name, photos")
        .in("id", userIds);

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => (profileMap[p.id] = p));

      return (data || []).map((e: any) => ({
        ...e,
        profile: profileMap[e.user_id] || null,
      }));
    },
    enabled: !!id,
  });

  // Fetch votes
  const { data: votes = [] } = useQuery({
    queryKey: ["photo-challenge-votes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photo_challenge_votes")
        .select("*")
        .eq("challenge_id", id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch tally for completed
  const { data: tally = [] } = useQuery({
    queryKey: ["photo-challenge-tally", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("tally_photo_challenge_votes", {
        p_challenge_id: id!,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id && challenge?.status === "completed",
  });

  // Fetch prize payout for current user (winner check)
  const { data: myPayout } = useQuery({
    queryKey: ["my-prize-payout", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prize_payouts")
        .select("*")
        .eq("challenge_id", id!)
        .eq("winner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      // Mark as claimed when winner views it
      if (data && data.status === "pending") {
        await supabase
          .from("prize_payouts")
          .update({ status: "claimed" } as any)
          .eq("id", data.id);
      }
      return data;
    },
    enabled: !!id && !!user && challenge?.status === "completed" && challenge?.winner_id === user?.id,
  });

  const myEntry = entries.find((e: any) => e.user_id === user?.id);
  const myVote = votes.find((v: any) => v.user_id === user?.id);
  const paidEntries = entries.filter((e: any) => e.has_paid).length;
  const grossPool = (challenge?.entry_fee || 0) * paidEntries;
  const platformFeePct = (challenge as any)?.platform_fee_percent ?? 10;
  const prizePool =
    (challenge as any)?.prize_type === "cash" && (challenge as any)?.entry_fee_enabled
      ? grossPool * (1 - platformFeePct / 100)
      : grossPool;

  const voteCounts: Record<string, number> = {};
  votes.forEach((v: any) => {
    voteCounts[v.entry_id] = (voteCounts[v.entry_id] || 0) + 1;
  });

  // Submit entry (photo first, then pay)
  const submitEntry = useMutation({
    mutationFn: async ({ photoUrl, metadata }: { photoUrl: string; metadata: CaptureMetadata }) => {
      const isFree = !challenge?.entry_fee || Number(challenge.entry_fee) === 0;
      const { error } = await supabase.from("photo_challenge_entries").insert({
        challenge_id: id!,
        user_id: user!.id,
        photo_url: photoUrl,
        caption: caption || null,
        has_paid: isFree, // Free challenges are auto-paid
        captured_at: metadata.capturedAt,
        location_lat: metadata.locationLat,
        location_lng: metadata.locationLng,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      const isFree = !challenge?.entry_fee || Number(challenge.entry_fee) === 0;
      toast({
        title: isFree ? "Entry submitted!" : "Photo captured!",
        description: isFree ? "Good luck in the challenge!" : "Now complete your entry by paying the fee.",
      });
      setCaption("");
      setCapturePreview(null);
      setPendingCapture(null);
      qc.invalidateQueries({ queryKey: ["photo-challenge-entries", id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Pay entry fee via Stripe
  const payEntryFee = async () => {
    if (!challenge || !user) return;
    setPayingEntry(true);
    try {
      const isInIframe = window.self !== window.top;
      const pendingTab = isInIframe ? window.open("about:blank", "_blank") : null;

      const { data, error } = await supabase.functions.invoke("photo-challenge-checkout", {
        body: {
          challengeId: id,
          entryFee: challenge.entry_fee,
          challengeTitle: challenge.title,
          successUrl: `${window.location.origin}/app/photo-challenges/${id}?payment=success`,
          cancelUrl: `${window.location.origin}/app/photo-challenges/${id}?payment=cancelled`,
        },
      });

      if (error) {
        if (pendingTab) pendingTab.close();
        throw new Error(error.message || "Failed to create checkout");
      }

      const url = data?.url;
      if (!url) {
        if (pendingTab) pendingTab.close();
        throw new Error("No checkout URL returned");
      }

      if (pendingTab) {
        pendingTab.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (err: any) {
      toast({ title: "Payment Error", description: err.message, variant: "destructive" });
    } finally {
      setPayingEntry(false);
    }
  };

  // Cast vote
  const castVote = useMutation({
    mutationFn: async (entryId: string) => {
      if (myVote) {
        await supabase.from("photo_challenge_votes").delete().eq("id", myVote.id);
      }
      const { error } = await supabase.from("photo_challenge_votes").insert({
        challenge_id: id!,
        entry_id: entryId,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Vote cast!" });
      qc.invalidateQueries({ queryKey: ["photo-challenge-votes", id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleLiveCapture = (metadata: CaptureMetadata) => {
    const reader = new FileReader();
    reader.onloadend = () => setCapturePreview(reader.result as string);
    reader.readAsDataURL(metadata.file);
    setPendingCapture(metadata);
  };

  const handleSubmitCapture = async () => {
    if (!pendingCapture || !user) return;
    setUploading(true);
    try {
      const ext = pendingCapture.file.name.split(".").pop() || "jpg";
      const path = `${user.id}/photo-challenges/${id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("catch-photos")
        .upload(path, pendingCapture.file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("catch-photos").getPublicUrl(path);
      await submitEntry.mutateAsync({ photoUrl: urlData.publicUrl, metadata: pendingCapture });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="h-48 rounded-xl bg-muted animate-pulse mb-6" />
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Challenge not found</p>
        <Button variant="outline" onClick={() => navigate("/app/photo-challenges")} className="mt-4">
          Back
        </Button>
      </div>
    );
  }

  const isSubmissionPhase = challenge.status === "submissions_open";
  const isVotingPhase = challenge.status === "voting";
  const isCompleted = challenge.status === "completed";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/photo-challenges")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Photo Challenges
      </Button>

      {/* Banner */}
      <div className="relative h-48 md:h-64 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
        {challenge.banner_url && (
          <img src={challenge.banner_url} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <Badge className="mb-2 capitalize">
            {challenge.status === "submissions_open" ? "Submissions Open" : challenge.status}
          </Badge>
          <h1 className="text-white text-2xl md:text-3xl font-bold">{challenge.title}</h1>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4">
        <Card className="flex items-center gap-2 px-4 py-3">
          <Users className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Entries</p>
            <p className="font-bold">{entries.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-2 px-4 py-3">
          <DollarSign className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Entry Fee</p>
            <p className="font-bold">${challenge.entry_fee}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-2 px-4 py-3">
          {challenge.prize_type === "gift_card" ? (
            <Gift className="h-4 w-4 text-primary" />
          ) : (
            <Trophy className="h-4 w-4 text-primary" />
          )}
          <div>
            <p className="text-xs text-muted-foreground">Prize</p>
            <p className="font-bold">
              {challenge.prize_type === "gift_card"
                ? challenge.prize_description || "Gift Card"
                : `$${prizePool.toFixed(0)}`}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-2 px-4 py-3">
          <Clock className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">
              {isSubmissionPhase ? "Submissions close" : isVotingPhase ? "Voting ends" : "Ended"}
            </p>
            <p className="font-bold text-sm">
              {isSubmissionPhase
                ? formatDistanceToNow(new Date(challenge.end_date), { addSuffix: true })
                : isVotingPhase
                ? formatDistanceToNow(new Date(challenge.voting_end_date), { addSuffix: true })
                : format(new Date(challenge.voting_end_date), "MMM d, yyyy")}
            </p>
          </div>
        </Card>
      </div>

      {challenge.description && (
        <p className="text-muted-foreground">{challenge.description}</p>
      )}

      {/* Winner Prize Card */}
      {isCompleted && myPayout && challenge.winner_id === user?.id && (
        <Card className="p-5 border-accent bg-accent/5 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            <h3 className="font-bold text-lg">🎉 You Won!</h3>
          </div>
          {myPayout.prize_type === "gift_card" && myPayout.gift_card_code ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{myPayout.prize_description || "Your gift card prize:"}</p>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                <code className="flex-1 font-mono text-sm font-bold tracking-wider">{myPayout.gift_card_code}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(myPayout.gift_card_code);
                    toast({ title: "Code copied!" });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Your prize: ${Number(myPayout.prize_amount || 0).toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {myPayout.status === "sent" ? (
                  <span className="flex items-center gap-1 text-primary">
                    <CheckCircle className="h-3 w-3" /> Payment has been sent!
                  </span>
                ) : (
                  "Your prize is being processed. The organizer will contact you."
                )}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Submission form - no entry yet */}
      {isSubmissionPhase && !myEntry && user && (
        <Card className="p-6 space-y-4 border-dashed border-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Camera className="h-5 w-5" /> Submit Your Entry
          </h2>
          <p className="text-sm text-muted-foreground">
            Take a live photo of your catch. Date, time, and GPS location are recorded automatically.
            After capturing, you'll pay the ${challenge.entry_fee} entry fee via Stripe.
          </p>
          <LiveCameraCapture
            onCapture={handleLiveCapture}
            preview={capturePreview}
            onClear={() => { setCapturePreview(null); setPendingCapture(null); }}
            label="Take a Live Photo"
            sublabel="Camera only — no gallery uploads"
            aspectRatio="aspect-square"
          />
          <Textarea
            placeholder="Add a caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
          />
          <Button
            onClick={handleSubmitCapture}
            disabled={uploading || !pendingCapture}
          >
            <Camera className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Submit Photo"}
          </Button>
        </Card>
      )}

      {/* Entry submitted but not paid (only for paid challenges) */}
      {isSubmissionPhase && myEntry && !myEntry.has_paid && Number(challenge.entry_fee) > 0 && (
        <Card className="p-5 border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Complete Your Entry</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Your photo has been uploaded! Pay the ${challenge.entry_fee} entry fee to finalize your submission.
          </p>
          <Button onClick={payEntryFee} disabled={payingEntry}>
            <CreditCard className="h-4 w-4 mr-2" />
            {payingEntry ? "Redirecting to Stripe..." : `Pay $${challenge.entry_fee} Entry Fee`}
          </Button>
        </Card>
      )}

      {/* Entry submitted and paid */}
      {isSubmissionPhase && myEntry && myEntry.has_paid && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <p className="text-sm font-medium text-primary">
            ✅ Entry submitted and paid! Good luck!
          </p>
        </Card>
      )}

      {isVotingPhase && (
        <Card className="p-4 bg-secondary/50">
          <p className="text-sm font-medium">
            <Vote className="h-4 w-4 inline mr-1" />
            Voting is open! Tap a photo to vote. You can only vote once.
            {myVote && " (You've already voted — tap another to change)"}
          </p>
        </Card>
      )}

      {/* Gallery */}
      <div>
        <h2 className="font-semibold text-lg mb-4">
          {isCompleted ? "Results" : "Entries"} ({entries.length})
        </h2>

        {entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No entries yet. Be the first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(isCompleted ? tally : entries).map((item: any) => {
              const entry = isCompleted
                ? entries.find((e: any) => e.id === item.entry_id) || item
                : item;
              const profile = entry.profile;
              const isWinner = isCompleted && item.rank === 1;
              const isMyVote = myVote?.entry_id === (entry.id || item.entry_id);
              const entryVotes = isCompleted
                ? Number(item.vote_count)
                : voteCounts[entry.id] || 0;
              const canVote =
                isVotingPhase && user && entry.user_id !== user.id;

              return (
                <div
                  key={entry.id || item.entry_id}
                  className={`group relative rounded-xl overflow-hidden border transition-all ${
                    isWinner ? "ring-2 ring-accent shadow-lg" : ""
                  } ${isMyVote ? "ring-2 ring-primary" : ""}`}
                >
                  <div
                    className="aspect-square cursor-pointer"
                    onClick={() => setLightboxUrl(entry.photo_url || item.photo_url)}
                  >
                    <img
                      src={entry.photo_url || item.photo_url}
                      alt={entry.caption || "Entry"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {isWinner && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-accent text-accent-foreground gap-1">
                        <Crown className="h-3 w-3" /> Winner
                      </Badge>
                    </div>
                  )}

                  {/* Unpaid badge */}
                  {!entry.has_paid && isSubmissionPhase && Number(challenge.entry_fee) > 0 && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="bg-background/80 text-xs">
                        Unpaid
                      </Badge>
                    </div>
                  )}

                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={profile?.photos?.[0]} />
                        <AvatarFallback className="text-xs">
                          {profile?.display_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">
                        {profile?.display_name || "Angler"}
                      </span>
                    </div>
                    {entry.caption && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {entry.caption}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {entryVotes} vote{entryVotes !== 1 ? "s" : ""}
                      </span>
                      {canVote && (
                        <Button
                          size="sm"
                          variant={isMyVote ? "default" : "outline"}
                          className="h-7 text-xs"
                          onClick={() => castVote.mutate(entry.id)}
                          disabled={castVote.isPending}
                        >
                          <Heart
                            className={`h-3 w-3 mr-1 ${isMyVote ? "fill-current" : ""}`}
                          />
                          {isMyVote ? "Voted" : "Vote"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Lightbox
        images={lightboxUrl ? [lightboxUrl] : []}
        initialIndex={0}
        open={!!lightboxUrl}
        onOpenChange={(open) => { if (!open) setLightboxUrl(null); }}
      />
    </div>
  );
}
