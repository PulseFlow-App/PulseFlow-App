/**
 * Universal RAG knowledge entry schema.
 * All blocks (Nutrition, Sleep, Stress, Energy, Mood, Hydration, Body Signals, Fridge) use this shape.
 * Canonical: docs in apps/ai-engine/knowledge/README.md
 */

export type KnowledgeBlock =
  | 'nutrition'
  | 'sleep'
  | 'stress'
  | 'energy'
  | 'mood'
  | 'hydration'
  | 'body_signals'
  | 'fridge';

export type EvidenceLevel = 'low' | 'moderate' | 'high';

export interface KnowledgeReference {
  title: string;
  source: string;
  year?: number;
}

export interface LanguageRules {
  allowed: string[];
  avoid: string[];
}

export interface KnowledgeEntry {
  id: string;
  block: KnowledgeBlock;
  topic: string;
  summary: string;
  mechanisms?: string[];
  observed_patterns?: string[];
  implication_logic?: string;
  intervention_leverage?: string;
  language_rules?: LanguageRules;
  evidence_level?: EvidenceLevel;
  references?: KnowledgeReference[];
  /** For retrieval: match pattern_type, drivers, or signal mismatches from rule engine. */
  pattern_tags?: string[];
}

export type KnowledgeEntryList = KnowledgeEntry[];
