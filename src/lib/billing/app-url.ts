/** App URL helper (legacy path name kept for import stability). */
export function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
