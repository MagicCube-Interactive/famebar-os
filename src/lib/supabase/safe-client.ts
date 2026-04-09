/**
 * Safe Supabase client that routes queries through /api/data
 * to bypass RLS infinite recursion on the profiles table.
 *
 * Provides a subset of the Supabase client API (from/select/eq/etc)
 * so ambassador pages can use it as a drop-in replacement.
 */

type FilterOp = 'eq' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt' | 'in' | 'is';

interface QueryFilter {
  column: string;
  op: FilterOp;
  value: any;
}

interface QueryOrder {
  column: string;
  ascending: boolean;
}

class SafeQueryBuilder<T = any> {
  private _table: string;
  private _select: string = '*';
  private _filters: QueryFilter[] = [];
  private _order: QueryOrder | null = null;
  private _limit: number | null = null;
  private _single: boolean = false;

  constructor(table: string) {
    this._table = table;
  }

  select(columns: string = '*') {
    this._select = columns;
    return this;
  }

  eq(column: string, value: any) {
    this._filters.push({ column, op: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this._filters.push({ column, op: 'neq', value });
    return this;
  }

  gte(column: string, value: any) {
    this._filters.push({ column, op: 'gte', value });
    return this;
  }

  lte(column: string, value: any) {
    this._filters.push({ column, op: 'lte', value });
    return this;
  }

  gt(column: string, value: any) {
    this._filters.push({ column, op: 'gt', value });
    return this;
  }

  lt(column: string, value: any) {
    this._filters.push({ column, op: 'lt', value });
    return this;
  }

  in(column: string, values: any[]) {
    this._filters.push({ column, op: 'in', value: values });
    return this;
  }

  is(column: string, value: any) {
    this._filters.push({ column, op: 'is', value });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this._order = { column, ascending: opts?.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this._limit = count;
    return this;
  }

  single() {
    this._single = true;
    this._limit = 1;
    return this.then((result: any) => {
      if (result.data && Array.isArray(result.data)) {
        return {
          data: result.data[0] || null,
          error: result.data.length === 0 ? { message: 'No rows found', code: 'PGRST116' } : null,
        };
      }
      return result;
    });
  }

  async then(resolve: (value: { data: T[] | T | null; error: any }) => any, reject?: (reason: any) => any): Promise<any> {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          table: this._table,
          select: this._select,
          filters: this._filters,
          order: this._order,
          limit: this._limit,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        const result = { data: null, error: { message: err.error || `HTTP ${res.status}` } };
        return resolve(result);
      }

      const { data } = await res.json();
      const result = { data, error: null };
      return resolve(result);
    } catch (err: any) {
      const result = { data: null, error: { message: err.message || 'Network error' } };
      if (reject) return reject(result);
      return resolve(result);
    }
  }
}

class SafeClient {
  from<T = any>(table: string): SafeQueryBuilder<T> {
    return new SafeQueryBuilder<T>(table);
  }
}

/**
 * Creates a safe Supabase client that bypasses RLS by routing through /api/data.
 * Use this in client components instead of createClient() from @/lib/supabase/client.
 */
export function createSafeClient(): SafeClient {
  return new SafeClient();
}
