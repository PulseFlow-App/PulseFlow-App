"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f5fafc",
          color: "#023047",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, opacity: 0.75, marginBottom: 16 }}>
            The error was reported. Try again, or reload the page.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              border: 0,
              borderRadius: 999,
              background: "#f26a36",
              color: "#fff",
              fontWeight: 600,
              padding: "10px 18px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}