import { ROUTES } from '../../app/routes/constants/shared.paths';
import type { Branch } from '../types/models';

/** Absolute, shareable URL for a branch's read-only summary. */
export function branchShareUrl(slug: string): string {
  const path = ROUTES.SHARE.branch(slug);
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

/** Copy text to the clipboard, returning whether it succeeded. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Pre-filled WhatsApp share link so a manager can post the branch link to a group. */
export function whatsappShareUrl(branch: Branch, url: string): string {
  const message = `${branch.branch_name} daily sales report\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
