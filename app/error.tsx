"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log l'erreur pour debugging
    console.error("Error Boundary caught:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error digest:", error.digest);
  }, [error]);

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ color: "#dc2626", marginBottom: 16 }}>Application Error</h1>
      <div style={{ backgroundColor: "#fef2f2", padding: 20, borderRadius: 8, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Error Message:</h2>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 14 }}>
          {error.message}
        </pre>
      </div>
      
      {error.stack && (
        <div style={{ backgroundColor: "#f9fafb", padding: 20, borderRadius: 8, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Stack Trace:</h2>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, overflow: "auto", maxHeight: 400 }}>
            {error.stack}
          </pre>
        </div>
      )}

      {error.digest && (
        <div style={{ backgroundColor: "#f0f9ff", padding: 20, borderRadius: 8, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Error Digest:</h2>
          <code style={{ fontSize: 14 }}>{error.digest}</code>
        </div>
      )}

      <button
        onClick={reset}
        style={{
          padding: "12px 24px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 16,
          fontWeight: 500,
        }}
      >
        Try again
      </button>
    </div>
  );
}

