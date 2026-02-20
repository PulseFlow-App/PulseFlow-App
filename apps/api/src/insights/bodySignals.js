/**
 * Body Signals — narrative-first Pulse insights.
 * One main insight, causal chains, one small experiment. No repetition, no tables, no generic tips.
 * Aligned with: body-signals-system-prompt.md and body-signals-physiology skill.
 */

const MAX_IMPROVEMENTS = 1; // One thing to try, not a list

// Extract themes from free-text notes (case-insensitive).
// Distinguish "no/low appetite" from "high hunger" so we don't say "you mentioned appetite or hunger" when they said the opposite.
function getNoteThemes(notes) {
  if (!notes || typeof notes !== 'string' || !notes.trim()) return [];
  const lower = notes.toLowerCase().trim();
  const themes = [];
  // Low/no appetite first (do not treat as hunger)
  if (/\b(no appetite|low appetite|lost my? appetite|not hungry|don't feel like eating|no hunger|reduced appetite|lack of appetite|without appetite|appetite is gone|can't eat|don't want to eat|no desire to eat)\b/.test(lower)) {
    themes.push('no_appetite');
  } else if (/\b(hungry|ravenous|starving|ready to eat|eat (a )?lot|craving|big appetite|good appetite)\b/.test(lower)) {
    themes.push('hunger');
  }
  if (/\b(bloat|digestion|stomach|gut|full|indigestion|nausea|constipation)\b/.test(lower)) themes.push('digestion');
  if (/\b(tired|fatigue|exhausted|drained|low energy)\b/.test(lower)) themes.push('fatigue');
  if (/\b(stress|stressed|overwhelm|deadline|anxious)\b/.test(lower)) themes.push('stress');
  if (/\b(sick|unwell|headache|recovery|under the weather)\b/.test(lower)) themes.push('recovery');
  if (/\b(sleep|insomnia|wake|waking|rest|slept)\b/.test(lower)) themes.push('sleep');
  if (/\b(dry|thirst|water|hydrat|dehydrat)\b/.test(lower)) themes.push('hydration');
  if (/\b(mood|down|sad|irritable|grumpy|anxious)\b/.test(lower)) themes.push('mood');
  if (/\b(dizzy|dizziness|lightheaded|light-headed|vertigo|woozy)\b/.test(lower)) themes.push('dizzy');
  // Situational: events and plans (for Situation → Tradeoff → Adjustment)
  if (/\b(gym|workout|training|exercise|ran|run|lift|cardio|sport)\b/.test(lower)) themes.push('exercise');
  if (/\b(party|parties|going out|drinks|alcohol|late night|night out)\b/.test(lower)) themes.push('party_late');
  if (/\b(travel|flight|flying|jet lag|trip|traveling)\b/.test(lower)) themes.push('travel');
  if (/\b(deadline|deadlines|big day|presentation|exam|interview)\b/.test(lower)) themes.push('deadline');
  if (themes.includes('stress') && themes.includes('sleep')) themes.push('stress_sleep');
  return themes;
}

// Build "what affects what" factors from entry + note themes
function buildFactors(entry, frictionPoints, noteThemes) {
  const factors = [];
  const e = entry || {};

  if (e.sleepHours != null && (e.sleepHours < 6 || e.sleepHours > 9) || frictionPoints.includes('sleep') || noteThemes.includes('sleep')) {
    factors.push({ factor: 'Sleep', impact: e.sleepHours != null && (e.sleepHours < 5 || e.sleepHours > 10) ? 'high' : 'medium', affects: ['Energy', 'Mood', 'Appetite'], note: 'Poor or irregular sleep often affects energy, mood, and next-day hunger.' });
  }
  if (e.sleepQuality != null && e.sleepQuality < 3) {
    factors.push({ factor: 'Sleep quality', impact: 'medium', affects: ['Energy', 'Mood'], note: 'Restless or light sleep can leave you tired and affect hunger cues.' });
  }
  if (e.stress != null && e.stress >= 4 || frictionPoints.includes('stress') || noteThemes.includes('stress')) {
    factors.push({ factor: 'Stress', impact: e.stress >= 4 ? 'high' : 'medium', affects: ['Sleep', 'Mood', 'Digestion'], note: 'Stress can disrupt sleep, mood, and digestion.' });
  }
  if (e.energy != null && e.energy <= 2 || frictionPoints.includes('energy') || noteThemes.includes('fatigue')) {
    factors.push({ factor: 'Energy', impact: 'medium', affects: ['Mood', 'Appetite'], note: 'Low energy often links to sleep, hydration, or meal timing.' });
  }
  if (e.hydration != null && e.hydration <= 2 || frictionPoints.includes('hydration') || noteThemes.includes('hydration')) {
    factors.push({ factor: 'Hydration', impact: 'medium', affects: ['Energy', 'Digestion'], note: 'Dehydration can lower energy and affect how you feel after eating.' });
  }
  if (e.mood != null && e.mood <= 2 || frictionPoints.includes('mood') || noteThemes.includes('mood')) {
    factors.push({ factor: 'Mood', impact: 'medium', affects: ['Energy', 'Sleep'], note: 'Mood is influenced by sleep, stress, and activity.' });
  }
  const lowAppetite = noteThemes.includes('no_appetite') || (e.appetite != null && e.appetite <= 1);
  const highHunger = noteThemes.includes('hunger') || (e.appetite != null && e.appetite >= 4);
  if (lowAppetite || highHunger) {
    const note = lowAppetite
      ? 'Low or reduced appetite is often linked to stress, sleep, or digestion.'
      : 'Hunger can be driven by sleep, stress, meal timing, or hydration.';
    factors.push({ factor: 'Appetite / hunger', impact: 'medium', affects: ['Energy', 'Mood'], note });
  }
  if (noteThemes.includes('digestion') || (e.digestion != null && e.digestion <= 2)) {
    factors.push({ factor: 'Digestion', impact: 'medium', affects: ['Energy', 'Mood'], note: 'Digestion is often affected by stress, meal size, and hydration.' });
  }
  if (noteThemes.includes('recovery')) {
    factors.push({ factor: 'Recovery', impact: 'high', affects: ['Energy', 'Sleep', 'Mood'], note: 'Your body may need more rest and lighter activity.' });
  }
  if (noteThemes.includes('dizzy')) {
    factors.push({ factor: 'Dizzy / lightheaded', impact: 'medium', affects: ['Energy', 'Hydration'], note: 'Often linked to hydration, blood sugar, or standing too fast. Sip water and move slowly.' });
  }

  return factors.slice(0, 6);
}

// Build improvements that address notes first, then friction points
function buildImprovements(entry, frictionPoints, noteThemes, factors) {
  const improvements = [];
  const e = entry || {};
  const notes = (e.notes || '').trim();

  // Prioritize what the user wrote
  if (noteThemes.includes('dizzy')) {
    improvements.push('You mentioned feeling dizzy or lightheaded. Common non-medical causes include dehydration, low blood sugar, or standing up too fast. Try sipping water, a small snack if you haven’t eaten, and moving slowly when you stand. If it persists, consider checking in with a healthcare provider.');
  }
  if (noteThemes.includes('no_appetite')) {
    improvements.push('You mentioned low or no appetite. Research suggests that often links to stress, sleep, or digestion. You might try lighter meals or eating when you notice a small window of hunger, and see how the next days feel - no pressure.');
  } else if (noteThemes.includes('hunger')) {
    improvements.push('You mentioned appetite or hunger. This often links to sleep quality and when you last ate. Try a balanced breakfast with some protein and fiber, and notice how the next days feel.');
  }
  if (noteThemes.includes('digestion')) {
    improvements.push('You mentioned digestion or stomach. Smaller meals, staying hydrated, and reducing stress may help. Avoid eating late if you notice bloating.');
  }
  if (noteThemes.includes('sleep') && (e.sleepHours != null && e.sleepHours < 7 || e.sleepQuality != null && e.sleepQuality < 3)) {
    improvements.push('Try similar bed and wake times for a few days and see how energy and appetite respond.');
  }
  if (noteThemes.includes('stress') || frictionPoints.includes('stress')) {
    improvements.push('If you try one thing today: short breaks or lighter tasks. Notice how it affects sleep and digestion.');
  }
  if (noteThemes.includes('recovery')) {
    improvements.push('Your notes suggest your body may need recovery. Prioritize rest, hydration, and lighter activity.');
  }

  // Then metric-based (micro-adjustments). When the user wrote a specific note, add at most one friction-based line so we don't pile generic advice.
  const hasNoteBased = noteThemes.length > 0 && improvements.length > 0;
  const addOneFrictionOnly = hasNoteBased;
  let frictionAdded = 0;
  if (frictionPoints.includes('sleep') && !improvements.some(i => i.toLowerCase().includes('sleep'))) {
    improvements.push('Aim for similar bed and wake times when you can - notice how it shows up in energy and mood.');
    if (addOneFrictionOnly) frictionAdded++;
  }
  if (frictionAdded < 1 && (frictionPoints.includes('hydration') || noteThemes.includes('hydration')) && !improvements.some(i => i.toLowerCase().includes('hydrat'))) {
    improvements.push('Small sips throughout the day - see if it helps energy and how you feel after meals.');
    if (addOneFrictionOnly) frictionAdded++;
  }
  if (frictionAdded < 1 && frictionPoints.includes('energy') && !improvements.some(i => i.toLowerCase().includes('energy') || i.toLowerCase().includes('rest'))) {
    improvements.push('Try short breaks or light movement today and see how it shows up in your next check-in.');
    if (addOneFrictionOnly) frictionAdded++;
  }
  if (frictionAdded < 1 && frictionPoints.includes('mood') && !improvements.some(i => i.toLowerCase().includes('mood'))) {
    improvements.push('A short walk or a few minutes outdoors - sleep and stress often influence mood.');
  }

  // Fallbacks (gentle experiment framing)
  if (improvements.length === 0) {
    improvements.push('Keep consistent sleep times when you can and notice the effect.');
    improvements.push('Small sips of water throughout the day - see how it feels.');
    improvements.push('Short breaks may help; check how they show up in your energy.');
  }

  return improvements.slice(0, MAX_IMPROVEMENTS);
}

// --- Narrative output: one pattern, one causal "why", one experiment. Never quote the user's note (interpretive grounding). ---

// Today's pattern: short sentences, 2+ signals. Interpret note intent; never echo raw note or typos.
function buildNarrativePattern(entry, trend, frictionPoints, noteThemes) {
  const e = entry || {};
  const sleepQualityLow = e.sleepQuality != null && e.sleepQuality < 3;
  const stressMid = e.stress != null && e.stress >= 3 && e.stress <= 4;
  const stressHigh = e.stress != null && e.stress >= 4;
  const appetiteMid = e.appetite != null && e.appetite >= 2 && e.appetite <= 4;

  const parts = [];

  // Stress → sleep (user describing stress disrupting sleep). Interpret; never quote the note.
  if (noteThemes.includes('stress_sleep') || (noteThemes.includes('stress') && noteThemes.includes('sleep') && (stressHigh || stressMid || sleepQualityLow))) {
    parts.push('Evening stress seems to be disrupting your sleep, which then lowers next-day energy.');
  } else if (noteThemes.includes('exercise') && noteThemes.includes('party_late')) {
    parts.push('Training added physical load earlier. A late night will likely compress sleep and recovery. Energy tomorrow is the main risk, not today.');
  } else if (noteThemes.includes('exercise')) {
    parts.push('Physical load from training is the main lever today. Recovery (food, hydration, rest) will show up in energy and mood.');
  } else if (noteThemes.includes('party_late')) {
    parts.push('A late night will likely compress sleep. Energy and recovery tomorrow are the main levers to watch.');
  } else if (noteThemes.includes('travel')) {
    parts.push('Travel shifts sleep and routine. Energy and hydration over the next day or two will reflect how you recover.');
  } else if (noteThemes.includes('deadline')) {
    parts.push('A big day adds cognitive and often physical load. Sleep and one clear recovery lever will shape how tomorrow feels.');
  } else if (trend === 'down' && frictionPoints.length > 0) {
    parts.push(`Your signals point to mild strain around ${frictionPoints.slice(0, 2).join(' and ')}.`);
  } else if (trend === 'up') {
    parts.push('Your pulse is up today. Small steps are adding up.');
  } else {
    parts.push('Your signals point to mild strain around sleep and energy.');
  }

  if (appetiteMid && (sleepQualityLow || noteThemes.includes('hunger') || noteThemes.includes('no_appetite'))) {
    parts.push('Appetite and digestion sitting in the middle suggests compensation rather than a problem.');
  } else if (sleepQualityLow && (stressMid || stressHigh)) {
    parts.push('Lower sleep quality and stress often show up as flat energy or appetite.');
  } else if (sleepQualityLow) {
    parts.push('Lower sleep quality often flattens energy and mood the next day.');
  } else if (stressHigh) {
    parts.push('Stress may be adding background load on energy and digestion.');
  }

  return parts.join(' ');
}

// What's shaping your Pulse score: bullet rhythm. Pattern-specific closing when possible (no generic filler).
function buildNarrativeWhy(entry, trend, frictionPoints, noteThemes) {
  const e = entry || {};
  const lines = [];
  const sleepQualityLow = e.sleepQuality != null && e.sleepQuality < 3;
  const stressHigh = e.stress != null && e.stress >= 4;
  const stressMid = e.stress != null && e.stress >= 3;

  const hasStressSleep = noteThemes.includes('stress_sleep') || (noteThemes.includes('stress') && noteThemes.includes('sleep') && (e.stress >= 3 || e.sleepQuality != null));
  if (hasStressSleep) {
    lines.push('Stress and sleep quality are tightly linked in your signals.');
    lines.push('Lower sleep then reduces resilience the next day.');
    lines.push('This pattern tends to repeat when evening stress stays high.');
  } else {
    if (noteThemes.includes('exercise') && noteThemes.includes('party_late')) {
      lines.push('Exercise increases recovery needs.');
      lines.push('Shortened sleep after activity often shows up as lower energy and appetite the next day.');
      lines.push('Stress is secondary here.');
    } else if (noteThemes.includes('exercise')) {
      lines.push('Physical load from training drives recovery needs.');
      lines.push('Food, hydration, and rest will show up in energy and mood.');
    } else if (noteThemes.includes('party_late') || noteThemes.includes('travel')) {
      lines.push('Sleep and timing are the main levers.');
      lines.push('Hydration and when you wind down often affect how tomorrow feels.');
    } else if (noteThemes.includes('deadline')) {
      lines.push('Cognitive and physical load from the day drive recovery needs.');
      lines.push('Sleep and one clear break or stop time will shape tomorrow.');
    }
    const hasSituational = noteThemes.includes('exercise') || noteThemes.includes('party_late') || noteThemes.includes('travel') || noteThemes.includes('deadline');
    if (sleepQualityLow || frictionPoints.includes('sleep')) {
      if (!lines.length) lines.push('Sleep quality is the main driver today.');
      if (!hasSituational) lines.push('Lower sleep quality often flattens energy and appetite.');
    }
    if (stressHigh || stressMid || frictionPoints.includes('stress')) {
      lines.push('Stress may be adding background load.');
    }
    if ((e.energy != null && e.energy <= 2) || (e.mood != null && e.mood <= 2)) {
      lines.push('Mood and energy are moving together.');
    }
    if (lines.length > 0 && !hasStressSleep && !hasSituational) {
      lines.push('This pattern tends to be cumulative rather than a single event.');
    } else if (lines.length === 0) {
      lines.push('Your signals are in a moderate range. One concrete lever (e.g. sleep timing or one break) is enough to notice a difference.');
    }
  }

  return lines.map((line) => '• ' + line).join('\n');
}

// One thing to observe or try: situational when notes mention events/plans; otherwise one experiment. No new load in recovery contexts.
function buildNarrativeOneThing(entry, frictionPoints, noteThemes) {
  const e = entry || {};
  const sleepQualityLow = e.sleepQuality != null && e.sleepQuality < 3;
  const stressHigh = e.stress != null && e.stress >= 4;

  // Situation: exercise + party/late night (recovery before social, not "go for a walk")
  if (noteThemes.includes('exercise') && noteThemes.includes('party_late')) {
    return 'Prioritize recovery before the party: eat a proper meal after the gym (not just snacks), hydrate earlier in the evening, and if sleep is shorter tonight, aim for deeper rest rather than duration.';
  }
  if (noteThemes.includes('exercise') && !noteThemes.includes('party_late')) {
    return 'Notice whether a proper meal and hydration after training change how you feel later. Recovery inputs matter as much as the workout.';
  }
  if (noteThemes.includes('party_late')) {
    return 'Hydrate earlier in the evening and notice how it affects tomorrow. If sleep is shorter, one small lever is timing: wind down a bit before bed when you can.';
  }
  if (noteThemes.includes('travel')) {
    return 'Focus on one lever: hydration and light movement when you can (e.g. short walk after landing). Notice how sleep and energy respond over the next day or two.';
  }
  if (noteThemes.includes('deadline')) {
    return 'Notice whether one short break or a clear stop time today changes how sleep and tomorrow feel. Recovery after a big day matters.';
  }

  if (noteThemes.includes('stress_sleep') || (noteThemes.includes('stress') && noteThemes.includes('sleep') && (stressHigh || sleepQualityLow))) {
    return 'Reduce mental load before bed rather than trying to extend sleep. Timing of wind-down may matter more than duration.';
  }

  if (noteThemes.includes('no_appetite')) {
    return 'Eat a bit earlier or in smaller, even steps today; notice whether appetite shows up more consistently over the next day or two. If stress is high, one light meal when you notice a small window of hunger is enough.';
  }
  if (noteThemes.includes('hunger')) {
    return 'Try a balanced first meal a bit earlier tomorrow; notice how energy and hunger cues look over the next few days.';
  }
  if (noteThemes.includes('digestion')) {
    return 'Smaller meals and more time between eating and lying down. Notice if digestion and energy feel different over the next few days.';
  }
  if (noteThemes.includes('stress') && !noteThemes.includes('sleep')) {
    return 'Add a short wind-down buffer (e.g. 15–20 min) before bed; notice whether sleep and next-day stress feel different over the next few nights.';
  }
  if (sleepQualityLow && stressHigh && !noteThemes.includes('stress_sleep')) {
    return 'Reduce mental load in the 30 minutes before bed rather than trying to extend sleep; notice whether sleep onset improves over the next few nights.';
  }
  if (sleepQualityLow) {
    return 'Try similar bed and wake times for the next few nights; notice how energy and appetite respond.';
  }
  if (frictionPoints.includes('hydration')) {
    return 'Sip water earlier in the day (e.g. before midday); notice whether afternoon energy or how you feel after meals shifts.';
  }
  if (frictionPoints.includes('energy')) {
    return 'Try one short break or a few minutes of light movement today; notice whether energy or focus in your next check-in improves.';
  }
  if (frictionPoints.includes('sleep')) {
    return 'Try similar bed and wake times for the next few nights; notice how energy and appetite respond.';
  }
  if (frictionPoints.includes('hydration')) {
    return 'Sip water a bit earlier in the day (e.g. before midday); notice whether afternoon energy or focus shifts.';
  }

  return 'Pick one lever: similar sleep times, earlier first sip of water, or one short break. Try it for a few days and notice how your next check-in feels.';
}

// Optional second lever (advanced tier, wallet users). Must add new information; do not repeat basic.
function buildNarrativeAdvanced(entry, frictionPoints, noteThemes, basicOneThing) {
  const e = entry || {};
  const sleepQualityLow = e.sleepQuality != null && e.sleepQuality < 3;
  const stressHigh = e.stress != null && e.stress >= 4;

  // Stress–sleep: basic = stress before bed; advanced = sleep timing consistency to support it
  if (noteThemes.includes('stress_sleep') || (noteThemes.includes('stress') && noteThemes.includes('sleep') && (stressHigh || sleepQualityLow))) {
    return 'Over the next few nights, keep bed and wake times within a narrow window; consistency supports the wind-down effect.';
  }
  // Multiple friction: if basic was sleep, add hydration or break as second lever
  if (frictionPoints.includes('sleep') && frictionPoints.includes('hydration') && basicOneThing && basicOneThing.toLowerCase().includes('sleep')) {
    return 'Sip water earlier in the day (e.g. before midday); it often supports energy and focus so evening wind-down is easier.';
  }
  if (frictionPoints.includes('stress') && frictionPoints.includes('energy') && basicOneThing && basicOneThing.toLowerCase().includes('stress')) {
    return 'One short break or a clear stop time today can reduce carryover load; notice how it shows up in tomorrow\'s check-in.';
  }
  // Exercise + party: basic = recovery before party; advanced = what to notice next 2–3 days
  if (noteThemes.includes('exercise') && noteThemes.includes('party_late')) {
    return 'Over the next 2–3 days, notice how energy and appetite respond; that tells you whether recovery levers are enough.';
  }
  if (noteThemes.includes('sleep') && sleepQualityLow && basicOneThing && !basicOneThing.toLowerCase().includes('similar')) {
    return 'Try similar bed and wake times for the next few nights; notice how energy and appetite respond.';
  }
  if (frictionPoints.includes('hydration') && basicOneThing && !basicOneThing.toLowerCase().includes('water') && !basicOneThing.toLowerCase().includes('sip')) {
    return 'Sip water earlier in the day (e.g. before midday); notice whether afternoon energy or focus shifts.';
  }

  return null;
}

// Main: narrative output (pattern, why, basic + optional advanced). improvements[0]=basic, [1]=advanced (wallet only).
function computeInsights(body) {
  const entry = body.entry || {};
  const trend = body.trend === 'up' || body.trend === 'down' ? body.trend : 'stable';
  const frictionPoints = Array.isArray(body.frictionPoints) ? body.frictionPoints : [];

  const noteThemes = getNoteThemes(entry.notes);
  const pattern = buildNarrativePattern(entry, trend, frictionPoints, noteThemes);
  const why = buildNarrativeWhy(entry, trend, frictionPoints, noteThemes);
  const basic = buildNarrativeOneThing(entry, frictionPoints, noteThemes);
  const advanced = basic ? buildNarrativeAdvanced(entry, frictionPoints, noteThemes, basic) : null;

  const improvements = [];
  if (basic) improvements.push(basic);
  if (advanced) improvements.push(advanced);

  return {
    insight: pattern,
    explanation: why,
    improvements,
    factors: [], // Narrative replaces table; no duplicate "what's affecting" list
  };
}

module.exports = { computeInsights, getNoteThemes, buildFactors };
