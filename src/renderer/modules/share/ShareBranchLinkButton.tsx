import { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { Button } from '../../shared/components/buttons/Button';
import { useToast } from '../../app/contexts/useToast';
import { branchShareUrl, copyToClipboard, whatsappShareUrl } from '../../shared/utils/shareLink';
import type { Branch } from '../../shared/types/models';

interface ShareBranchLinkButtonProps {
  branch: Branch | null | undefined;
  className?: string;
}

/**
 * Copy + WhatsApp share affordance for a branch's public read-only summary link.
 * Managers use this to post their daily report link into WhatsApp groups.
 */
export function ShareBranchLinkButton({ branch, className }: ShareBranchLinkButtonProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!branch?.slug) return null;

  const url = branchShareUrl(branch.slug);

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      showToast('success', 'Branch link copied.');
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast('error', 'Could not copy the link.');
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => void handleCopy()}>
          {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
          {copied ? 'Copied' : 'Copy branch link'}
        </Button>
        <a
          href={whatsappShareUrl(branch, url)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          <Share2 className="mr-1.5 h-4 w-4" /> Share to WhatsApp
        </a>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Teammates open this link and sign in to view {branch.branch_name}&apos;s read-only daily summary.
      </p>
    </div>
  );
}
