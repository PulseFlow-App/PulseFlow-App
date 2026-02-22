/**
 * Daily Report JSON (from API /report/daily). Matches daily-report-system-prompt.md.
 */
export type DailyReportJson = {
  report_date: string;
  user_name: string;
  blocks_logged: ('body' | 'work' | 'nutrition')[];
  report_type: 'complete' | 'partial';
  pulse_summary: {
    overall_score: number;
    score_framing: string;
    block_scores: {
      body?: { score: number; label: string };
      work?: { score: number; label: string };
      nutrition?: { score: number; label: string };
    };
  };
  synthesis: {
    what_connected_today: string;
    primary_driver: string;
    chain: string;
  };
  block_details: {
    body?: BlockDetail;
    work?: BlockDetail;
    nutrition?: BlockDetail;
  };
  recommendations: Array<{
    priority: number;
    action: string;
    observe: string;
    why: string;
    blocks_referenced: ('body' | 'work' | 'nutrition')[];
  }>;
  tomorrow_signal: string;
  footer_note: string;
};

export type BlockDetail = {
  todays_pattern: string;
  drivers: string[];
  raw_signals: Record<string, unknown>;
  user_note?: string;
};
