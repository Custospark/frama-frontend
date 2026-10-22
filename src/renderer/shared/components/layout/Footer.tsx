import { DEVELOPER_NAME, DEVELOPER_URL, PRODUCT_NAME, TAGLINE } from '../../brand/framaBrand';

/** Brand footer: stacked on mobile, single row from `lg`. */
export function Footer() {
  return (
    <footer className="flex shrink-0 flex-col items-center justify-center gap-1.5 border-t border-gray-200 bg-white px-4 py-3 text-center text-xs lg:flex-row lg:justify-between lg:gap-2 lg:px-6 lg:text-left">
      <span className="text-center text-gray-500 lg:text-left">
        <span className="font-semibold text-blue-600">{PRODUCT_NAME}</span>
        {' - '}
        {TAGLINE}
      </span>
      <span className="text-center text-blue-600 lg:text-right">
        <span className="lg:hidden">
          Developed by{' '}
          <a
            href={DEVELOPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline hover:text-blue-800"
          >
            {DEVELOPER_NAME}
          </a>
        </span>
        <span className="hidden lg:inline">
          {PRODUCT_NAME} is a system developed by{' '}
          <a
            href={DEVELOPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline hover:text-blue-800"
          >
            {DEVELOPER_NAME}
          </a>
        </span>
      </span>
    </footer>
  );
}
