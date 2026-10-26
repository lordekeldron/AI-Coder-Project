import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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

export type GithubConnectionRow = {
  id: string;
  token: string;
  username: string;
  created_at: string;
};

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// In-memory fallback if localStorage is disabled or throws
const memoryStorage = new Map<string, string>();

function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // fallback
  }
  return memoryStorage.get(key) ?? null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {
    // fallback
  }
  memoryStorage.set(key, value);
}

function getTableData<T>(table: string): T[] {
  const raw = getStorageItem(`ai_studio_db_${table}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function setTableData<T>(table: string, data: T[]): void {
  setStorageItem(`ai_studio_db_${table}`, JSON.stringify(data));
}

type QueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

class MockQueryBuilder<T = Record<string, unknown>> {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private insertData: unknown = null;
  private updateData: Record<string, unknown> | null = null;
  private filters: Array<(row: Record<string, unknown>) => boolean> = [];
  private orderConfig: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private isSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns?: string): this {
    void _columns;
    return this;
  }

  insert(values: unknown): this {
    this.action = 'insert';
    this.insertData = values;
    return this;
  }

  update(values: Record<string, unknown>): this {
    this.action = 'update';
    this.updateData = values;
    return this;
  }

  delete(): this {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}): this {
    this.orderConfig = { column, ascending };
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  maybeSingle(): this {
    this.isSingle = true;
    return this;
  }

  single(): this {
    this.isSingle = true;
    return this;
  }

  async execute(): Promise<QueryResult<T>> {
    const rows = getTableData<Record<string, unknown>>(this.table);

    if (this.action === 'insert') {
      const now = new Date().toISOString();
      const itemsToInsert = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
      const createdItems = itemsToInsert.map((item) => ({
        id: generateId(),
        created_at: now,
        updated_at: now,
        ...item,
      }));

      rows.push(...createdItems);
      setTableData(this.table, rows);

      const result = this.isSingle ? createdItems[0] : createdItems;
      return { data: result as unknown as T, error: null };
    }

    if (this.action === 'update') {
      const updatedRows: Record<string, unknown>[] = [];
      const newRows = rows.map((row) => {
        const matches = this.filters.every((fn) => fn(row));
        if (matches) {
          const updated = { ...row, ...this.updateData };
          updatedRows.push(updated);
          return updated;
        }
        return row;
      });

      setTableData(this.table, newRows);
      const result = this.isSingle ? updatedRows[0] || null : updatedRows;
      return { data: result as unknown as T, error: null };
    }

    if (this.action === 'delete') {
      const remainingRows = rows.filter((row) => !this.filters.every((fn) => fn(row)));
      setTableData(this.table, remainingRows);

      // If deleting a conversation, also clean up its messages
      if (this.table === 'conversations') {
        const deletedIds = rows
          .filter((row) => this.filters.every((fn) => fn(row)))
          .map((r) => r.id);
        if (deletedIds.length > 0) {
          const msgRows = getTableData<Record<string, unknown>>('messages');
          const remainingMsgs = msgRows.filter((m) => !deletedIds.includes(m.conversation_id));
          setTableData('messages', remainingMsgs);
        }
      }

      return { data: null, error: null };
    }

    // Default: 'select'
    let filtered = rows.filter((row) => this.filters.every((fn) => fn(row)));

    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig;
      filtered.sort((a, b) => {
        const va = a[column];
        const vb = b[column];
        if (va === vb) return 0;
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        const comp = String(va).localeCompare(String(vb));
        return ascending ? comp : -comp;
      });
    }

    if (typeof this.limitCount === 'number') {
      filtered = filtered.slice(0, this.limitCount);
    }

    if (this.isSingle) {
      return { data: (filtered[0] ?? null) as unknown as T, error: null };
    }

    return { data: filtered as unknown as T, error: null };
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

function createMockSupabaseClient(): SupabaseClient {
  return {
    from: (table: string) => new MockQueryBuilder(table),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  } as unknown as SupabaseClient;
}

const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let clientInstance: SupabaseClient;

// Only instantiate real Supabase client if valid URL and key are provided
if (envUrl && envUrl.startsWith('http') && envKey) {
  try {
    clientInstance = createClient(envUrl, envKey, {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.warn('[AI Studio] Could not initialize Supabase, using mock storage:', err);
    clientInstance = createMockSupabaseClient();
  }
} else {
  // Graceful in-memory / localStorage fallback when Supabase credentials are not configured
  clientInstance = createMockSupabaseClient();
}

export const supabase = clientInstance;
