import { DEVELOPER_NAME, DEVELOPER_URL, PRODUCT_NAME, TAGLINE } from '../../brand/framaBrand';

/** Brand footer, shown at `lg` and above (mobile keeps the content full-width). */
export function Footer() {
  return (
    <footer className="hidden shrink-0 items-center justify-between gap-2 border-t border-gray-200 bg-white px-6 py-3 text-xs lg:flex">
      <span className="text-center text-gray-500 sm:text-left">
        <span className="font-semibold text-blue-600">{PRODUCT_NAME}</span>
        {' - '}
        {TAGLINE}
      </span>
      <span className="text-blue-600">
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
    </footer>
  );
}
