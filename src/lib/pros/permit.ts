/** Thai nationals do not get the work-permit reminder. */
export function needsWorkPermit(nationality: string | null | undefined) {
  const value = (nationality ?? "").trim().toLowerCase();
  if (!value) return true;
  return value !== "thai" && value !== "ไทย" && value !== "thailand";
}
