"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { AUTH_COPY } from "@/lib/i18n";

function safeInternalRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeInternalRedirect(searchParams.get("redirect"));
  const encodedRedirect = encodeURIComponent(redirect);
  const { locale } = useLocale();
  const copy = AUTH_COPY[locale];
  const callbackError =
    searchParams.get("error") === "auth_callback_error"
      ? copy.login.callbackError
      : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (redirect.startsWith("/api/")) {
        window.location.assign(redirect);
        return;
      }

      router.push(redirect);
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen bg-deep flex flex-col items-center justify-center px-4 relative">
      {/* Gold veins */}
      <div className="gold-veins" aria-hidden="true">
        <div className="v1" />
        <div className="v2" />
        <div className="v3" />
        <div className="h1" />
        <div className="h2" />
      </div>

      {/* Glow orb */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(212,168,67,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="block text-center mb-10 group"
        >
          <span className="font-display text-3xl text-gold tracking-wide">
            DRALVO
          </span>
          <span className="block text-xs text-text-muted mt-1 font-mono tracking-[0.2em] uppercase">
            {copy.tagline}
          </span>
        </Link>

        {/* Card */}
        <div className="bg-surface border border-border rounded-xl p-8 animate-fade-in-up">
          <h1 className="font-display text-2xl text-text-primary mb-1">
            {copy.login.title}
          </h1>
          <p className="text-text-muted text-sm mb-8">
            {copy.login.subtitle}
          </p>

          {(error || callbackError) && (
            <div className="mb-6 p-3 rounded-lg bg-red/10 border border-red/20 text-red text-sm">
              {error || callbackError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-mono text-text-secondary mb-2 uppercase tracking-wider"
              >
                {copy.email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={copy.emailPlaceholder}
                className="w-full bg-deep border border-border rounded-lg px-4 py-3 text-text-primary text-sm font-mono placeholder:text-text-muted focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-mono text-text-secondary mb-2 uppercase tracking-wider"
              >
                {copy.password}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder={copy.passwordPlaceholder}
                  className="w-full bg-deep border border-border rounded-lg px-4 py-3 pr-12 text-text-primary text-sm font-mono placeholder:text-text-muted focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:text-gold"
                  aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <Link
                href="/reset-password"
                className="text-xs text-text-muted hover:text-gold transition-colors"
              >
                {copy.login.forgot}
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-action text-[#060609] font-mono font-semibold text-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gold-actionHover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {copy.login.loading}
                </>
              ) : (
                <>
                  {copy.login.submit}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-text-muted text-sm">
              {copy.login.noAccount}{" "}
              <Link
                href={`/signup?redirect=${encodedRedirect}`}
                className="text-gold hover:text-gold-bright transition-colors font-medium"
              >
                {copy.login.noAccountCta}
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-text-muted text-xs mt-6 font-mono">
          <Link
            href="https://deerflow.tech"
            target="_blank"
            className="hover:text-gold transition-colors"
          >
            Deerflow
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-deep flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
