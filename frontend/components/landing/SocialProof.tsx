"use client";

const TECH_ITEMS = [
  "FastAPI",
  "LangGraph",
  "MCP Protocol",
  "Gemini API",
  "Groq",
  "WebSocket",
  "Next.js 16",
  "React 19",
  "Python 3.11",
  "Vercel",
  "Render",
  "FastMCP",
];

export function SocialProof() {
  const doubled = [...TECH_ITEMS, ...TECH_ITEMS];

  return (
    <div
      className="relative overflow-hidden py-5"
      style={{
        background: "rgba(0,229,255,0.015)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Fade edges */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32"
        style={{ background: "linear-gradient(to right, #04060E, transparent)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32"
        style={{ background: "linear-gradient(to left, #04060E, transparent)" }}
      />

      <div className="land-marquee">
        <div className="land-marquee-track">
          {doubled.map((name, i) => (
            <span key={`${name}-${i}`} className="flex items-center gap-4 px-2">
              <span
                className="h-px w-4 flex-shrink-0"
                style={{ background: "rgba(0,229,255,0.35)" }}
              />
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "13px",
                  letterSpacing: "0.04em",
                  color: "rgba(240,244,255,0.45)",
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
