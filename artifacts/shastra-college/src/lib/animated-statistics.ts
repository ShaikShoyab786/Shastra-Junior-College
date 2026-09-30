import { useEffect, useMemo, useRef, useState } from "react";
import type { ContentItem } from "@workspace/api-client-react";

export type StatisticMetric = {
  value: number | null;
  raw: string;
  prefix: string;
  suffix: string;
  decimals: number;
};

function stringValue(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

export function metricFor(item: ContentItem): StatisticMetric {
  const content = item.content;
  const rawValue = content.value ?? content.stat ?? content.number ?? content.amount;
  const raw =
    typeof rawValue === "string" || typeof rawValue === "number"
      ? String(rawValue)
      : "";
  const match = raw.match(/[-+]?\d[\d,]*(?:\.\d+)?/);
  const value = match ? Number(match[0].replace(/,/g, "")) : null;
  const explicitPrefix = stringValue(content, ["prefix"]);
  const explicitSuffix = stringValue(content, ["suffix", "unit"]);
  const matchStart = match?.index ?? 0;
  const matchEnd = match ? matchStart + match[0].length : 0;
  const prefix = explicitPrefix || raw.slice(0, matchStart).trim();
  const suffix = explicitSuffix || raw.slice(matchEnd).trim();
  const decimals = match?.[0].split(".")[1]?.length || 0;
  return { value, raw, prefix, suffix, decimals };
}

export function formatMetric(metric: StatisticMetric, value: number | null) {
  if (value === null) return metric.raw;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: metric.decimals,
    maximumFractionDigits: metric.decimals,
  }).format(value);
  return `${metric.prefix}${formatted}${metric.suffix}`;
}

export function useAnimatedStatistics<T extends HTMLElement>(
  items: ContentItem[],
) {
  const containerRef = useRef<T | null>(null);
  const animatedRef = useRef(false);
  const metrics = useMemo(() => items.map(metricFor), [items]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(mediaQuery.matches);
    updateMotion();
    mediaQuery.addEventListener?.("change", updateMotion);
    return () => mediaQuery.removeEventListener?.("change", updateMotion);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || animatedRef.current || items.length === 0) return;

    let frame = 0;
    let observer: IntersectionObserver | undefined;
    const start = () => {
      if (animatedRef.current) return;
      animatedRef.current = true;
      if (reducedMotion) {
        setCounts(
          metrics.reduce<Record<string, number>>((result, metric, index) => {
            if (metric.value !== null) result[String(index)] = metric.value;
            return result;
          }, {}),
        );
        return;
      }

      const startedAt = performance.now();
      const duration = 1050;
      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCounts(
          metrics.reduce<Record<string, number>>((result, metric, index) => {
            if (metric.value !== null) result[String(index)] = metric.value * eased;
            return result;
          }, {}),
        );
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    if (reducedMotion) {
      start();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            start();
            observer?.disconnect();
          }
        },
        { threshold: 0.24 },
      );
      observer.observe(node);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [items.length, metrics, reducedMotion, items]);

  return { containerRef, metrics, counts };
}