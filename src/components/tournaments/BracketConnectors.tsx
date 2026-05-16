import { useEffect, useLayoutEffect, useRef, useState } from "react";

const DEV = typeof import.meta !== "undefined" && (import.meta as any).env?.DEV;
const SCROLL_THROTTLE_MS = 60;
const RESIZE_THROTTLE_MS = 100;

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
 *
 * Performance:
 *  - Recomputation is rAF-batched and throttled separately for scroll/resize.
 *  - ResizeObserver only observes matchup nodes currently visible in viewport
 *    (tracked via IntersectionObserver), plus the container itself.
 *
 * Resilience:
 *  - If a matchup node or its `next_matchup_id` element is missing, the path
 *    is skipped (not dropped silently). In dev a warning is logged once per
 *    missing pair so phantom edges don't break the bracket render.
 */
export const BracketConnectors = ({ containerRef, matchups, getNodeEl, deps = [] }: Props) => {
  const [paths, setPaths] = useState<Array<{ d: string; advancing: boolean; key: string }>>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const rafRef = useRef<number | null>(null);
  const lastScrollAt = useRef(0);
  const lastResizeAt = useRef(0);
  const trailingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warned = useRef<Set<string>>(new Set());
  const [missingCount, setMissingCount] = useState(0);

  const compute = () => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const next: Array<{ d: string; advancing: boolean; key: string }> = [];
    let missing = 0;
    for (const m of matchups) {
      if (!m.next_matchup_id) continue;
      const from = getNodeEl(m.id);
      const to = getNodeEl(m.next_matchup_id);
      if (!from || !to) {
        missing++;
        const key = `${m.id}->${m.next_matchup_id}`;
        if (DEV && !warned.current.has(key)) {
          warned.current.add(key);
          // eslint-disable-next-line no-console
          console.warn(
            "[BracketConnectors] Skipping connector — missing DOM node",
            { from: m.id, to: m.next_matchup_id, hasFrom: !!from, hasTo: !!to },
          );
        }
        continue;
      }
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
    setMissingCount(missing);
  };

  const runCompute = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(compute);
  };

  /** Leading-edge + trailing throttle. Coalesces rapid scroll/resize bursts. */
  const throttled = (lastRef: React.MutableRefObject<number>, ms: number) => () => {
    const now = Date.now();
    if (now - lastRef.current >= ms) {
      lastRef.current = now;
      runCompute();
    } else if (!trailingTimer.current) {
      trailingTimer.current = setTimeout(() => {
        trailingTimer.current = null;
        lastRef.current = Date.now();
        runCompute();
      }, ms - (now - lastRef.current));
    }
  };

  const onScroll = throttled(lastScrollAt, SCROLL_THROTTLE_MS);
  const onResize = throttled(lastResizeAt, RESIZE_THROTTLE_MS);

  useLayoutEffect(() => {
    runCompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchups, ...deps]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => onResize());
    ro.observe(container);

    // Only observe matchup nodes that are currently visible. As cards scroll
    // in/out of the viewport, swap them in/out of the ResizeObserver to keep
    // the work proportional to what the user actually sees.
    const observed = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        let dirty = false;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!observed.has(entry.target)) {
              ro.observe(entry.target);
              observed.add(entry.target);
              dirty = true;
            }
          } else if (observed.has(entry.target)) {
            ro.unobserve(entry.target);
            observed.delete(entry.target);
          }
        }
        if (dirty) onResize();
      },
      { root: null, rootMargin: "200px", threshold: 0 },
    );
    const nodes = Array.from(container.querySelectorAll("[data-matchup-id]"));
    nodes.forEach((el) => io.observe(el));

    window.addEventListener("resize", onResize);
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      ro.disconnect();
      observed.clear();
      window.removeEventListener("resize", onResize);
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (trailingTimer.current) clearTimeout(trailingTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef.current, matchups.length]);

  return (
    <>
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
      {DEV && missingCount > 0 && (
        <div className="pointer-events-none absolute top-1 right-1 z-10 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
          {missingCount} connector{missingCount === 1 ? "" : "s"} hidden (missing node)
        </div>
      )}
    </>
  );
};

export default BracketConnectors;