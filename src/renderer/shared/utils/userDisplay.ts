/** First letter of the first and last words of a name, uppercased (max 2). */
export function nameInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** First word of a name, for friendly greetings. */
export function firstName(name: string | null | undefined): string {
  if (!name) return 'there';
  return name.trim().split(/\s+/)[0] || 'there';
}

/** Human label for each role, used across the sidebar and header. */
export const ROLE_LABELS: Record<string, string> = {
  manager: 'Branch Manager',
  executive: 'Executive',
  platform_admin: 'Platform Admin',
};

/** Human label for a role, falling back to the raw value. */
export function roleLabel(role: string | null | undefined): string {
  if (!role) return '';
  return ROLE_LABELS[role] ?? role;
}

