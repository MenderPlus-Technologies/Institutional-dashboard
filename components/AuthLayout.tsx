import Link from "next/link";
import { HeartPulse, Landmark, Users } from "lucide-react";
import { InduraLogo } from "@/components/InduraLogo";

interface AuthLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const highlights = [
  {
    icon: HeartPulse,
    title: "Healthcare programs",
    copy: "Fund and track beneficiary enrollments from one place.",
  },
  {
    icon: Landmark,
    title: "Treasury control",
    copy: "Deposit, disburse, and watch float with a clear ledger.",
  },
  {
    icon: Users,
    title: "Institutional access",
    copy: "Built for foundations, NGOs, and health networks.",
  },
] as const;

export function AuthLayout({ children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh bg-[#f4f7f6] lg:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.05fr)]">
      <aside className="relative hidden overflow-hidden bg-[#07352f] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-[#009688]/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 right-[-4rem] h-96 w-96 rounded-full bg-[#00bfa5]/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-12 right-10 w-px bg-gradient-to-b from-white/0 via-white/10 to-white/0"
        />

        <Link href="/" className="relative z-10 inline-flex w-fit">
          <InduraLogo size="lg" className="[&_span]:text-white" />
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7fd8cf]">
            Institutional portal
          </p>
          <h1 className="plusJakarta mt-4 text-[2.15rem] font-semibold leading-tight tracking-[-0.03em] text-white">
            Financial infrastructure for African healthcare
          </h1>
          <p className="interFont mt-4 text-sm leading-relaxed text-white/70">
            Manage programs, treasury, and beneficiary enrollments with the same care you bring to the work.
          </p>

          <ul className="mt-10 space-y-4">
            {highlights.map(({ icon: Icon, title, copy }) => (
              <li key={title} className="flex gap-3.5 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#009688]/30 text-[#9ee6de]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="plusJakarta text-sm font-semibold text-white">{title}</p>
                  <p className="interFont mt-0.5 text-xs leading-relaxed text-white/60">{copy}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/40">
          CAC verification is required before bank withdrawals.
        </p>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-center px-4 pb-2 pt-8 lg:hidden">
          <Link href="/" className="flex flex-col items-center text-center">
            <InduraLogo size="lg" className="mb-2 items-center" />
            <p className="text-caption max-w-xs">
              Institutional Program Portal — Financial Infrastructure for African Healthcare
            </p>
          </Link>
        </header>

        <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-8 sm:px-8">
          <div className="w-full animate-fade-in-up">{children}</div>
        </main>

        {footer && (
          <footer className="px-4 pb-8 pt-1 text-center sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
