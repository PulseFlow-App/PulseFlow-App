/** Capitalize the first letter of each word; keep the rest as typed. */
export function capitalizeLabel(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\S+/g, (word) => {
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
}
