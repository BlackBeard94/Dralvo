"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2, Check, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { AUTH_COPY } from "@/lib/i18n";

export default function ResetPasswordPage() {
  const { locale } = useLocale();
  const copy = AUTH_COPY[locale];
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [updateMode, setUpdateMode] = useState(false);
  const [recoverySessionReady, setRecoverySessionReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldUpdate = params.get("update") === "true";
    setUpdateMode(shouldUpdate);

    if (!shouldUpdate) return;

    let active = true;
    const supabase = createClient();
    setCheckingSession(true);

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setRecoverySessionReady(Boolean(data.session));
      setCheckingSession(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword.length < 8) {
      setError(copy.passwordTooShort);
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(copy.reset.passwordsDoNotMatch);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setSuccess(true);
    setLoading(false);
  };

  const renderRequestForm = () => (
    <>
      <h1 className="font-display text-2xl text-text-primary mb-1">
        {copy.reset.title}
      </h1>
      <p className="text-text-muted text-sm mb-8">
        {copy.reset.subtitle}
      </p>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red/10 border border-red/20 text-red text-sm" aria-live="polite">
          {error}
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-5">
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold-action text-[#060609] font-mono font-semibold text-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gold-actionHover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {copy.reset.loading}
            </>
          ) : (
            <>
              {copy.reset.submit}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </>
  );

  const renderUpdateForm = () => {
    if (checkingSession) {
      return (
        <div className="flex flex-col items-center py-10 text-center">
          <Loader2 className="mb-4 h-6 w-6 animate-spin text-gold" />
          <p className="text-sm text-text-secondary">{copy.reset.updateLoading}</p>
        </div>
      );
    }

    if (!recoverySessionReady) {
      return (
        <div className="text-center py-4">
          <h1 className="font-display text-2xl text-text-primary mb-2">
            {copy.reset.invalidLinkTitle}
          </h1>
          <p className="text-text-secondary text-sm mb-6">
            {copy.reset.invalidLinkBody}
          </p>
          <button
            type="button"
            onClick={() => {
              setUpdateMode(false);
              setError(null);
              window.history.replaceState(null, "", "/reset-password");
            }}
            className="inline-flex items-center gap-2 text-gold hover:text-gold-bright transition-colors text-sm"
          >
            {copy.reset.requestAnotherLink} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <>
        <h1 className="font-display text-2xl text-text-primary mb-1">
          {copy.reset.updateTitle}
        </h1>
        <p className="text-text-muted text-sm mb-8">
          {copy.reset.updateSubtitle}
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red/10 border border-red/20 text-red text-sm" aria-live="polite">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div>
            <label
              htmlFor="new-password"
              className="block text-xs font-mono text-text-secondary mb-2 uppercase tracking-wider"
            >
              {copy.reset.newPassword}
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder={copy.minPasswordPlaceholder}
                className="w-full bg-deep border border-border rounded-lg px-4 py-3 pr-12 text-text-primary text-sm font-mono placeholder:text-text-muted focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((value) => !value)}
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:text-gold"
                aria-label={showNewPassword ? copy.hidePassword : copy.showPassword}
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-xs font-mono text-text-secondary mb-2 uppercase tracking-wider"
            >
              {copy.reset.confirmPassword}
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder={copy.reset.confirmPasswordPlaceholder}
                className="w-full bg-deep border border-border rounded-lg px-4 py-3 pr-12 text-text-primary text-sm font-mono placeholder:text-text-muted focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:text-gold"
                aria-label={showConfirmPassword ? copy.hidePassword : copy.showPassword}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-action text-[#060609] font-mono font-semibold text-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gold-actionHover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {copy.reset.updateLoading}
              </>
            ) : (
              <>
                {copy.reset.updateSubmit}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </>
    );
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

        <div className="bg-surface border border-border rounded-xl p-5 sm:p-8 animate-fade-in-up">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green/10 border border-green/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green" />
              </div>
              <h1 className="font-display text-2xl text-text-primary mb-2">
                {updateMode ? copy.reset.updateSuccessTitle : copy.reset.successTitle}
              </h1>
              <p className="text-text-secondary text-sm mb-6">
                {updateMode ? (
                  copy.reset.updateSuccessBody
                ) : (
                  <>
                    {copy.reset.successBodyPrefix}{" "}
                    <span className="text-gold font-mono">{email}</span>.
                  </>
                )}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-gold hover:text-gold-bright transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> {copy.reset.backToLogin}
              </Link>
            </div>
          ) : (
            <>
              {updateMode ? renderUpdateForm() : renderRequestForm()}
              <div className="mt-8 pt-6 border-t border-border text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-text-muted hover:text-gold transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" /> {copy.reset.backToLogin}
                </Link>
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
            ✦ Deerflow
          </Link>
        </p>
      </div>
    </main>
  );
}
