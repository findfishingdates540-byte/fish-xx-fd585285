import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Megaphone, Send, Mail, Bell, MessageSquare, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { RichTextEditor } from "@/components/broadcasts/RichTextEditor";

type Channel = "email" | "in_app" | "popup";

export default function AdminBroadcasts() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [channels, setChannels] = useState<Channel[]>(["in_app"]);
  const [popupVariant, setPopupVariant] = useState<"info" | "success" | "warning">("info");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");

  const { data: history = [] } = useQuery({
    queryKey: ["admin-broadcasts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_broadcasts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      let scheduledIso: string | null = null;
      if (scheduleEnabled) {
        if (!scheduledFor) throw new Error("Pick a date/time");
        const d = new Date(scheduledFor);
        if (isNaN(d.getTime()) || d.getTime() <= Date.now()) throw new Error("Schedule must be in the future");
        scheduledIso = d.toISOString();
      }
      const { data, error } = await supabase.functions.invoke("send-admin-broadcast", {
        body: {
          title,
          body_html: bodyHtml,
          channels,
          popup_variant: popupVariant,
          popup_cta_label: ctaLabel || null,
          popup_cta_url: ctaUrl || null,
          scheduled_for: scheduledIso,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data?.scheduled_for) {
        toast.success(`Scheduled for ${format(new Date(data.scheduled_for), "MMM d, h:mm a")}`);
      } else {
        toast.success(`Broadcast sent to ${data?.recipient_count ?? 0} users`);
      }
      setTitle("");
      setBodyHtml("");
      setCtaLabel("");
      setCtaUrl("");
      setScheduleEnabled(false);
      setScheduledFor("");
      qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to send broadcast"),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_broadcasts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Scheduled broadcast cancelled");
      qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
    },
    onError: (e: any) => toast.error(e?.message || "Cancel failed"),
  });

  const toggleChannel = (c: Channel) => {
    setChannels((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const hasBody = !!bodyHtml.replace(/<[^>]+>/g, "").trim();
  const canSend = title.trim() && hasBody && channels.length > 0 && !sendMutation.isPending && (!scheduleEnabled || !!scheduledFor);

  // datetime-local minimum = now (rounded down to minute)
  const minDateTime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="w-7 h-7 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Broadcasts</h1>
          <p className="text-sm text-slate-400">Send announcements via email, in-app notifications, or bottom popup.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div>
          <Label className="text-slate-200">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New tournament season starts Monday!"
            maxLength={120}
            className="mt-1.5 bg-slate-950 border-slate-700 text-white"
          />
        </div>

        <div>
          <Label className="text-slate-200">Message</Label>
          <div className="mt-1.5">
            {user?.id && (
              <RichTextEditor value={bodyHtml} onChange={setBodyHtml} userId={user.id} />
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">Rich text + images supported. Images are sanitized server-side.</div>
        </div>

        <div>
          <Label className="text-slate-200 mb-2 block">Delivery channels</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { key: "in_app" as const, icon: Bell, label: "In-App Notification", desc: "Appears in user's notifications" },
              { key: "email" as const, icon: Mail, label: "Email", desc: "Sent to all members' inboxes" },
              { key: "popup" as const, icon: MessageSquare, label: "Bottom Popup", desc: "Slides up inside the app" },
            ].map(({ key, icon: Icon, label, desc }) => {
              const active = channels.includes(key);
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => toggleChannel(key)}
                  className={`flex items-start gap-3 p-4 rounded-lg border text-left transition ${
                    active ? "border-cyan-500 bg-cyan-500/10" : "border-slate-700 bg-slate-950 hover:border-slate-600"
                  }`}
                >
                  <Checkbox checked={active} className="mt-0.5 pointer-events-none" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <Icon className="w-4 h-4" /> {label}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {channels.includes("popup") && (
          <div className="border border-slate-800 rounded-lg p-4 space-y-3 bg-slate-950/50">
            <div className="text-sm font-medium text-slate-200">Popup options</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-slate-300 text-xs">Style</Label>
                <Select value={popupVariant} onValueChange={(v: any) => setPopupVariant(v)}>
                  <SelectTrigger className="mt-1 bg-slate-950 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info (blue)</SelectItem>
                    <SelectItem value="success">Success (green)</SelectItem>
                    <SelectItem value="warning">Warning (amber)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs">CTA label (optional)</Label>
                <Input
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="Learn more"
                  maxLength={40}
                  className="mt-1 bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">CTA link (optional)</Label>
                <Input
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="/app/tournaments"
                  className="mt-1 bg-slate-950 border-slate-700 text-white"
                />
              </div>
            </div>
          </div>
        )}

        <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Schedule for later</span>
            </div>
            <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
          </div>
          {scheduleEnabled && (
            <div className="mt-3">
              <Input
                type="datetime-local"
                value={scheduledFor}
                min={minDateTime}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Uses your local time zone. Sent within ~1 minute of the chosen time.</p>
            </div>
          )}
        </div>

        {hasBody && (
          <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/50">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Preview</div>
            <div className="rounded-lg bg-[#031029] border border-white/10 p-4">
              <div className="text-white font-semibold mb-2">{title || "Untitled broadcast"}</div>
              <div
                className="prose prose-invert prose-sm max-w-none [&_img]:max-h-60 [&_img]:rounded-lg"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400">
            Will be delivered to <span className="text-white font-medium">all active members</span>.
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={!canSend} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                <Send className="w-4 h-4 mr-2" />
                {sendMutation.isPending ? "Working…" : scheduleEnabled ? "Schedule" : "Send Now"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{scheduleEnabled ? "Schedule this broadcast?" : "Send this broadcast?"}</AlertDialogTitle>
                <AlertDialogDescription>
                  {scheduleEnabled
                    ? `"${title}" will be delivered via ${channels.join(", ")} to all members at ${scheduledFor ? format(new Date(scheduledFor), "PPp") : ""}.`
                    : `This will deliver "${title}" via ${channels.join(", ")} to all members. This action cannot be undone.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => sendMutation.mutate()}>{scheduleEnabled ? "Schedule" : "Send"}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">History</h2>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800">
              <TableHead className="text-slate-400">Title</TableHead>
              <TableHead className="text-slate-400">Channels</TableHead>
              <TableHead className="text-slate-400">Recipients</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Time</TableHead>
              <TableHead className="text-slate-400"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-8">No broadcasts yet.</TableCell></TableRow>
            )}
            {history.map((b: any) => (
              <TableRow key={b.id} className="border-slate-800">
                <TableCell className="text-white font-medium">{b.title}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(b.channels || []).map((c: string) => (
                      <Badge key={c} variant="outline" className="border-slate-700 text-slate-300">{c}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-slate-300">{b.recipient_count}</TableCell>
                <TableCell>
                  <Badge className={
                    b.status === "sent" ? "bg-emerald-500/20 text-emerald-300" :
                    b.status === "failed" ? "bg-rose-500/20 text-rose-300" :
                    b.status === "scheduled" ? "bg-cyan-500/20 text-cyan-300" :
                    "bg-slate-500/20 text-slate-300"
                  }>{b.status}</Badge>
                </TableCell>
                <TableCell className="text-slate-400 text-sm">
                  {b.status === "scheduled" && b.scheduled_for
                    ? `→ ${format(new Date(b.scheduled_for), "MMM d, h:mm a")}`
                    : b.sent_at ? format(new Date(b.sent_at), "MMM d, yyyy h:mm a") : "—"}
                </TableCell>
                <TableCell>
                  {b.status === "scheduled" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-rose-300"
                      onClick={() => cancelMutation.mutate(b.id)}
                      disabled={cancelMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}