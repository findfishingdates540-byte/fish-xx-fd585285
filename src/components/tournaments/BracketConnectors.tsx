import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Matchup = { id: string; next_matchup_id?: string | null; winner_team_id?: string | null };

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
  matchups: Matchup[];
  getNodeEl: (id: string) => HTMLElement | null;
  /** Recompute when these values change */
  deps?: unknown[];
}

/**
 * Renders an absolutely positioned SVG of cubic-bezier connector lines
 * between each matchup and its `next_matchup_id`.
 */
export const BracketConnectors = ({ containerRef, matchups, getNodeEl, deps = [] }: Props) => {
  const [paths, setPaths] = useState<Array<{ d: string; advancing: boolean; key: string }>>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const rafRef = useRef<number | null>(null);

  const compute = () => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const next: Array<{ d: string; advancing: boolean; key: string }> = [];
    for (const m of matchups) {
      if (!m.next_matchup_id) continue;
      const from = getNodeEl(m.id);
      const to = getNodeEl(m.next_matchup_id);
      if (!from || !to) continue;
      const fr = from.getBoundingClientRect();
      const tr = to.getBoundingClientRect();
      const x1 = fr.right - cRect.left;
      const y1 = fr.top + fr.height / 2 - cRect.top;
      const x2 = tr.left - cRect.left;
      const y2 = tr.top + tr.height / 2 - cRect.top;
      const mx = (x1 + x2) / 2;
      const d = `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
      next.push({ d, advancing: !!m.winner_team_id, key: `${m.id}->${m.next_matchup_id}` });
    }
    setSize({ w: container.scrollWidth, h: container.scrollHeight });
    setPaths(next);
  };

  const schedule = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(compute);
  };

  useLayoutEffect(() => {
    schedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchups, ...deps]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => schedule());
    ro.observe(container);
    Array.from(container.querySelectorAll("[data-matchup-id]")).forEach((el) => ro.observe(el));
    window.addEventListener("resize", schedule);
    container.addEventListener("scroll", schedule, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      container.removeEventListener("scroll", schedule);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef.current, matchups.length]);

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={size.w}
      height={size.h}
      style={{ overflow: "visible" }}
      aria-hidden
    >
      {paths.map((p) => (
        <path
          key={p.key}
          d={p.d}
          fill="none"
          strokeWidth={p.advancing ? 2 : 1.5}
          className={p.advancing ? "stroke-emerald-500/70" : "stroke-border"}
          strokeDasharray={p.advancing ? undefined : "4 4"}
        />
      ))}
    </svg>
  );
};

export default BracketConnectors;