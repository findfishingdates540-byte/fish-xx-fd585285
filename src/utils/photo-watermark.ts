export interface WatermarkLocation {
  street?: string;
  city?: string;
  county?: string;
  state?: string;
  lat?: number | null;
  lng?: number | null;
}

export async function applyWatermark(
  file: File,
  timestamp: string,
  location?: WatermarkLocation
): Promise<{ file: File; previewUrl: string }> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;

  // Draw the original photo
  ctx.drawImage(img, 0, 0);

  // Build text lines
  const lines = buildLines(timestamp, location);
  if (lines.length === 0) return blobToResult(canvas, file.name);

  // Font sizing: ~2.2% of image height, min 14px
  const fontSize = Math.max(14, Math.round(canvas.height * 0.022));
  const lineHeight = fontSize * 1.35;
  const padding = Math.round(canvas.width * 0.025);

  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";

  // Semi-transparent background strip
  const blockHeight = lines.length * lineHeight + padding;
  const maxLineWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const bgWidth = maxLineWidth + padding * 2;

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(
    canvas.width - bgWidth,
    canvas.height - blockHeight - padding * 0.5,
    bgWidth,
    blockHeight + padding * 0.5
  );

  // Text shadow for readability
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  // Draw each line (white, right-aligned)
  ctx.fillStyle = "#ffffff";
  const startY = canvas.height - padding;
  for (let i = lines.length - 1; i >= 0; i--) {
    const y = startY - (lines.length - 1 - i) * lineHeight;
    ctx.fillText(lines[i], canvas.width - padding, y);
  }

  return blobToResult(canvas, file.name);
}

function buildLines(timestamp: string, loc?: WatermarkLocation): string[] {
  const lines: string[] = [];

  // Format timestamp nicely
  try {
    const d = new Date(timestamp);
    lines.push(
      d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
        " " +
        d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })
    );
  } catch {
    lines.push(timestamp);
  }

  if (loc) {
    if (loc.street) lines.push(loc.street);
    if (loc.city) lines.push(loc.city);
    if (loc.county) lines.push(loc.county);
    if (loc.state) lines.push(loc.state);

    // If no address parts but have coords, show coords
    if (!loc.street && !loc.city && !loc.county && !loc.state && loc.lat != null && loc.lng != null) {
      lines.push(`${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`);
    }
  }

  return lines;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function blobToResult(canvas: HTMLCanvasElement, originalName: string) {
  const blob = await new Promise<Blob>((res) =>
    canvas.toBlob((b) => res(b!), "image/jpeg", 0.92)
  );
  const file = new File([blob], originalName, { type: "image/jpeg" });
  const previewUrl = URL.createObjectURL(blob);
  return { file, previewUrl };
}
