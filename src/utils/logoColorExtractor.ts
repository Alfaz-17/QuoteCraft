/**
 * AI-Assisted Logo Color Palette Extractor
 * Automatically extracts dominant brand colors and secondary accents from an uploaded company logo.
 */

export interface ExtractedPalette {
  primaryColor: string;
  secondaryColor: string;
  paletteName: string;
  detectedColors: string[];
  source?: "ai" | "image";
}

/** Ask the authenticated server-side AI to read the brand colors; fall back to
 * pixel sampling when no AI key is configured or the request cannot complete. */
export async function analyzeLogoPalette(imageSource: string): Promise<ExtractedPalette> {
  try {
    const response = await fetch("/api/ai/analyze-logo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageSource }),
    });
    if (response.ok) {
      const payload = await response.json();
      const colors = payload?.colors;
      const isHex = (value: unknown): value is string => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
      if (isHex(colors?.primary) && isHex(colors?.secondary)) {
        return {
          primaryColor: colors.primary.toUpperCase(),
          secondaryColor: colors.secondary.toUpperCase(),
          paletteName: "AI Logo Match",
          detectedColors: [colors.primary.toUpperCase(), colors.secondary.toUpperCase()],
          source: "ai",
        };
      }
    }
  } catch (error) {
    console.warn("AI logo palette analysis unavailable; using image color sampling.", error);
  }

  return extractColorsFromImage(imageSource);
}

export function extractColorsFromImage(
  imageSource: string
): Promise<ExtractedPalette> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !imageSource) {
      resolve(getDefaultPalette());
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(getDefaultPalette());
          return;
        }

        const size = 100;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;

        const colorCounts: Record<string, { count: number; r: number; g: number; b: number }> = {};

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 120) continue; // skip transparent / semi-transparent pixels

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Skip pure white, near-white backgrounds, and pure black
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const diff = max - min;
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;

          if (brightness > 240 && diff < 25) continue; // white/near-white
          if (brightness < 20) continue; // near black

          // Quantize colors into 24-step color buckets
          const qr = Math.round(r / 24) * 24;
          const qg = Math.round(g / 24) * 24;
          const qb = Math.round(b / 24) * 24;
          const key = `${qr},${qg},${qb}`;

          if (!colorCounts[key]) {
            colorCounts[key] = { count: 0, r: qr, g: qg, b: qb };
          }
          // Prioritize vibrant brand colors over dull grays
          const saturationBonus = 1 + (diff / 255) * 1.5;
          colorCounts[key].count += saturationBonus;
        }

        const sorted = Object.values(colorCounts).sort((a, b) => b.count - a.count);

        if (sorted.length === 0) {
          resolve(getDefaultPalette());
          return;
        }

        const toHex = (r: number, g: number, b: number) =>
          `#${((1 << 24) + (Math.min(255, r) << 16) + (Math.min(255, g) << 8) + Math.min(255, b))
            .toString(16)
            .slice(1)
            .toUpperCase()}`;

        const primary = toHex(sorted[0].r, sorted[0].g, sorted[0].b);

        // Find secondary color with noticeable Euclidean color distance
        let secondary = "#F59E0B";
        for (let i = 1; i < sorted.length; i++) {
          const c = sorted[i];
          const colorDistance = Math.sqrt(
            Math.pow(c.r - sorted[0].r, 2) +
            Math.pow(c.g - sorted[0].g, 2) +
            Math.pow(c.b - sorted[0].b, 2)
          );
          if (colorDistance > 60) {
            secondary = toHex(c.r, c.g, c.b);
            break;
          }
        }

        resolve({
          primaryColor: primary,
          secondaryColor: secondary,
          paletteName: "Logo Color Match",
          detectedColors: sorted.slice(0, 5).map((c) => toHex(c.r, c.g, c.b)),
          source: "image",
        });
      } catch (err) {
        console.warn("AI Logo color analysis fallback:", err);
        resolve(getDefaultPalette());
      }
    };

    img.onerror = () => {
      resolve(getDefaultPalette());
    };

    img.src = imageSource;
  });
}

function getDefaultPalette(): ExtractedPalette {
  return {
    primaryColor: "#0F766E",
    secondaryColor: "#F59E0B",
    paletteName: "QuoteCraft Brand",
    detectedColors: ["#0F766E", "#F59E0B"],
    source: "image",
  };
}

