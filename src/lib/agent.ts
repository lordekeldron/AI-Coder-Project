import type { AgentStep, CodeBlock } from './supabase';

export type AgentResponse = {
  steps: AgentStep[];
  content: string;
  code: CodeBlock[];
};

const PHASE_TEMPLATES: Record<AgentStep['phase'], (task: string) => { title: string; detail: string }> = {
  understand: (task) => ({
    title: 'Parsing the request',
    detail: `Breaking down "${truncate(task, 80)}". Identifying the user-facing behavior, edge cases, and what a complete solution must produce so nothing is left half-built.`,
  }),
  plan: (task) => ({
    title: 'Designing the approach',
    detail: pickPlan(task),
  }),
  implement: (task) => ({
    title: 'Writing the code',
    detail: `Producing clean, typed, production-ready code for "${truncate(task, 60)}". Following existing conventions, reusing utilities before adding new ones, and keeping each module cohesive.`,
  }),
  review: (task) => ({
    title: 'Verifying the result',
    detail: `Re-reading the implementation against the original goal. Checking error handling at boundaries, type safety, and that every step the user would need is actually wired up. No dead ends.`,
  }),
};

function pickPlan(task: string): string {
  const t = task.toLowerCase();
  if (t.includes('api') || t.includes('fetch') || t.includes('endpoint')) {
    return 'Adding a typed client wrapper with loading + error states, surfacing failures visibly instead of letting undefined reach the UI. Validating the response shape before binding it.';
  }
  if (t.includes('form') || t.includes('input') || t.includes('validation')) {
    return 'Building the full flow: field state, validation on submit, accessible error messages, and a clear success state. No form that ends at a dead end.';
  }
  if (t.includes('page') || t.includes('view') || t.includes('screen') || t.includes('component')) {
    return 'Sketching the layout, establishing visual hierarchy and spacing, then filling in data binding and interaction states (hover, loading, empty, error).';
  }
  if (t.includes('bug') || t.includes('fix') || t.includes('error')) {
    return 'Reproducing the failure, reading the actual error, then fixing the root cause rather than working around the symptom. Confirming the fix doesn\'t regress adjacent behavior.';
  }
  return 'Laying out the modules by cohesion, defining shared types up front so references resolve immediately, then implementing each piece complete and correct on the first pass.';
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
}

const CODE_SAMPLES: CodeBlock[] = [
  {
    filename: 'feature.ts',
    language: 'typescript',
    content: `import { useState } from 'react';

type Status = 'idle' | 'loading' | 'ready' | 'error';

export function useFeature(input: string) {
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!input.trim()) return;
    setStatus('loading');
    setError(null);
    try {
      const result = await resolve(input);
      setData(result);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setStatus('error');
    }
  }

  return { status, data, error, run };
}

async function resolve(input: string): Promise<string> {
  // domain logic lives here
  return input.toUpperCase();
}`,
  },
];

const ANSWER_TEMPLATES = [
  (task: string) =>
    `Here's a complete implementation for "${truncate(task, 70)}". I built the full path end-to-end — typed state, explicit loading and error handling at the boundary, and no dead ends. The code reuses existing patterns where they fit and adds nothing speculative. Run it and you'll see loading → ready (or a visible error if the input is bad), never a silent undefined on screen.`,
  (task: string) =>
    `Done. I read the surrounding code first, matched its conventions, and shipped "${truncate(task, 70)}" as one cohesive flow. Every step a user would need is wired up; error paths surface visibly instead of failing silently. No half-finished stubs, no abstractions added for hypothetical future needs.`,
  (task: string) =>
    `Implemented "${truncate(task, 70)}" with attention to the boundaries — input is validated, async results are checked before use, and failures show a real error state rather than letting malformed data reach the UI. The module is cohesive and exports only what callers need.`,
];

export async function runAgent(task: string): Promise<AgentResponse> {
  await delay(450);

  const phases: AgentStep['phase'][] = ['understand', 'plan', 'implement', 'review'];
  const steps: AgentStep[] = phases.map((phase) => ({
    phase,
    ...PHASE_TEMPLATES[phase](task),
  }));

  const answer = ANSWER_TEMPLATES[Math.floor(Math.random() * ANSWER_TEMPLATES.length)](task);

  const includeCode = /api|fetch|form|input|hook|component|page|view|build|implement|create|add|feature|function/i.test(task);
  const code = includeCode ? CODE_SAMPLES : [];

  return { steps, content: answer, code };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
