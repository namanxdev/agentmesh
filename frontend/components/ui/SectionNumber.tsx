interface SectionNumberProps {
  num: string;
}

export function SectionNumber({ num }: SectionNumberProps) {
  return (
    <span
      aria-hidden="true"
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(80px, 10vw, 120px)",
        fontWeight: 900,
        color: "hsl(225, 15%, 12%)",
        lineHeight: 1,
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {num}
    </span>
  );
}
