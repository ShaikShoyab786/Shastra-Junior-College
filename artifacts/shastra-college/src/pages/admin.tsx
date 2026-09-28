import { useState } from "react";
import { useUser, useClerk, Show } from "@clerk/react";
import { Copy, ExternalLink, LayoutDashboard, LogOut, X } from "lucide-react";
import {
  useGetAdminHome,
  useHealthCheck,
} from "@workspace/api-client-react";
import type { HomePage } from "@workspace/api-client-react";
import { Link } from "wouter";
import AdminHomeEditor from "./admin-home-editor";

type Flash = { tone: "success" | "error"; message: string } | null;

function errorMessage(error: unknown) {
  const candidate = error as {
    response?: { status?: number };
    status?: number;
    message?: string;
  };
  if (candidate?.response?.status === 403 || candidate?.status === 403) {
    return "Your account is signed in, but it is not on the admin allowlist.";
  }
  return candidate?.message || "Something went wrong. Please try again.";
}

function Button({
  children,
  onClick,
  testId,
}: {
  children: React.ReactNode;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      onClick={onClick}
      className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold text-blue-100 transition-colors hover:bg-white/10"
      data-testid={testId}
    >
      {children}
    </button>
  );
}

function Shell({
  children,
  home,
}: {
  children: React.ReactNode;
  home?: HomePage;
}) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-[#f5f7fb] text-slate-900">
      <aside
        className={`${
          mobileNav ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-[#0B3472] px-5 py-6 text-white transition-transform md:translate-x-0`}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="focus-ring flex min-w-0 items-center gap-3"
            data-testid="link-admin-brand"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 p-1">
              <img
                src={home?.settings.logoUrl || "/shastra-college-logo.png"}
                alt=""
                className="h-full w-full object-contain"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-bold">
                {home?.settings.collegeName || "Shastra Junior College"}
              </span>
              <span className="eyebrow block text-blue-200">
                Admin workspace
              </span>
            </span>
          </Link>
          <button
            className="rounded-lg p-2 text-white md:hidden"
            onClick={() => setMobileNav(false)}
            aria-label="Close sidebar"
            data-testid="button-close-sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-12">
          <p className="eyebrow mb-3 text-blue-200">Manage</p>
          <div
            className="flex w-full items-center gap-3 rounded-xl bg-white/10 px-3.5 py-3 text-sm font-semibold"
            aria-current="page"
            data-testid="nav-home-editor"
          >
            <LayoutDashboard className="h-4 w-4" />
            Home editor
          </div>
        </div>

        <div className="mt-auto border-t border-white/15 pt-5">
          <p
            className="truncate text-xs text-blue-100"
            data-testid="text-admin-user"
          >
            {user?.primaryEmailAddress?.emailAddress || user?.id}
          </p>
          <Button
            onClick={() => signOut({ redirectUrl: "/" })}
            testId="button-sign-out"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {mobileNav ? (
        <button
          className="fixed inset-0 z-40 bg-[#0B3472]/30 md:hidden"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation overlay"
          data-testid="button-nav-overlay"
        />
      ) : null}

      <div className="md:pl-[272px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-[#f5f7fb]/90 px-5 backdrop-blur-xl sm:px-8">
          <button
            onClick={() => setMobileNav(true)}
            className="focus-ring rounded-lg p-2 text-[#0B3472] md:hidden"
            aria-label="Open sidebar"
            data-testid="button-open-sidebar"
          >
            <LayoutDashboard className="h-5 w-5" />
          </button>
          <div className="hidden md:block">
            <p className="eyebrow text-[#E3212B]">Homepage content</p>
            <p className="font-display text-lg font-extrabold text-[#0B3472]">
              Home editor
            </p>
          </div>
          <Link
            href="/"
            className="focus-ring ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-[#0B3472]"
            data-testid="link-view-site"
          >
            <ExternalLink className="h-4 w-4" /> View site
          </Link>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

function AdminWorkspace() {
  const { user } = useUser();
  const admin = useGetAdminHome();
  const health = useHealthCheck();
  const [flash, setFlash] = useState<Flash>(null);
  const home = admin.data;

  if (admin.isLoading) return <AdminLoading />;
  if (admin.isError || !home) {
    return <AccessDenied userId={user?.id} error={admin.error} />;
  }

  const showFlash = (message: Flash) => {
    setFlash(message);
    window.setTimeout(() => setFlash(null), 4000);
  };

  return (
    <Shell home={home}>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-[#E3212B]">Home</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0B3472] sm:text-4xl">
              Edit the public homepage.
            </h1>
            <p className="mt-2 max-w-xl leading-6 text-slate-500">
              Update the hero, pathway cards, and statistics shown to visitors.
              Changes are saved to the site database.
            </p>
          </div>
          <div
            className="flex items-center gap-2 text-xs text-slate-500"
            data-testid="status-health"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                health.data?.status === "ok"
                  ? "bg-emerald-500"
                  : health.isError
                    ? "bg-amber-500"
                    : "bg-slate-300"
              }`}
            />
            API {health.data?.status || (health.isError ? "checking" : "ready")}
          </div>
        </div>

        {flash ? (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
              flash.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
            role={flash.tone === "error" ? "alert" : "status"}
            data-testid="status-flash"
          >
            {flash.message}
            <button
              onClick={() => setFlash(null)}
              className="ml-auto rounded p-1"
              aria-label="Dismiss message"
              data-testid="button-dismiss-flash"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <AdminHomeEditor home={home} onFlash={showFlash} />
      </div>
    </Shell>
  );
}

function AdminLoading() {
  return (
    <div
      className="min-h-[100dvh] bg-[#f5f7fb] p-8 md:pl-[320px]"
      aria-label="Loading Home editor"
      data-testid="loading-admin"
    >
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 h-48 max-w-5xl animate-pulse rounded-2xl bg-white" />
      <div className="mt-5 h-64 max-w-5xl animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

function AccessDenied({ userId, error }: { userId?: string; error: unknown }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (userId) {
      await navigator.clipboard?.writeText(userId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f7fb] p-6">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-[#0B3472]/5 sm:p-10">
        <Link
          href="/"
          className="focus-ring text-sm font-bold text-[#0B3472]"
          data-testid="link-denied-home"
        >
          ← Return to public site
        </Link>
        <p className="eyebrow mt-12 text-[#E3212B]">Admin access</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-[#0B3472]">
          This workspace is restricted.
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          {errorMessage(error)} Ask the site owner to add the signed-in user ID
          below to{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
            ADMIN_USER_IDS
          </code>{" "}
          in Replit Secrets.
        </p>
        {userId ? (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <code
              className="min-w-0 flex-1 truncate text-sm text-slate-700"
              data-testid="text-user-id"
            >
              {userId}
            </code>
            <button
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#0B3472] hover:bg-slate-100"
              data-testid="button-copy-user-id"
            >
              <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy ID"}
            </button>
          </div>
        ) : (
          <Link
            href="/sign-in"
            className="focus-ring mt-6 inline-flex rounded-xl bg-[#0B3472] px-5 py-3 text-sm font-bold text-white"
            data-testid="link-sign-in"
          >
            Sign in to continue
          </Link>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <>
      <Show when="signed-out">
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f7fb] p-6">
          <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-[#0B3472]/5">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B3472] text-white">
              <LayoutDashboard />
            </span>
            <p className="eyebrow mt-8 text-[#E3212B]">Staff workspace</p>
            <h1 className="mt-3 font-display text-3xl font-extrabold text-[#0B3472]">
              Sign in to edit the homepage.
            </h1>
            <p className="mt-3 leading-7 text-slate-600">
              The public college site is open to everyone. This workspace is
              reserved for the team keeping it current.
            </p>
            <Link
              href="/sign-in"
              className="focus-ring mt-7 inline-flex w-full items-center justify-center rounded-xl bg-[#0B3472] px-5 py-3.5 text-sm font-bold text-white"
              data-testid="link-admin-sign-in"
            >
              Continue to sign in
            </Link>
          </div>
        </div>
      </Show>
      <Show when="signed-in">
        <AdminWorkspace />
      </Show>
    </>
  );
}