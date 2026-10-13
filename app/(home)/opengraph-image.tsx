import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "Honest AI: React components for agent and chat interfaces. A chat bubble asks “What is Honest AI?”";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The site's light theme: page background, text, secondary text, and the user bubble.
const colors = {
  background: "#fbfcfd",
  text: "#151718",
  secondary: "#60646c",
  bubble: "#e6e8eb",
  rule: "#d7dbdf",
};

function loadFont(file: string) {
  return readFile(join(process.cwd(), "public/fonts", file));
}

export default async function Image() {
  const [regular, medium] = await Promise.all([
    loadFont("LoveSans-Regular.woff"),
    loadFont("LoveSans-Medium.woff"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: colors.background,
          color: colors.text,
          fontFamily: "Love Sans",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, fontWeight: 500 }}>
          <span>Honest</span>
          <span style={{ marginLeft: 10, color: colors.secondary }}>AI</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              maxWidth: 1056,
              fontSize: 76,
              fontWeight: 500,
              lineHeight: 1.04,
              letterSpacing: "-0.02em",
            }}
          >
            React components for agent and chat interfaces
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: colors.secondary }}>
            Each one renders the state your application passes in.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${colors.rule}`,
            paddingTop: 32,
            fontSize: 28,
          }}
        >
          <span style={{ color: colors.secondary }}>ai.honestui.com</span>
          <div
            style={{
              display: "flex",
              padding: "16px 28px",
              borderRadius: 24,
              background: colors.bubble,
              fontWeight: 500,
            }}
          >
            What is Honest AI?
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Love Sans", data: regular, weight: 400, style: "normal" },
        { name: "Love Sans", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
