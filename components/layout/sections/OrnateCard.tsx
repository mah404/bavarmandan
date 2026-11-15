import type { ReactNode } from "react";

/*
 * The «illuminated book cover» look of the five section cards on the first page: a double golden frame, four
 * ornamented corners, a small diamond in the middle of the top and bottom lines, and an eight-pointed star that holds
 * the section's icon. Only the look lives here: each card keeps its own click handling.
 */

const CORNER = (
  <g fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M33 2H14c-6 0-12 6-12 12v19" />
    <path d="M26 2c0 6-4 10-10 10 0-6 4-10 10-10zM2 26c6 0 10-4 10-10-6 0-10 4-10 10z" />
    <circle cx="9" cy="9" r="2.2" fill="currentColor" />
  </g>
);

export function OrnateFrame() {
  return (
    <>
      <span className="ic-frame" aria-hidden="true" />
      <span className="ic-mid ic-t" aria-hidden="true" />
      <span className="ic-mid ic-b" aria-hidden="true" />
      {(["ic-tr", "ic-tl", "ic-br", "ic-bl"] as const).map((corner) => (
        <svg key={corner} className={`ic-cn ${corner}`} viewBox="0 0 34 34" aria-hidden="true">
          {CORNER}
        </svg>
      ))}
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
