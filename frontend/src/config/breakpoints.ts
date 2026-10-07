/**
 * Tailwind CSS breakpoints, mirrored in `src/app/globals.css` (`@theme`).
 *
 * Keep both places in sync — the CSS block is what Tailwind compiles the
 * `sm:` / `md:` / `lg:` / `xl:` / `2xl:` / `3xl:` variants from, and this map
 * is the single source of truth for JavaScript consumers (hooks, charts,
 * conditional rendering) that need the same numbers.
 */
export const BREAKPOINTS = {
  sm: 640, // large phones
  md: 768, // tablets
  lg: 1024, // laptops
  xl: 1280, // desktops
  "2xl": 1536, // large displays
  "3xl": 1920, // extra large / 4K displays
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Device classes the UI must stay usable on. */
export const DEVICE_CLASSES = [
  "mobile",
  "tablet",
  "laptop",
  "desktop",
  "large-display",
] as const;

export type DeviceClass = (typeof DEVICE_CLASSES)[number];

/** Build a `(min-width: …)` media query string for a breakpoint. */
export function minWidthQuery(breakpoint: Breakpoint): string {
  return `(min-width: ${BREAKPOINTS[breakpoint]}px)`;
}
