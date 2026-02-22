export const BLOCK_COLORS = {
  body: '#00ff88',
  work: '#3b82f6',
  nutrition: '#f59e0b',
} as const;

export function getScoreColor(score: number): string {
  if (score >= 70) return '#00ff88';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

export function getStatusLabel(score: number): string {
  if (score >= 70) return 'Good';
  if (score >= 40) return 'Moderate';
  return 'Low';
}
