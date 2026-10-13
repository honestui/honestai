import { useId } from "react";

/**
 * Illustrated marks for the Library switcher. They share one construction:
 * a 32-unit grid, one gradient-filled hero shape, and supporting shapes in
 * the same hue at reduced opacity. Colors are fixed per mark, so the row's
 * text color cannot repaint them.
 */

export interface ProductAreaIconProps {
  className?: string;
}

interface Palette {
  from: string;
  to: string;
}

function useGradient({ from, to }: Palette) {
  const id = useId();

  return {
    paint: `url(#${id})`,
    def: (
      <linearGradient
        id={id}
        gradientUnits="userSpaceOnUse"
        x1="4"
        y1="2"
        x2="28"
        y2="30"
      >
        <stop style={{ stopColor: from }} />
        <stop offset="1" style={{ stopColor: to }} />
      </linearGradient>
    ),
  };
}

function Mark({
  className,
  children,
}: ProductAreaIconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

const COMPONENTS: Palette = { from: "#FF9076", to: "#E43861" };

export function AIComponentsAreaIcon({ className }: ProductAreaIconProps) {
  const gradient = useGradient(COMPONENTS);

  return (
    <Mark className={className}>
      <defs>{gradient.def}</defs>
      <rect x="3" y="4" width="26" height="11" rx="4.5" fill={gradient.paint} />
      <rect
        x="8"
        y="8.25"
        width="10"
        height="2.5"
        rx="1.25"
        fill="#fff"
        fillOpacity="0.85"
      />
      <rect
        x="3"
        y="17.5"
        width="11.5"
        height="11.5"
        rx="4"
        fill={COMPONENTS.to}
        fillOpacity="0.5"
      />
      <circle
        cx="23"
        cy="23.25"
        r="5.75"
        fill={COMPONENTS.to}
        fillOpacity="0.28"
      />
    </Mark>
  );
}

const PRODUCT_ACCENT = "var(--hui-color-foreground-accent-primary)";
const PRODUCT: Palette = {
  from: `color-mix(in oklab, ${PRODUCT_ACCENT} 50%, white)`,
  to: PRODUCT_ACCENT,
};

export function GenerativeAreaIcon({ className }: ProductAreaIconProps) {
  const gradient = useGradient(PRODUCT);
  const layer = "M16 4.5 27 10.25 16 16 5 10.25Z";

  return (
    <Mark className={className}>
      <defs>{gradient.def}</defs>
      <g strokeWidth="3" strokeLinejoin="round">
        <path
          d={layer}
          transform="translate(0 11.5)"
          style={{ fill: PRODUCT.to, stroke: PRODUCT.to }}
          opacity="0.25"
        />
        <path
          d={layer}
          transform="translate(0 5.75)"
          style={{ fill: PRODUCT.to, stroke: PRODUCT.to }}
          opacity="0.5"
        />
        <path d={layer} fill={gradient.paint} stroke={gradient.paint} />
      </g>
    </Mark>
  );
}
