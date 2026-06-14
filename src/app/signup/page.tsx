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
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodedRedirect}`,
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
