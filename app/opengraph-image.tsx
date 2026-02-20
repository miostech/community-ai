import { ImageResponse } from "next/og";

export const alt = "Dome - Crie conteúdo com inteligência artificial";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 35%, #ec4899 100%)",
        }}
      >
        {/* Mesmo visual do favicon (icon.svg): gradiente + D */}
        <span
          style={{
            fontSize: 320,
            fontWeight: 700,
            color: "white",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          D
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
