export function normalizeWorkspaceSlug(role: 'user' | 'creator' | 'admin', phone: string): string {
  const suffix = phone.replace(/\D/g, '').slice(-6);
  return `${role}-${suffix}`;
}

export function buildDemoProfile(input: {
  phone: string;
  name: string;
  email: string;
  workspace: string;
  role: 'user' | 'creator' | 'admin';
}) {
  return {
    externalId: input.phone,
    displayName: input.name,
    email: input.email,
    phone: input.phone,
    workspaceName: input.workspace,
    workspaceSlug: normalizeWorkspaceSlug(input.role, input.phone),
    role: input.role,
  };
}

export type DemoUserSeed = ReturnType<typeof buildDemoProfile>;
