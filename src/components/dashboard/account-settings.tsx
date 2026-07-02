"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Camera, Loader2, Mail, MailWarning, User2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";

type Profile = {
  email: string | null;
  emailVerified: boolean;
  fullName: string | null;
  avatarUrl: string | null;
};

export function AccountSettings() {
  const { locale } = useLocale();
  const c = DASHBOARD_COPY[locale].accountSettings;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d: Profile) => {
        if (!active) return;
        setProfile(d);
        setName(d.fullName ?? "");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function saveName() {
    setSavingName(true);
    setNameMsg(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_name", fullName: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || c.errorGeneric);
      setNameMsg(c.nameSaved);
      setProfile((p) => (p ? { ...p, fullName: name.trim() || null } : p));
    } catch (e) {
      setNameMsg(e instanceof Error ? e.message : c.nameSaveFailed);
    } finally {
      setSavingName(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setAvatarMsg(c.avatarTooLarge);
      return;
    }
    setUploading(true);
    setAvatarMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/user/profile", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || c.uploadFailed);
      setProfile((p) => (p ? { ...p, avatarUrl: data.avatarUrl } : p));
      setAvatarMsg(c.avatarUpdated);
    } catch (err) {
      setAvatarMsg(err instanceof Error ? err.message : c.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  async function resendVerification() {
    if (!profile?.email) return;
    setResending(true);
    setVerifyMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({ type: "signup", email: profile.email });
      if (error) throw error;
      setVerifyMsg(c.verificationResent);
    } catch (e) {
      setVerifyMsg(e instanceof Error ? e.message : c.verificationSendFailed);
    } finally {
      setResending(false);
    }
  }

  const initial = (profile?.fullName || profile?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="mb-4 flex items-center gap-2">
        <User2 className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg text-text-primary">{c.title}</h2>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 border-b border-border pb-5">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-deep text-xl font-semibold text-text-primary">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-text-primary transition hover:bg-deep disabled:opacity-50"
            aria-label={c.changeAvatar}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{c.avatarLabel}</p>
          <p className="text-xs text-text-muted">{c.avatarHint}</p>
          {avatarMsg && <p className="mt-1 text-xs text-gold">{avatarMsg}</p>}
        </div>
      </div>

      {/* Full name */}
      <div className="border-b border-border py-5">
        <label className="mb-1.5 block text-sm font-medium text-text-primary">{c.displayNameLabel}</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={c.namePlaceholder}
            maxLength={80}
            className="flex-1 rounded-lg border border-border bg-deep px-3 py-2 text-sm text-text-primary outline-none focus:border-gold"
          />
          <button
            type="button"
            onClick={saveName}
            disabled={savingName || name.trim() === (profile?.fullName ?? "")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {savingName && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {c.save}
          </button>
        </div>
        {nameMsg && <p className="mt-1.5 text-xs text-gold">{nameMsg}</p>}
      </div>

      {/* Email + verification */}
      <div className="pt-5">
        <label className="mb-1.5 block text-sm font-medium text-text-primary">{c.emailLabel}</label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-deep px-3 py-2 text-sm text-text-secondary">
            <Mail className="h-4 w-4 text-text-muted" />
            {profile?.email ?? "—"}
          </div>
          {profile?.emailVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-green/40 bg-green/10 px-2.5 py-1 text-xs font-medium text-green">
              <BadgeCheck className="h-3.5 w-3.5" /> {c.verified}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold">
              <MailWarning className="h-3.5 w-3.5" /> {c.notVerified}
            </span>
          )}
        </div>
        {profile && !profile.emailVerified && (
          <button
            type="button"
            onClick={resendVerification}
            disabled={resending}
            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-text-primary transition hover:bg-deep disabled:opacity-50"
          >
            {resending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {c.resendVerification}
          </button>
        )}
        {verifyMsg && <p className="mt-1.5 text-xs text-text-muted">{verifyMsg}</p>}
      </div>
    </div>
  );
}
