import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { X, Megaphone, CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface Broadcast {
  id: string;
  title: string;
  body: string;
  popup_variant: "info" | "success" | "warning";
  popup_cta_label: string | null;
  popup_cta_url: string | null;
  sent_at: string | null;
  channels: string[];
  status: string;
}

export function BroadcastPopup() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [visible, setVisible] = useState(false);

  const { data: broadcast } = useQuery({
    queryKey: ["active-broadcast-popup", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: dismissed } = await supabase
        .from("admin_broadcast_dismissals")
        .select("broadcast_id")
        .eq("user_id", user!.id);
      const dismissedIds = (dismissed || []).map((d: any) => d.broadcast_id);

      let q = supabase
        .from("admin_broadcasts")
        .select("id,title,body,popup_variant,popup_cta_label,popup_cta_url,sent_at,channels,status")
        .eq("status", "sent")
        .contains("channels", ["popup"])
        .order("sent_at", { ascending: false })
        .limit(1);
      if (dismissedIds.length) q = q.not("id", "in", `(${dismissedIds.join(",")})`);
      const { data } = await q;
      return (data?.[0] as Broadcast) || null;
    },
  });

  // Realtime: refresh when a new broadcast is sent
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel("admin-broadcasts-popup")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_broadcasts" }, () => {
        qc.invalidateQueries({ queryKey: ["active-broadcast-popup", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, qc]);

  useEffect(() => {
    if (broadcast) {
      const t = setTimeout(() => setVisible(true), 200);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [broadcast?.id]);

  const dismiss = async () => {
    if (!broadcast || !user?.id) return;
    setVisible(false);
    await supabase.from("admin_broadcast_dismissals").insert({
      broadcast_id: broadcast.id,
      user_id: user.id,
    });
    qc.invalidateQueries({ queryKey: ["active-broadcast-popup", user.id] });
  };

  if (!broadcast) return null;

  const variant = broadcast.popup_variant || "info";
  const styles = {
    info: { bar: "bg-[#1454AE]", icon: Info, ring: "ring-[#1454AE]/40" },
    success: { bar: "bg-emerald-600", icon: CheckCircle2, ring: "ring-emerald-500/40" },
    warning: { bar: "bg-amber-500", icon: AlertTriangle, ring: "ring-amber-500/40" },
  }[variant];
  const Icon = styles.icon;

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-md transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      }`}
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
      role="status"
      aria-live="polite"
    >
      <div className={`rounded-2xl bg-[#031029] text-white shadow-2xl ring-1 ${styles.ring} border border-white/10 overflow-hidden`}>
        <div className={`h-1 w-full ${styles.bar}`} />
        <div className="p-4 flex gap-3">
          <div className={`shrink-0 w-9 h-9 rounded-full ${styles.bar} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm leading-snug">{broadcast.title}</div>
            <div className="text-xs text-white/70 mt-1 whitespace-pre-line line-clamp-4">{broadcast.body}</div>
            {broadcast.popup_cta_url && (
              <a
                href={broadcast.popup_cta_url}
                onClick={dismiss}
                target={broadcast.popup_cta_url.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="inline-block mt-3 text-xs font-semibold text-[#1454AE] bg-white rounded-full px-3 py-1.5"
              >
                {broadcast.popup_cta_label || "Learn more"}
              </a>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={dismiss}
            className="shrink-0 h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
            aria-label="Dismiss announcement"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}