import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type CodeBlock = {
  filename: string;
  language: string;
  content: string;
};

export type AgentStep = {
  phase: 'understand' | 'plan' | 'implement' | 'review';
  title: string;
  detail: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'agent';
  content: string;
  steps: AgentStep[] | null;
  code: CodeBlock[] | null;
  created_at: string;
};
