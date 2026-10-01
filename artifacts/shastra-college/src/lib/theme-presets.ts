import type { ThemePreset } from "@workspace/api-client-react";

export type PresetKey = Exclude<ThemePreset, "custom">;

export const THEME_PRESETS: Record<
  PresetKey,
  { label: string; primary: string; accent: string; surface: string; note: string }
> = {
  "shastra-blue-red": {
    label: "Shastra Blue & Red",
    primary: "#0B3472",
    accent: "#E3212B",
    surface: "#F7F5EF",
    note: "The college's signature palette",
  },
  "heritage-ink-gold": {
    label: "Heritage Ink & Gold",
    primary: "#25384D",
    accent: "#C8A456",
    surface: "#F8F5EB",
    note: "Ink blue with a warm metallic note",
  },
  "teal-copper": {
    label: "Teal & Copper",
    primary: "#0F5558",
    accent: "#C77A56",
    surface: "#F3F7F6",
    note: "Quietly contemporary",
  },
  "charcoal-saffron": {
    label: "Charcoal & Saffron",
    primary: "#303B46",
    accent: "#E3B63F",
    surface: "#F5F4EF",
    note: "Grounded with a bright signal",
  },
  "mulberry-rosewood": {
    label: "Mulberry & Rosewood",
    primary: "#543A49",
    accent: "#B97677",
    surface: "#FBF5F2",
    note: "A softer, literary character",
  },
  "olive-parchment": {
    label: "Olive & Parchment",
    primary: "#45513B",
    accent: "#AF9A58",
    surface: "#F7F4E8",
    note: "Measured and archival",
  },
};

export const DEFAULT_THEME: PresetKey = "shastra-blue-red";

function relativeLuminance(hex: string) {
  const channels = hex.match(/[0-9a-f]{2}/gi)?.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  if (!channels || channels.length !== 3) return 0;
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function hexToHslChannels(hex: string) {
  const channels = hex.match(/[0-9a-f]{2}/gi)?.map(
    (channel) => Number.parseInt(channel, 16) / 255,
  );
  if (!channels || channels.length !== 3) return "0 0% 0%";

  const [red, green, blue] = channels;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const difference = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (difference !== 0) {
    saturation = difference / (1 - Math.abs(2 * lightness - 1));
    switch (max) {
      case red:
        hue = ((green - blue) / difference) % 6;
        break;
      case green:
        hue = (blue - red) / difference + 2;
        break;
      default:
        hue = (red - green) / difference + 4;
    }
    hue = (hue * 60 + 360) % 360;
  }

  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

function contrastRatio(first: string, second: string) {
  const values = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a,
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function mixHex(first: string, second: string, amount: number) {
  const firstChannels = first.match(/[0-9a-f]{2}/gi)?.map((channel) =>
    Number.parseInt(channel, 16),
  );
  const secondChannels = second.match(/[0-9a-f]{2}/gi)?.map((channel) =>
    Number.parseInt(channel, 16),
  );
  if (!firstChannels || !secondChannels || firstChannels.length !== 3 || secondChannels.length !== 3) {
    return second;
  }
  const channels = firstChannels.map((channel, index) =>
    Math.round(channel + (secondChannels[index] - channel) * amount),
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function accessibleAccentText(accent: string, primary: string, surface: string) {
  if (contrastRatio(accent, surface) >= 4.5) return accent;

  const candidates = [primary, "#111827", "#FFFFFF"];
  const target = candidates.reduce((best, candidate) =>
    contrastRatio(candidate, surface) > contrastRatio(best, surface)
      ? candidate
      : best,
  );
  for (let step = 1; step <= 20; step += 1) {
    const candidate = mixHex(accent, target, step / 20);
    if (contrastRatio(candidate, surface) >= 4.5) return candidate;
  }
  return target;
}

function accentForeground(accent: string) {
  return accessibleForeground(accent);
}

function accessibleForeground(background: string) {
  const dark = "#111827";
  return contrastRatio("#FFFFFF", background) >= contrastRatio(dark, background)
    ? "#FFFFFF"
    : dark;
}

export function themeVariables(primary: string, accent: string, surface: string) {
  const accentText = accessibleAccentText(accent, primary, surface);
  const accentTextForeground = accentForeground(accent);
  const primaryTextForeground = accessibleForeground(primary);
  const sidebarAccent = mixHex(primary, "#FFFFFF", 0.14);
  return {
    "--college-primary": primary,
    "--college-accent": accent,
    "--college-surface": surface,
    "--college-accent-text": accentText,
    "--college-accent-foreground": accentTextForeground,
    "--background": hexToHslChannels(surface),
    "--primary": hexToHslChannels(primary),
    "--primary-foreground": hexToHslChannels(primaryTextForeground),
    "--secondary-foreground": hexToHslChannels(primary),
    "--accent": hexToHslChannels(accent),
    "--accent-foreground": hexToHslChannels(accentTextForeground),
    "--ring": hexToHslChannels(accent),
    "--sidebar": hexToHslChannels(primary),
    "--sidebar-foreground": "0 0% 100%",
    "--sidebar-border": hexToHslChannels(mixHex(primary, "#FFFFFF", 0.2)),
    "--sidebar-primary": hexToHslChannels(accent),
    "--sidebar-primary-foreground": hexToHslChannels(accentTextForeground),
    "--sidebar-accent": hexToHslChannels(sidebarAccent),
    "--sidebar-accent-foreground": "0 0% 100%",
    "--sidebar-ring": hexToHslChannels(accent),
    "--chart-1": hexToHslChannels(primary),
    "--chart-2": hexToHslChannels(accent),
  };
}