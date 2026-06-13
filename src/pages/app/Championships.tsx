import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users } from "lucide-react";

export default function Championships() {
  const { data: champs = [], isLoading } = useQuery({
    queryKey: ["public-championships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fishing_challenges")
        .select("id, title, description, start_date, end_date, status, prize_description, banner_url, calcutta_entry_fee")
        .eq("is_championship", true)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Trophy className="w-7 h-7 text-cyan-400" /> Championships
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Long-running team championships with custom species tiers and optional Calcutta side-pots.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && champs.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">No championships yet.</Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {champs.map((c: any) => (
          <Link key={c.id} to={`/app/championships/${c.id}`}>
            <Card className="overflow-hidden hover:border-cyan-500/50 transition-colors h-full">
              {c.banner_url ? (
                <img src={c.banner_url} alt="" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-slate-800 via-cyan-900/50 to-slate-900 flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-cyan-400/60" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-lg leading-tight">{c.title}</h2>
                  <Badge variant="outline" className="capitalize">{c.status}</Badge>
                </div>
                {c.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {c.start_date} → {c.end_date}</span>
                  {Number(c.calcutta_entry_fee) > 0 && (
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> ${Number(c.calcutta_entry_fee)} Calcutta</span>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}