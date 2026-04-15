import { PLATFORM_CONFIG, type PackMode, type PackStatus } from '@/types';

export const DIRECT_UNIT_COMMISSION = PLATFORM_CONFIG.RETAIL_PRICE * 0.25;
export const REMITTANCE_UNIT_AMOUNT =
  PLATFORM_CONFIG.RETAIL_PRICE - DIRECT_UNIT_COMMISSION;

export function getPackFinancials(quantity: number = PLATFORM_CONFIG.PACK_QUANTITY) {
  return {
    quantity,
    retailTotal: quantity * PLATFORM_CONFIG.RETAIL_PRICE,
    wholesaleTotal: quantity * PLATFORM_CONFIG.WHOLESALE_UNIT_PRICE,
    ambassadorCash: quantity * DIRECT_UNIT_COMMISSION,
    remittanceDue: quantity * REMITTANCE_UNIT_AMOUNT,
  };
}

export async function generateUniqueReferralCode(supabase: any): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let attempt = 0; attempt < 12; attempt++) {
    let code = 'FB-';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    const { data: existing } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('code', code)
      .maybeSingle();

    if (!existing) {
      return code;
    }
  }

  throw new Error('Unable to generate a unique referral code');
}

export async function buildTeamTree(supabase: any, ambassadorId: string) {
  const chain: any[] = [];
  const visited = new Set<string>();
  let currentId: string | null = ambassadorId;

  while (currentId && !visited.has(currentId) && chain.length < 7) {
    visited.add(currentId);

    const ambassadorResult = await supabase
      .from('ambassador_profiles')
      .select('*')
      .eq('id', currentId)
      .single();
    const ambassador = ambassadorResult.data as any;
    const error = ambassadorResult.error;

    if (error || !ambassador) {
      break;
    }

    chain.push(ambassador);
    currentId = ambassador.sponsor_id || null;
  }

  const chainIds = chain.map((ambassador) => ambassador.id);

  return chain.reduce<Record<string, any>>((tree, ambassador, index) => {
    tree[ambassador.id] = {
      ambassadorId: ambassador.id,
      sponsorId: ambassador.sponsor_id,
      level: index,
      directRecruits: index > 0 ? [chain[index - 1].id] : [],
      path: chainIds.slice(index),
      personalSalesThisMonth: Number(ambassador.personal_sales_this_month) || 0,
      teamSalesThisMonth: Number(ambassador.total_sales) || 0,
      isActive: ambassador.is_active,
      updatedAt: new Date().toISOString(),
    };
    return tree;
  }, {});
}

export async function promoteBuyerToAmbassador({
  supabase,
  userId,
}: {
  supabase: any;
  userId: string;
}) {
  const now = new Date().toISOString();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, age_verified')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile not found');
  }

  const { data: existingAmbassador } = await supabase
    .from('ambassador_profiles')
    .select('id, referral_code, sponsor_id')
    .eq('id', userId)
    .maybeSingle();

  if (existingAmbassador) {
    return {
      ambassadorId: existingAmbassador.id,
      referralCode: existingAmbassador.referral_code,
      sponsorId: existingAmbassador.sponsor_id,
      created: false,
    };
  }

  if (!profile.age_verified) {
    throw new Error('Age verification is required before ambassador approval');
  }

  const { data: buyerProfile } = await supabase
    .from('buyer_profiles')
    .select('referred_by')
    .eq('id', userId)
    .maybeSingle();

  const referralCode = await generateUniqueReferralCode(supabase);
  const sponsorId = buyerProfile?.referred_by || null;

  const { error: ambassadorError } = await supabase
    .from('ambassador_profiles')
    .insert({
      id: userId,
      sponsor_id: sponsorId,
      referral_code: referralCode,
      tier: 0,
      rank: 'new',
      is_founder: false,
      is_active: false,
      personal_sales_this_month: 0,
      total_sales: 0,
      total_recruits: 0,
      kyc_verified: false,
      created_at: now,
      updated_at: now,
    });

  if (ambassadorError) {
    throw new Error(ambassadorError.message);
  }

  const { error: codeError } = await supabase
    .from('referral_codes')
    .insert({
      code: referralCode,
      ambassador_id: userId,
      type: 'primary',
      is_active: true,
      created_at: now,
    });

  if (codeError) {
    throw new Error(codeError.message);
  }

  await supabase
    .from('profiles')
    .update({
      role: 'ambassador',
      updated_at: now,
    })
    .eq('id', userId);

  await supabase
    .from('buyer_profiles')
    .update({
      promoted_at: now,
    })
    .eq('id', userId);

  return {
    ambassadorId: userId,
    referralCode,
    sponsorId,
    created: true,
  };
}

export async function createPackRecord({
  supabase,
  ambassadorId,
  approvedBy,
  mode,
  notes,
  referralCodeIssued,
  status,
  purchaseOrderId,
}: {
  supabase: any;
  ambassadorId: string;
  approvedBy: string;
  mode: PackMode;
  notes?: string;
  referralCodeIssued?: string;
  status?: PackStatus;
  purchaseOrderId?: string;
}) {
  const now = new Date().toISOString();
  const quantity = PLATFORM_CONFIG.PACK_QUANTITY;

  const payload = {
    ambassador_id: ambassadorId,
    mode,
    quantity,
    status: status || (mode === 'wholesale' ? 'paid' : 'approved'),
    referral_code_issued: referralCodeIssued || null,
    approved_by: approvedBy,
    approved_at: now,
    outstanding_units: quantity,
    payment_received_at: mode === 'wholesale' ? now : null,
    purchase_order_id: purchaseOrderId || null,
    notes: notes || null,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('ambassador_packs')
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create pack');
  }

  return data;
}

export async function syncPackBalances(supabase: any, packId: string) {
  const { data: pack, error } = await supabase
    .from('ambassador_packs')
    .select('*')
    .eq('id', packId)
    .single();

  if (error || !pack) {
    throw new Error('Pack not found');
  }

  const outstandingUnits = Math.max((pack.quantity || 0) - (pack.units_sold || 0), 0);
  const remittanceBalance = Math.max(
    Number(pack.remittance_due || 0) - Number(pack.remitted_amount || 0),
    0
  );

  let status: PackStatus = pack.status;
  if (pack.mode === 'wholesale') {
    status = 'paid';
  } else if (outstandingUnits === 0) {
    status = remittanceBalance <= 0 ? 'settled' : 'sold_out';
  } else if ((pack.units_sold || 0) > 0) {
    status = 'selling';
  } else {
    status = 'approved';
  }

  const { data: updated, error: updateError } = await supabase
    .from('ambassador_packs')
    .update({
      outstanding_units: outstandingUnits,
      remittance_balance: remittanceBalance,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', packId)
    .select('*')
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message || 'Failed to sync pack balances');
  }

  return updated;
}
