import { NextRequest, NextResponse } from 'next/server';
import { AccessError, getRequestActor } from '@/lib/server/auth-guards';

interface RawTreeMember {
  id: string;
  sponsor_id: string | null;
  tier: number;
  total_recruits: number;
  personal_sales_this_month: number;
  is_active: boolean;
  created_at: string;
  profiles?: {
    full_name?: string | null;
    email?: string | null;
  };
}

function getStatus(member: RawTreeMember): 'active' | 'stalled' | 'new' | 'at-risk' {
  const daysSinceJoin = Math.floor(
    (Date.now() - new Date(member.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceJoin <= 30) {
    return 'new';
  }

  if (!member.is_active && Number(member.personal_sales_this_month || 0) === 0) {
    return 'at-risk';
  }

  if (!member.is_active) {
    return 'stalled';
  }

  return 'active';
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getRequestActor();
    if (actor.role !== 'ambassador' && actor.role !== 'admin') {
      throw new AccessError('Ambassador access required', 403);
    }

    const requestedRootId = request.nextUrl.searchParams.get('ambassadorId');
    const rootId =
      actor.role === 'admin' && requestedRootId ? requestedRootId : actor.user.id;

    const { data: rootMember, error: rootError } = await actor.supabase
      .from('ambassador_profiles')
      .select(
        'id, sponsor_id, tier, total_recruits, personal_sales_this_month, is_active, created_at, profiles!ambassador_profiles_id_fkey(full_name, email)'
      )
      .eq('id', rootId)
      .single();

    if (rootError || !rootMember) {
      return NextResponse.json(
        { success: false, error: 'Ambassador tree root not found' },
        { status: 404 }
      );
    }

    const members = new Map<string, any>();
    members.set(rootId, rootMember);

    let currentLevelIds = [rootId];
    while (currentLevelIds.length > 0) {
      const { data: children } = await actor.supabase
        .from('ambassador_profiles')
        .select(
          'id, sponsor_id, tier, total_recruits, personal_sales_this_month, is_active, created_at, profiles!ambassador_profiles_id_fkey(full_name, email)'
        )
        .in('sponsor_id', currentLevelIds)
        .order('created_at', { ascending: false });

      const nextIds: string[] = [];
      (children || []).forEach((child: any) => {
        members.set(child.id, child);
        nextIds.push(child.id);
      });
      currentLevelIds = nextIds;
    }

    const childrenBySponsor = new Map<string, RawTreeMember[]>();
    Array.from(members.values()).forEach((member: RawTreeMember) => {
      if (!member.sponsor_id) {
        return;
      }
      const list = childrenBySponsor.get(member.sponsor_id) || [];
      list.push(member);
      childrenBySponsor.set(member.sponsor_id, list);
    });

    const buildNode = (member: RawTreeMember): any => ({
      id: member.id,
      name: member.profiles?.full_name || member.profiles?.email || member.id.slice(0, 8),
      email: member.profiles?.email || 'No email on file',
      salesThisMonth: Number(member.personal_sales_this_month || 0),
      status: getStatus(member),
      recruits: Number(member.total_recruits || 0),
      tier: Number(member.tier || 0),
      children: (childrenBySponsor.get(member.id) || []).map(buildNode),
    });

    const tree = buildNode(rootMember as RawTreeMember);

    return NextResponse.json({
      success: true,
      tree,
      totalMembers: members.size,
    });
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
