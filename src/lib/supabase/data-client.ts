/**
 * Data client that fetches through /api/data to bypass RLS.
 *
 * The profiles table has an RLS policy with infinite recursion which also
 * breaks commission_events and other tables whose policies reference profiles.
 * This client routes all queries through a server-side endpoint that uses
 * the service role key.
 */

interface QueryFilter {
  column: string;
  op: 'eq' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt' | 'in' | 'is';
  value: any;
}

interface QueryOptions {
  table: string;
  select?: string;
  filters?: QueryFilter[];
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

export async function queryData<T = any>(options: QueryOptions): Promise<{
  data: T[] | null;
  error: string | null;
}> {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      return { data: null, error: err.error || `HTTP ${res.status}` };
    }

    const { data } = await res.json();
    return { data: data as T[], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Network error' };
  }
}
