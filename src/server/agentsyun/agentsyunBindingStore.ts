import type { AgentsyunAccountBindingRecord } from './agentsyunTypes';

const memoryBindingsByHellomeUserId = new Map<string, AgentsyunAccountBindingRecord>();
const memoryBindingsByAgentsyunUserId = new Map<string, AgentsyunAccountBindingRecord>();

export async function findBindingByHellomeUserId(
  hellomeUserId: string,
): Promise<AgentsyunAccountBindingRecord | null> {
  return memoryBindingsByHellomeUserId.get(hellomeUserId) ?? null;
}

export async function createBinding(input: {
  hellomeUserId: string;
  agentsyunUserId: string;
  phone?: string;
}): Promise<AgentsyunAccountBindingRecord> {
  if (
    memoryBindingsByHellomeUserId.has(input.hellomeUserId) ||
    memoryBindingsByAgentsyunUserId.has(input.agentsyunUserId)
  ) {
    throw new Error('AGENTSYUN_ACCOUNT_BIND_FAILED');
  }

  const now = new Date();
  const record: AgentsyunAccountBindingRecord = {
    id: `agentsyun_binding_${input.hellomeUserId}`,
    hellomeUserId: input.hellomeUserId,
    agentsyunUserId: input.agentsyunUserId,
    phone: input.phone,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  memoryBindingsByHellomeUserId.set(record.hellomeUserId, record);
  memoryBindingsByAgentsyunUserId.set(record.agentsyunUserId, record);
  return record;
}
