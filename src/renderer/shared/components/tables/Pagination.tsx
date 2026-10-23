import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../buttons/Button';

interface PaginationProps {
  page: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

function pageWindow(page: number, lastPage: number): Array<number | 'ellipsis'> {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(lastPage - 1, page + 1);

  if (start > 2) pages.push('ellipsis');
  for (let current = start; current <= end; current += 1) pages.push(current);
  if (end < lastPage - 1) pages.push('ellipsis');
  pages.push(lastPage);

  return pages;
}

export function Pagination({ page, lastPage, total, perPage, onPageChange, loading }: PaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-gray-500">
        Showing <span className="font-medium text-gray-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-gray-700">{total}</span> reports
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          aria-label="Previous page"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pageWindow(page, lastPage).map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm text-gray-400">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? 'primary' : 'outline'}
              size="sm"
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
              disabled={loading}
              onClick={() => onPageChange(item)}
              className="min-w-9 px-2"
            >
              {item}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          aria-label="Next page"
          disabled={page >= lastPage || loading}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
