"use client";

import { useEffect, useRef } from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartConfiguration,
  type Plugin,
  type ScriptableContext,
} from "chart.js";

Chart.register(BarController, BarElement, CategoryScale, Filler, LineController, LineElement, LinearScale, PointElement, Tooltip);

const fa = (value: number) => Math.round(value).toLocaleString("fa-IR");

type Rgb = [number, number, number];

/** Any CSS colour (also «color-mix» and «hsl(var(--x))») as red, green, blue, which the canvas always understands. */
function resolve(color: string): Rgb {
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const holder = document.createElement("span");
  holder.style.color = color;
  holder.style.display = "none";
  document.body.appendChild(holder);
  const computed = getComputedStyle(holder).color;
  holder.remove();
  if (!probe) return [128, 128, 128];
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = computed;
  probe.fillRect(0, 0, 1, 1);
  const pixel = probe.getImageData(0, 0, 1, 1).data;
  return [pixel[0], pixel[1], pixel[2]];
}

const rgba = ([r, g, b]: Rgb, alpha: number) => `rgba(${r},${g},${b},${alpha})`;

/** Each chart has its own colour, lighter on the dark theme and deeper on the light one. */
const TONES = {
  blue: { dark: [96, 165, 250], light: [29, 78, 216] },
  violet: { dark: [167, 139, 250], light: [109, 40, 217] },
  green: { dark: [52, 211, 153], light: [4, 120, 87] },
} as const satisfies Record<string, { dark: Rgb; light: Rgb }>;
export type Tone = keyof typeof TONES;

/** The page's colours, read from its CSS so both themes (and a theme change) are followed. */
function palette(tone?: Tone) {
  const dark = document.documentElement.classList.contains("dark");
  const scope = document.querySelector(".bv-home") ?? document.body;
  const read = (name: string) => {
    const value = getComputedStyle(scope).getPropertyValue(name).trim();
    return value || "#888";
  };
  return {
    accent: tone ? ([...TONES[tone][dark ? "dark" : "light"]] as Rgb) : resolve(read("--gold")),
    ink: resolve(read("--ink")),
    muted: resolve(read("--muted")),
    surface: resolve("hsl(var(--background))"),
    line: resolve("hsl(var(--foreground))"),
    font: getComputedStyle(scope).fontFamily,
  };
}

/** Builds a chart on a canvas, and builds it again when the theme changes. */
type AnyConfig = ChartConfiguration<"line"> | ChartConfiguration<"bar">;

function useChart(build: (colors: ReturnType<typeof palette>) => AnyConfig, deps: unknown[], tone?: Tone) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let chart: Chart | null = null;
    const draw = (animate: boolean) => {
      chart?.destroy();
      const config = build(palette(tone));
      chart = new Chart(element, { ...config, options: { ...config.options, animation: animate ? config.options?.animation : false } } as ChartConfiguration);
    };
    draw(true);

    // The theme is a class on <html>: redraw with the new colours, without replaying the entrance.
    const watcher = new MutationObserver(() => draw(false));
    watcher.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      watcher.disconnect();
      chart?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return canvas;
}

/** A dashed vertical line at the point the pointer is on. */
const cursor = (color: string): Plugin => ({
  id: "cursor",
  afterDatasetsDraw(chart) {
    const active = chart.getActiveElements()[0];
    if (!active) return;
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(active.element.x, chartArea.top);
    ctx.lineTo(active.element.x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
});

interface LineProps {
  /** Short text under the axis (a date or an hour). */
  labels: string[];
  /** The longer text of the tooltip's title. */
  titles: string[];
  values: number[];
  /** What the tooltip says after the number, e.g. «بازدیدکننده». */
  unit: string;
  tone?: Tone;
}

/** The visits over time: a smooth line with a soft fill, a cursor and a tooltip. Oldest on the left, newest on the right. */
export function VisitsLine({ labels, titles, values, unit, tone }: LineProps) {
  const canvas = useChart(
    (c) => ({
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: rgba(c.accent, 1),
            borderWidth: 2.5,
            cubicInterpolationMode: "monotone",
            fill: true,
            backgroundColor: (context: ScriptableContext<"line">) => {
              const { chart } = context;
              if (!chart.chartArea) return rgba(c.accent, 0.2);
              const gradient = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
              gradient.addColorStop(0, rgba(c.accent, 0.38));
              gradient.addColorStop(1, rgba(c.accent, 0));
              return gradient;
            },
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBorderWidth: 3,
            pointHoverBackgroundColor: rgba(c.accent, 1),
            pointHoverBorderColor: rgba(c.surface, 1),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: "easeOutQuart" },
        interaction: { mode: "index", intersect: false },
        layout: { padding: { top: 8, right: 4 } },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: rgba(c.muted, 1), maxTicksLimit: 7, maxRotation: 0, autoSkipPadding: 16, font: { family: c.font, size: 11 } },
          },
          y: {
            position: "right",
            beginAtZero: true,
            grace: "10%",
            border: { display: false },
            grid: { color: rgba(c.line, 0.09) },
            ticks: { color: rgba(c.muted, 1), precision: 0, maxTicksLimit: 5, padding: 10, font: { family: c.font, size: 11 }, callback: (value) => fa(Number(value)) },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            rtl: true,
            textDirection: "rtl",
            displayColors: false,
            backgroundColor: rgba(c.surface, 0.96),
            borderColor: rgba(c.line, 0.2),
            borderWidth: 1,
            titleColor: rgba(c.muted, 1),
            bodyColor: rgba(c.ink, 1),
            padding: 12,
            cornerRadius: 12,
            caretSize: 0,
            titleFont: { family: c.font, size: 12, weight: "normal" },
            bodyFont: { family: c.font, size: 14, weight: "bold" },
            callbacks: {
              title: (items) => titles[items[0]?.dataIndex ?? 0] ?? "",
              label: (item) => `${fa(Number(item.raw))} ${unit}`,
            },
          },
        },
      },
      plugins: [cursor(rgba(c.line, 0.35))],
    }),
    [labels, titles, values, unit],
    tone
  );

  return <canvas ref={canvas} role="img" aria-label="نمودار بازدید" />;
}

interface BarsProps {
  labels: string[];
  titles: string[];
  values: number[];
  unit: string;
  /** Which bar is the highest, drawn in the full accent colour (-1 for none). */
  peak: number;
  /** Show only every n-th label on the axis. */
  labelEvery?: number;
  tone?: Tone;
}

/** Bars with rounded tops. The first bar is on the right, as on the rest of this right-to-left page. */
export function BarsChart({ labels, titles, values, unit, peak, labelEvery = 1, tone }: BarsProps) {
  const canvas = useChart(
    (c) => ({
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderRadius: 7,
            borderSkipped: false,
            minBarLength: 3,
            categoryPercentage: 0.82,
            barPercentage: 0.9,
            backgroundColor: values.map((_, index) => rgba(c.accent, index === peak ? 1 : 0.34)),
            hoverBackgroundColor: values.map((_, index) => rgba(c.accent, index === peak ? 1 : 0.62)),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: "easeOutQuart" },
        layout: { padding: { top: 6 } },
        scales: {
          x: {
            reverse: true,
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: rgba(c.muted, 1),
              autoSkip: false,
              maxRotation: 0,
              font: { family: c.font, size: 11 },
              callback: (_, index) => (index % labelEvery === 0 ? labels[index] : ""),
            },
          },
          y: { display: false, beginAtZero: true },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            rtl: true,
            textDirection: "rtl",
            displayColors: false,
            backgroundColor: rgba(c.surface, 0.96),
            borderColor: rgba(c.line, 0.2),
            borderWidth: 1,
            titleColor: rgba(c.muted, 1),
            bodyColor: rgba(c.ink, 1),
            padding: 12,
            cornerRadius: 12,
            caretSize: 0,
            titleFont: { family: c.font, size: 12, weight: "normal" },
            bodyFont: { family: c.font, size: 14, weight: "bold" },
            callbacks: {
              title: (items) => titles[items[0]?.dataIndex ?? 0] ?? "",
              label: (item) => `${Number(item.raw).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} ${unit}`,
            },
          },
        },
      },
    }),
    [labels, titles, values, unit, peak, labelEvery],
    tone
  );

  return <canvas ref={canvas} role="img" aria-label="نمودار میله‌ای" />;
}
