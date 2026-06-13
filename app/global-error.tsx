"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#f3faff",
          color: "#143a5a",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>حدث خطأ في التطبيق</h1>
          <p style={{ marginTop: "12px", opacity: 0.8 }}>تعذر تحميل الصفحة. جرّب إعادة المحاولة.</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              background: "#2388c4",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            حاول مرة أخرى
          </button>
        </div>
      </body>
    </html>
  );
}
