import Link from "next/link";
import { InduraLogo } from "@/components/InduraLogo";

interface AuthLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({ children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto] bg-[#f8f9fb]">
      <header className="flex flex-col items-center px-4 pb-4 pt-8 text-center sm:px-6 sm:pt-10">
        <Link href="/" className="flex flex-col items-center">
          <InduraLogo size="lg" className="mb-3 items-center" />
          <p className="text-caption mt-1 max-w-sm">
            Institutional Program Portal — Financial Infrastructure for African Healthcare
          </p>
        </Link>
      </header>

      <main className="flex min-h-0 items-center justify-center overflow-y-auto px-4 sm:px-6">
        {children}
      </main>

      {footer && (
        <footer className="px-4 py-5 text-center sm:px-6">
          {footer}
        </footer>
      )}
    </div>
  );
}
