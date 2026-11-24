import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in — NFI X9",
  description: "Private access to the NostalgiaForInfinity X9 command center.",
};

type LoginSearchParams = {
  error?: string | string[];
  next?: string | string[];
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const params = await searchParams;
  const error = params.error === "1";
  const next = safeNext(typeof params.next === "string" ? params.next : "/");
  const configured =
    process.env.DASHBOARD_AUTH_DISABLED === "1" ||
    Boolean(process.env.DASHBOARD_PASSWORD && process.env.DASHBOARD_SECRET);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-canvas px-5 py-10 text-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(110,168,255,0.16),transparent_65%)]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-[13px] font-semibold tracking-[0.18em] text-ink">
              NFI / X9
            </p>
            <p className="text-[10px] tracking-[0.22em] text-muted">
              COMMAND CENTER
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-line bg-panel p-6 shadow-2xl shadow-black/30">
          <h1 className="text-xl font-semibold tracking-tight">
            Sign in to continue
          </h1>
          <p className="mt-2 text-xs leading-5 text-muted">
            This dashboard proxies live account data. Enter the dashboard
            password to open the session.
          </p>

          {configured ? (
            <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
              <input type="hidden" name="next" value={next} />
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                  Password
                </span>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  autoFocus
                  required
                  className="w-full rounded-xl border border-line bg-panel-2 px-3.5 py-3 text-sm text-ink outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
                />
              </label>

              {error ? (
                <p className="rounded-lg border border-negative/20 bg-negative/5 px-3 py-2 text-xs text-negative">
                  Incorrect password. Try again.
                </p>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-canvas transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Enter dashboard
              </button>
            </form>
          ) : (
            <p className="mt-5 rounded-lg border border-negative/20 bg-negative/5 px-3 py-2 text-xs text-negative">
              Authentication is not configured on the server.
            </p>
          )}
        </section>

        <p className="mt-5 text-center text-[11px] text-muted">
          Freqtrade credentials stay on the server.
        </p>
      </div>
    </main>
  );
}
