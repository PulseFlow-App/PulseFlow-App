import { isDemoMode } from "@/lib/env";

export const DEMO_READ_ONLY_MESSAGE =
  "Demo only. Sign up for a real account to make changes.";

/** Block mutations while the public demo is running. */
export function assertDemoWritable() {
  if (isDemoMode()) {
    throw new Error(DEMO_READ_ONLY_MESSAGE);
  }
}
