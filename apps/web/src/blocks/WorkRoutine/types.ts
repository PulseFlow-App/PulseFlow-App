/** Legacy: question/choice flow (kept for backward compatibility). */
export type QuestionOption = {
  value: string;
  text: string;
  score: number;
};

export type Question = {
  id: number;
  question: string;
  category: string;
  options: QuestionOption[];
};

export type QuestionResponse = {
  questionId: number;
  selectedOption: string;
  score: number;
};

/** Handoff from block AI for Pulse aggregation (when 2+ blocks). */
export type AggregationHandoff = {
  block: string;
  primary_driver?: string;
  key_signals?: Record<string, unknown>;
  cross_block_flags?: string[];
  body_connection_used?: string | null;
  user_note_literal?: string;
  experiment?: string;
  confidence?: 'low' | 'medium' | 'high';
  [key: string]: unknown;
};

export type CheckInAnalysis = {
  /** Legacy / fallback: single-line summary */
  assessment: string;
  /** Legacy: list of tips. When narrative format is used, prefer pattern + shaping + oneThing. */
  quickWins: string[];
  recommendations?: string[];
  /** Narrative format (aligned with Body Signals): today's pattern in one short paragraph */
  pattern?: string;
  /** What's shaping your routine: bullet lines, each adds a signal/cause/relationship */
  shaping?: string;
  /** One thing to observe or try (experiment framing) */
  oneThing?: string;
  /** For Pulse aggregation when 2+ blocks */
  aggregation_handoff?: AggregationHandoff | null;
};

export type WorkspaceType = 'home' | 'office' | 'cafe' | 'other';
export type MeetingLoad = 'none' | 'few' | 'many';

/** Optional photo upload (e.g. calendar, desk setup). dataUrl for local display; photoUri when uploaded to API. */
export type CheckInPhoto = {
  dataUrl: string;
  caption?: string;
  /** Set after upload to API (e.g. /users/me/photos/:id). */
  photoUri?: string;
};

/**
 * Work-day metrics (slide/form style). All numeric scales 1-5 unless noted.
 * Maps to Work Routine concepts: focusSessions+distractions+interruptions → focus quality;
 * energyStart/End+taskCompletion → mental fatigue; workHours+meetingLoad → workload intensity;
 * breaks → recovery during work; deskComfort → posture; workspace+distractions → environment.
 * See .cursor/skills/work-routine/SKILL.md.
 */
export type WorkDayMetrics = {
  workHours: number;
  focusSessions: number;
  breaks: number;
  workspace: WorkspaceType;
  deskComfort: number;
  distractions: number;
  interruptions: number;
  energyStart: number;
  energyEnd: number;
  taskCompletion: number;
  meetingLoad: MeetingLoad;
  screenHours?: number;
  notes?: string;
  photo?: CheckInPhoto;
};

export type CheckInEntry = {
  id: string;
  timestamp: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  analysis: CheckInAnalysis;
  /** Legacy: question responses */
  responses?: Record<string, QuestionResponse>;
  answers?: Record<string, string>;
  /** New: work-day metrics (slide form) */
  metrics?: WorkDayMetrics;
};
