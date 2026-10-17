import type { SVGProps } from "react";

/** Solar `magnifier-bold-duotone` — Horizon dual-tone (soft fill + ink detail). */
export function SolarMagnifier({
  soft = "currentColor",
  ink = "currentColor",
  softOpacity = 1,
  ...props
}: SVGProps<SVGSVGElement> & {
  soft?: string;
  ink?: string;
  softOpacity?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden
      {...props}
    >
      <g fill={soft} fillOpacity={softOpacity}>
        <circle cx="11.5" cy="11.5" r="9.5"/>
      </g>
      <g fill={ink}>
        <path d="M21.7891 20.7656C22.0713 21.0479 22.0711 21.5058 21.7891 21.7881C21.5068 22.0704 21.0489 22.0704 20.7666 21.7881L17.6855 18.707C18.0516 18.3926 18.3926 18.0506 18.707 17.6846L21.7891 20.7656Z"/>
      </g>
    </svg>
  );
}
