"use client";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#f3f1ec",
          color: "#17150f",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        <title>Error — Content Studio</title>
        <main style={{ maxWidth: 520, padding: "72px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#d4371c" }} />
            <strong style={{ fontSize: 15 }}>Content Studio</strong>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Aplikasi gagal dimuat</h1>
          <p style={{ color: "#57534a", margin: "6px 0 0" }}>
            Terjadi kesalahan di level aplikasi. Coba muat ulang; kalau tetap gagal, cek log server.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, color: "#8a857a" }}>
              digest {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 20,
              height: 32,
              padding: "0 12px",
              border: 0,
              borderRadius: 2,
              background: "#17150f",
              color: "#f3f1ec",
              font: "inherit",
              fontWeight: 500,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
