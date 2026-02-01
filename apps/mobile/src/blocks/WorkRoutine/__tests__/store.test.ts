import {
  addCheckIn,
  getCheckIns,
  getLatestCheckIn,
  getHistoricalCheckIns,
  getStreak,
  getWeeklyProgress,
  resetWorkRoutineStore,
} from '../store';
import { WORK_ROUTINE_QUESTIONS } from '../questions';

function fullResponses(scores: number[]): Record<string, { questionId: number; selectedOption: string; score: number }> {
  const out: Record<string, { questionId: number; selectedOption: string; score: number }> = {};
  WORK_ROUTINE_QUESTIONS.forEach((q, i) => {
    const score = scores[i] ?? 2;
    const opt = q.options.find((o) => o.score === score) ?? q.options[1];
    out[q.id.toString()] = { questionId: q.id, selectedOption: opt.value, score: opt.score };
  });
  return out;
}

function fullAnswers(scores: number[]): Record<string, string> {
  const out: Record<string, string> = {};
  WORK_ROUTINE_QUESTIONS.forEach((q, i) => {
    const score = scores[i] ?? 2;
    const opt = q.options.find((o) => o.score === score) ?? q.options[1];
    out[q.id.toString()] = opt.text;
  });
  return out;
}

beforeEach(() => {
  resetWorkRoutineStore();
});

describe('WorkRoutine store', () => {
  it('starts with no check-ins', () => {
    expect(getCheckIns()).toEqual([]);
    expect(getLatestCheckIn()).toBeUndefined();
    expect(getStreak()).toBe(0);
    expect(getWeeklyProgress()).toEqual({ count: 0, percent: 0 });
  });

  it('addCheckIn appends entry with analysis', () => {
    const responses = fullResponses([3, 3, 3, 2, 2, 3]);
    const answers = fullAnswers([3, 3, 3, 2, 2, 3]);
    const entry = addCheckIn(responses, answers);

    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();
    expect(entry.responses).toEqual(responses);
    expect(entry.answers).toEqual(answers);
    expect(entry.analysis.assessment).toBeDefined();
    expect(entry.analysis.quickWins.length).toBeGreaterThan(0);
    expect(['morning', 'afternoon', 'evening']).toContain(entry.timeOfDay);
  });

  it('getCheckIns returns entries newest first', () => {
    const r1 = fullResponses([1, 1, 1, 1, 1, 1]);
    const a1 = fullAnswers([1, 1, 1, 1, 1, 1]);
    const r2 = fullResponses([4, 4, 4, 4, 4, 4]);
    const a2 = fullAnswers([4, 4, 4, 4, 4, 4]);

    addCheckIn(r1, a1);
    addCheckIn(r2, a2);
    const list = getCheckIns();

    expect(list.length).toBe(2);
    expect(list[0].analysis.assessment).toContain('Strong');
    expect(list[1].analysis.assessment).toBeDefined();
  });

  it('getLatestCheckIn returns most recent', () => {
    const r1 = fullResponses([2, 2, 2, 2, 2, 2]);
    const a1 = fullAnswers([2, 2, 2, 2, 2, 2]);
    addCheckIn(r1, a1);
    expect(getLatestCheckIn()).toBeDefined();
    expect(getLatestCheckIn()!.responses).toEqual(r1);
  });

  it('getHistoricalCheckIns filters by days', () => {
    const r = fullResponses([2, 2, 2, 2, 2, 2]);
    const a = fullAnswers([2, 2, 2, 2, 2, 2]);
    addCheckIn(r, a);
    expect(getHistoricalCheckIns(7).length).toBe(1);
    expect(getHistoricalCheckIns(1).length).toBe(1);
  });

  it('rule-based analysis: low sleep adds sleep quick win', () => {
    const responses = fullResponses([1, 3, 3, 3, 2, 3]); // sleep=1
    const answers = fullAnswers([1, 3, 3, 3, 2, 3]);
    const entry = addCheckIn(responses, answers);
    expect(entry.analysis.quickWins.some((w) => w.toLowerCase().includes('sleep'))).toBe(true);
  });

  it('rule-based analysis: high scores yield strong assessment', () => {
    const responses = fullResponses([4, 4, 4, 4, 4, 4]);
    const answers = fullAnswers([4, 4, 4, 4, 4, 4]);
    const entry = addCheckIn(responses, answers);
    expect(entry.analysis.assessment).toContain('Strong');
  });

  it('getStreak and getWeeklyProgress after one check-in', () => {
    const r = fullResponses([2, 2, 2, 2, 2, 2]);
    const a = fullAnswers([2, 2, 2, 2, 2, 2]);
    addCheckIn(r, a);
    expect(getStreak()).toBe(1);
    const weekly = getWeeklyProgress();
    expect(weekly.count).toBe(1);
    expect(weekly.percent).toBeGreaterThan(0);
  });
});
