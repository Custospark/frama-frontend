import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import {
  PRODUCT_NAME,
  SUPPORTING_LINE,
  TAGLINE,
} from '../../shared/brand/framaBrand';
import { ROUTES } from '../../app/routes/constants/shared.paths';
import { AUTH_HERO_IMAGES } from './authHeroImages';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  subtitleClassName?: string;
  heroImage?: string;
  heroDescription?: string;
}

const AUTH_HIGHLIGHTS = [
  { value: 'Daily', label: 'Reports' },
  { value: 'Live', label: 'Totals' },
  { value: 'Photo', label: 'Receipts' },
] as const;

export function AuthLayout({
  title,
  subtitle,
  subtitleClassName,
  heroImage,
  heroDescription,
  children,
}: PropsWithChildren<AuthLayoutProps>) {
  const image = heroImage || AUTH_HERO_IMAGES.login;
  const description = heroDescription || SUPPORTING_LINE;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left brand panel (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/85 to-slate-950/80" />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-12 w-full">
          <Link to={ROUTES.LOGIN} className="inline-flex w-fit items-center gap-2.5 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="text-white text-xl font-bold tracking-tight group-hover:text-blue-100 transition-colors">
              {PRODUCT_NAME}
            </span>
          </Link>

          <div className="max-w-md space-y-5">
            <div>
              <h1 className="text-3xl xl:text-4xl font-bold text-white mb-3 leading-tight">
                {TAGLINE}
              </h1>
              <p className="text-blue-100/90 text-base leading-relaxed">{description}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {AUTH_HIGHLIGHTS.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 text-white min-w-[100px] text-center border border-white/10"
                >
                  <div className="text-lg font-bold">{stat.value}</div>
                  <div className="text-blue-200/90 text-xs mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            <p className="text-blue-200/80 text-sm">
              Motels · Bars · Saunas · Hostels - one connected dashboard
            </p>
          </div>

          <div className="text-center space-y-1">
            <p className="text-white/70 text-sm">
              {PRODUCT_NAME} is a system developed by{' '}
              <a
                href="https://www.custospark.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white underline underline-offset-2 transition-colors"
              >
                Custospark Company Ltd
              </a>
            </p>
            <div className="text-white/55 text-xs">
              &copy; {new Date().getFullYear()} Custospark. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="flex w-full items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-20">
          <Link to={ROUTES.LOGIN} className="inline-flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="truncate text-lg font-bold text-blue-600 sm:text-xl">{PRODUCT_NAME}</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8 sm:py-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden relative h-44 sm:h-48 mb-8 overflow-hidden rounded-2xl shadow-md ring-1 ring-gray-200/80">
              <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/95 via-blue-900/55 to-blue-900/25" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-white text-lg font-bold leading-snug">{TAGLINE}</p>
                <p className="text-blue-100/80 text-xs mt-2 line-clamp-2">{description}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-8 lg:border-0 lg:shadow-none lg:bg-transparent lg:p-0">
              <div className="text-center mb-7">
                <h2 className="text-2xl sm:text-[1.65rem] font-bold text-gray-900 mb-1.5">{title}</h2>
                {subtitle && (
                  <p className={`text-sm sm:text-base leading-relaxed ${subtitleClassName ?? 'text-gray-500'}`}>
                    {subtitle}
                  </p>
                )}
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
