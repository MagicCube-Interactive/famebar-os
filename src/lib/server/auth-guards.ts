import { createAdminClient, createServiceClient } from '@/lib/supabase/server';

export class AccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AccessError';
    this.status = status;
  }
}

export interface RequestActor {
  user: {
    id: string;
    email?: string;
  };
  role: string;
  supabase: ReturnType<typeof createAdminClient>;
}

export async function getRequestActor(): Promise<RequestActor> {
  const serviceClient = await createServiceClient();
  const {
    data: { user },
    error: authError,
  } = await serviceClient.auth.getUser();

  if (authError || !user) {
    throw new AccessError('Not authenticated', 401);
  }

  const supabase = createAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new AccessError('Profile not found', 404);
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    role: profile.role || 'buyer',
    supabase,
  };
}

export async function requireAdminActor(): Promise<RequestActor> {
  const actor = await getRequestActor();

  if (actor.role !== 'admin') {
    throw new AccessError('Admin access required', 403);
  }

  return actor;
}
