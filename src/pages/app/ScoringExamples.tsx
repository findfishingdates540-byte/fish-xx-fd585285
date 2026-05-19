import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator, Fish, Trophy, Sparkles, Waves, Anchor } from "lucide-react";

type Step = { label: string; value: string; op?: "×" | "+" | "="; note?: string };
type Scenario = {
  id: string;
  title: string;
  tag: string;
  icon: typeof Fish;
  inputs: { label: string; value: string }[];
  steps: Step[];
  total: string;
  takeaway: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "shore-snook",
    title: "Shore angler lands a Quality Snook",
    tag: "Inshore Saltwater · Shore-based",
    icon: Fish,
    inputs: [
      { label: "Species", value: "Common Snook" },
      { label: "Length", value: '32" TL (Total Length)' },
      { label: "Method", value: "Shore / Wade" },
      { label: "Released", value: "Yes (photo + measurement)" },
      { label: "Streak", value: "3rd consecutive day logged" },
    ],
    steps: [
      { label: "Base score (Snook)", value: "6", note: "From species scoreboard" },
      { label: "Shore multiplier", value: "× 1.50", op: "×", note: "Land-based bonus to keep shore competitive" },
      { label: "Subtotal after multiplier", value: "9.0", op: "=" },
      { label: "Trophy class — Quality (30–34\")", value: "+ 1.0", op: "+" },
      { label: "Daily streak bonus", value: "+ 0.3", op: "+", note: "0.1 per day, capped" },
    ],
    total: "10.3 pts",
    takeaway:
      "A solid shore snook scores nearly the same as a small boat-caught pelagic — the method multiplier is the great equaliser.",
  },
  {
    id: "kayak-mahi",
    title: "Kayak angler boats a Trophy Mahi-Mahi",
    tag: "Pelagic · Kayak",
    icon: Waves,
    inputs: [
      { label: "Species", value: "Mahi-Mahi (Dorado)" },
      { label: "Length", value: '42" FL (Fork Length)' },
      { label: "Method", value: "Kayak (offshore paddle)" },
      { label: "Released", value: "Kept (legal slot)" },
      { label: "Variety", value: "Reached 10 unique species this year" },
    ],
    steps: [
      { label: "Base score (Mahi-Mahi)", value: "7" },
      { label: "Kayak multiplier", value: "× 1.30", op: "×" },
      { label: "Subtotal after multiplier", value: "9.1", op: "=" },
      { label: "Trophy class — Trophy (40–47\")", value: "+ 1.5", op: "+" },
      { label: "Variety milestone — 10 species", value: "+ 1.0", op: "+", note: "Awarded once per milestone, per season" },
    ],
    total: "11.6 pts",
    takeaway:
      "Variety milestones reward anglers chasing diverse species — this single Mahi triggered the 10-species bonus on top of a strong trophy class.",
  },
  {
    id: "offshore-marlin",
    title: "Offshore charter releases an Exceptional Blue Marlin",
    tag: "Billfish · Charter · IGFA Tournament",
    icon: Anchor,
    inputs: [
      { label: "Species", value: "Blue Marlin" },
      { label: "Estimated size", value: '~140" LJFL (safe-release)' },
      { label: "Method", value: "Charter / Offshore" },
      { label: "Released", value: "Yes — photo + leader-touch video" },
      { label: "Event", value: "IGFA-sanctioned billfish tournament" },
    ],
    steps: [
      { label: "Base score (Blue Marlin)", value: "10" },
      { label: "Charter multiplier", value: "× 1.00", op: "×" },
      { label: "Subtotal after multiplier", value: "10.0", op: "=" },
      { label: "Trophy class — Exceptional (130\"+ LJFL)", value: "+ 2.0", op: "+" },
      { label: "Tournament multiplier (IGFA)", value: "× 1.25", op: "×", note: "Applied to running subtotal" },
    ],
    total: "15.0 pts",
    takeaway:
      "Safe-release billfish are scored from estimated class with photo or video proof — no harm to the fish, full credit to the angler.",
  },
  {
    id: "freshwater-bass",
    title: "Junior angler tournament-caught Largemouth Bass",
    tag: "Freshwater · Boat · Junior Tournament",
    icon: Trophy,
    inputs: [
      { label: "Species", value: "Largemouth Bass" },
      { label: "Length", value: '22" TL' },
      { label: "Method", value: "Boat (freshwater)" },
      { label: "Released", value: "Yes" },
      { label: "Event", value: "Local junior bass tournament" },
    ],
    steps: [
      { label: "Base score (Largemouth Bass)", value: "5" },
      { label: "Boat multiplier", value: "× 1.10", op: "×" },
      { label: "Subtotal after multiplier", value: "5.5", op: "=" },
      { label: "Trophy class — Trophy (20–23\")", value: "+ 1.5", op: "+" },
      { label: "Junior tournament multiplier", value: "× 1.10", op: "×" },
    ],
    total: "7.7 pts",
    takeaway:
      "Even modest base scores stack into meaningful points when trophy class and event multipliers combine.",
  },
  {
    id: "no-bonus-panfish",
    title: "Casual after-work bluegill (no bonuses)",
    tag: "Freshwater · Shore · Everyday catch",
    icon: Fish,
    inputs: [
      { label: "Species", value: "Bluegill" },
      { label: "Length", value: '7" TL' },
      { label: "Method", value: "Shore" },
      { label: "Released", value: "Yes" },
      { label: "Streak / variety", value: "None active" },
    ],
    steps: [
      { label: "Base score (Bluegill)", value: "2" },
      { label: "Shore multiplier", value: "× 1.50", op: "×" },
      { label: "Subtotal after multiplier", value: "3.0", op: "=" },
      { label: "Trophy class — below Quality threshold", value: "+ 0.0", op: "+" },
    ],
    total: "3.0 pts",
    takeaway:
      "Every logged catch counts. Small fish keep the streak alive — which compounds with future bonuses.",
  },
];

function StepRow({ s }: { s: Step }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
      <div className="min-w-0">
        <div className="text-sm">{s.label}</div>
        {s.note && <div className="text-[11px] text-muted-foreground leading-snug">{s.note}</div>}
      </div>
      <div className="font-mono text-sm tabular-nums shrink-0 text-primary">{s.value}</div>
    </div>
  );
}

export default function ScoringExamples() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-8">
      <header className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8">
          <Link to="/app/scoring-rules"><ArrowLeft className="h-4 w-4 mr-1" />Back to Scoring Rules</Link>
        </Button>
        <Badge className="bg-primary/15 text-primary border-primary/30">Worked Scenarios</Badge>
        <h1 className="text-3xl font-bold tracking-tight">How Your Points Are Calculated</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Five real-world fishing scenarios — from a casual shore bluegill to a tournament Blue Marlin — broken down
          step by step so you can see exactly how every multiplier and bonus stacks into a final score.
        </p>
      </header>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">The Formula</h2>
        </div>
        <p className="font-mono text-sm bg-muted rounded-md p-3 leading-relaxed">
          Final Score = (Base Score × Method Multiplier) + Trophy Bonus + Variety Bonus + Streak Bonus<br />
          {"            "}× Tournament Multiplier (if applicable)
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          The method multiplier applies to the base score. Bonuses are flat additions. Tournament multipliers apply to
          the running subtotal at the end.
        </p>
      </Card>

      <div className="space-y-6">
        {SCENARIOS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.id} className="p-5 md:p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg leading-tight">{s.title}</h3>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">{s.tag}</div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Inputs</div>
                  <dl className="space-y-1.5 text-sm">
                    {s.inputs.map((i) => (
                      <div key={i.label} className="flex justify-between gap-3 border-b border-border/40 py-1.5 last:border-0">
                        <dt className="text-muted-foreground">{i.label}</dt>
                        <dd className="text-right font-medium">{i.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Calculation</div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    {s.steps.map((step, idx) => <StepRow key={idx} s={step} />)}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t-2 border-primary/30">
                      <span className="text-sm font-semibold flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-primary" />Final Score
                      </span>
                      <span className="text-xl font-bold text-primary tabular-nums">{s.total}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/15 text-sm">
                <span className="font-semibold">Takeaway: </span>
                <span className="text-muted-foreground">{s.takeaway}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5 bg-muted/30">
        <h3 className="font-semibold mb-2">Tips to maximise your points</h3>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>Log catches daily — even a small fish keeps your streak bonus compounding.</li>
          <li>Chase species variety to unlock milestone bonuses at 5, 10, 25 and 50 unique species.</li>
          <li>Choose the right measurement (TL, FL, LJFL) — the species page shows what each fish uses.</li>
          <li>For safe-release species, an estimated class with clear photo or video earns full credit.</li>
          <li>Tournament catches stack a final multiplier on top of everything — opt in when fishing eligible events.</li>
        </ul>
      </Card>

      <div className="flex justify-center pb-6">
        <Button asChild variant="outline">
          <Link to="/app/scoring-rules"><ArrowLeft className="h-4 w-4 mr-1" />Back to full Scoring Rules</Link>
        </Button>
      </div>
    </div>
  );
}