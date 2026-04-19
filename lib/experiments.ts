import { emitClientEvent } from '../services/clientObservability';

export type ExperimentVariant = 'control' | 'variant';

type ExperimentDefinition = {
  key: string;
  traffic: number;
};

const SUBJECT_STORAGE_KEY = 'moviemonk_experiment_subject_v1';
const EXPOSURE_STORAGE_KEY = 'moviemonk_experiment_exposure_v1';

const EXPERIMENTS: Record<string, ExperimentDefinition> = {
  search_feedback_nudge: {
    key: 'search_feedback_nudge',
    traffic: 0.5
  }
};

function getStorage(): Storage | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

function randomId(): string {
  return `exp_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function hashToUnit(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const normalized = (hash >>> 0) / 4294967295;
  return Number.isFinite(normalized) ? normalized : 0;
}

function getSubjectId(): string {
  const storage = getStorage();
  if (!storage) return 'anon_subject';

  const existing = storage.getItem(SUBJECT_STORAGE_KEY);
  if (existing && existing.trim()) return existing;

  const next = randomId();
  storage.setItem(SUBJECT_STORAGE_KEY, next);
  return next;
}

export function getExperimentVariant(experimentKey: keyof typeof EXPERIMENTS): ExperimentVariant {
  const experiment = EXPERIMENTS[experimentKey];
  if (!experiment) return 'control';

  const subjectId = getSubjectId();
  const bucket = hashToUnit(`${experiment.key}:${subjectId}`);
  return bucket < experiment.traffic ? 'variant' : 'control';
}

function hasExposure(experimentKey: keyof typeof EXPERIMENTS): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    const raw = storage.getItem(EXPOSURE_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Record<string, true>;
    return Boolean(parsed[experimentKey]);
  } catch {
    return false;
  }
}

function markExposure(experimentKey: keyof typeof EXPERIMENTS): void {
  const storage = getStorage();
  if (!storage) return;
  let parsed: Record<string, true> = {};
  try {
    const raw = storage.getItem(EXPOSURE_STORAGE_KEY);
    if (raw) parsed = JSON.parse(raw) as Record<string, true>;
  } catch {
    parsed = {};
  }
  parsed[experimentKey] = true;
  storage.setItem(EXPOSURE_STORAGE_KEY, JSON.stringify(parsed));
}

export function recordExperimentExposure(experimentKey: keyof typeof EXPERIMENTS, variant: ExperimentVariant): void {
  if (hasExposure(experimentKey)) return;
  markExposure(experimentKey);
  emitClientEvent({
    event: 'experiment_exposure',
    data: {
      experiment: experimentKey,
      variant
    }
  });
}

export function recordExperimentConversion(
  experimentKey: keyof typeof EXPERIMENTS,
  variant: ExperimentVariant,
  conversionEvent: string,
  data: Record<string, unknown> = {}
): void {
  emitClientEvent({
    event: 'experiment_conversion',
    data: {
      experiment: experimentKey,
      variant,
      conversion_event: conversionEvent,
      ...data
    }
  });
}
