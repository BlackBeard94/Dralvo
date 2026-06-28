"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, ArrowRight, Loader2, Check } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { AUTH_COPY } from "@/lib/i18n";

function safeInternalRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function getSignupCallbackUrl(redirect: string) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    window.location.origin;
  const callbackUrl = new URL("/auth/callback", siteUrl);

  if (redirect !== "/dashboard") {
    callbackUrl.searchParams.set("next", redirect);
  }

  return callbackUrl.toString();
}

function SignupForm() {
  const searchParams = useSearchParams();
  const redirect = safeInternalRedirect(searchParams.get("redirect"));
  const encodedRedirect = encodeURIComponent(redirect);
  const { locale } = useLocale();
  const copy = AUTH_COPY[locale];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError(copy.passwordTooShort);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getSignupCallbackUrl(redirect),
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // ponytail: window.location.origin — OAuth in-browser, not email
        redirectTo: new URL("/auth/callback", window.location.origin).toString(),
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-deep flex flex-col items-center justify-center px-4 relative overflow-hidden">
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
        <div className="bg-surface border border-border rounded-xl p-5 sm:p-8 animate-fade-in-up">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green/10 border border-green/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green" />
              </div>
              <h1 className="font-display text-2xl text-text-primary mb-2">
                {copy.signup.successTitle}
              </h1>
              <p className="text-text-secondary text-sm mb-6">
                {copy.signup.successBodyPrefix}{" "}
                <span className="text-gold font-mono">{email}</span>.{" "}
                {copy.signup.successBodySuffix}
              </p>
              <Link
                href={`/login?redirect=${encodedRedirect}`}
                className="inline-flex items-center gap-2 text-gold hover:text-gold-bright transition-colors text-sm"
              >
                {copy.signup.goToLogin} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl text-text-primary mb-1">
                {copy.signup.title}
              </h1>
              <p className="text-text-muted text-sm mb-8">
                {copy.signup.subtitle}
              </p>

              {error && (
                <div className="mb-6 p-3 rounded-lg bg-red/10 border border-red/20 text-red text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-5">
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
                      minLength={8}
                      autoComplete="new-password"
                      placeholder={copy.minPasswordPlaceholder}
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
                  <p className="mt-2 text-xs text-text-muted">
                    {copy.signup.passwordRequirement}
                  </p>
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
                      {copy.signup.loading}
                    </>
                  ) : (
                    <>
                      {copy.signup.submit}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs leading-relaxed text-text-muted">
                  {copy.signup.legalPrefix}{" "}
                  <Link href="/terms" className="text-gold hover:text-gold-bright">
                    {copy.signup.terms}
                  </Link>{" "}
                  &{" "}
                  <Link href="/privacy" className="text-gold hover:text-gold-bright">
                    {copy.signup.privacy}
                  </Link>
                  .
                </p>
              </form>

              {/* Google sign-up */}
              <div className="mt-6 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-surface px-4 text-text-muted font-mono">
                      {copy.dividerText}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={loading}
                  className="w-full bg-deep border border-border rounded-lg px-4 py-3 text-text-primary text-sm font-mono flex items-center justify-center gap-3 hover:border-gold/50 hover:bg-gold/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {copy.googleLoading}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      {copy.googleSignUp}
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="mt-8 pt-6 border-t border-border text-center">
                <p className="text-text-muted text-sm">
                  {copy.signup.existing}{" "}
                  <Link
                    href={`/login?redirect=${encodedRedirect}`}
                    className="text-gold hover:text-gold-bright transition-colors font-medium"
                  >
                    {copy.signup.existingCta}
                  </Link>
                </p>
              </div>
            </>
          )}
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

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-deep flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </main>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
