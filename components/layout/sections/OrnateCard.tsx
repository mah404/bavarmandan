import type { ReactNode } from "react";

/*
 * The «illuminated book cover» look of the five section cards on the first page: a double golden frame, a small diamond in the middle of the top and bottom lines, and an eight-pointed star that holds
 * the section's icon. Only the look lives here: each card keeps its own click handling.
 */

export function OrnateFrame() {
  return (
    <>
      <span className="ic-frame" aria-hidden="true" />
      <span className="ic-mid ic-t" aria-hidden="true" />
      <span className="ic-mid ic-b" aria-hidden="true" />
    </>
  );
}

/** The star and, inside it, the icon of the section (pass the icon with the class «ic-ico»). */
export function OrnateMedal({ children }: { children: ReactNode }) {
  return (
    <span className="ic-medal" aria-hidden="true">
      <svg className="ic-star" viewBox="0 0 76 76">
        <g fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1">
          <rect x="15" y="15" width="46" height="46" rx="3" />
          <rect x="15" y="15" width="46" height="46" rx="3" transform="rotate(45 38 38)" />
        </g>
      </svg>
      {children}
    </span>
  );
}

/** The light that runs across the card on hover. */
export function OrnateShine() {
  return <span className="ic-shine" aria-hidden="true" />;
}
