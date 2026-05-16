import React from "react";

/**
 * Tiny rules formatter: renders **bold**, *italic*, and groups numbered
 * (`1.` / `2)`) or bulleted (`-` / `•`) lines into proper lists. Other
 * lines are rendered as paragraphs preserving line breaks.
 */
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] != null) nodes.push(<strong key={`${keyBase}-b-${i++}`}>{m[2]}</strong>);
    else if (m[3] != null) nodes.push(<em key={`${keyBase}-i-${i++}`}>{m[3]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function FormattedRules({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  type Block =
    | { kind: "ol"; items: string[] }
    | { kind: "ul"; items: string[] }
    | { kind: "p"; text: string }
    | { kind: "space" };
  const blocks: Block[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      if (blocks[blocks.length - 1]?.kind !== "space") blocks.push({ kind: "space" });
      continue;
    }
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const ul = line.match(/^\s*[-•*]\s+(.*)$/);
    if (ol) {
      const prev = blocks[blocks.length - 1];
      if (prev && prev.kind === "ol") prev.items.push(ol[1]);
      else blocks.push({ kind: "ol", items: [ol[1]] });
    } else if (ul) {
      const prev = blocks[blocks.length - 1];
      if (prev && prev.kind === "ul") prev.items.push(ul[1]);
      else blocks.push({ kind: "ul", items: [ul[1]] });
    } else {
      const prev = blocks[blocks.length - 1];
      if (prev && prev.kind === "p") prev.text += "\n" + line;
      else blocks.push({ kind: "p", text: line });
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((b, idx) => {
        if (b.kind === "space") return <div key={idx} className="h-1" />;
        if (b.kind === "ol") {
          return (
            <ol key={idx} className="list-decimal pl-5 space-y-1">
              {b.items.map((it, i) => <li key={i}>{renderInline(it, `${idx}-${i}`)}</li>)}
            </ol>
          );
        }
        if (b.kind === "ul") {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1">
              {b.items.map((it, i) => <li key={i}>{renderInline(it, `${idx}-${i}`)}</li>)}
            </ul>
          );
        }
        return (
          <p key={idx} className="whitespace-pre-wrap leading-relaxed">
            {renderInline(b.text, `${idx}`)}
          </p>
        );
      })}
    </div>
  );
}