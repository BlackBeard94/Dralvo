import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#08080C",
          color: "#F0EDE8",
          padding: 80,
          fontFamily: "Georgia",
        }}
      >
        <div style={{ color: "#D4A843", fontSize: 28, letterSpacing: 8 }}>
          DRALVO
        </div>
        <div style={{ fontSize: 84, lineHeight: 1.04, marginTop: 28 }}>
          Two machines. One metal.
        </div>
        <div style={{ color: "#9D9992", fontSize: 28, marginTop: 28, maxWidth: 820 }}>
          Verified XAUUSD trading robots — GoldMaster (D1) & GoldScalp (M15).
          No martingale, no grid.
        </div>
      </div>
    ),
    size
  );
}
