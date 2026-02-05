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
};

export type WorkspaceType = 'home' | 'office' | 'cafe' | 'other';
export type MeetingLoad = 'none' | 'few' | 'many';

/** Optional photo upload (e.g. calendar, desk setup). Stored as data URL; keep small for localStorage. */
export type CheckInPhoto = {
  dataUrl: string;
  caption?: string;
};

/**
 * Work-day metrics (slide/form style). All numeric scales 1–5 unless noted.
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
