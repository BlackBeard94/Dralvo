"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Bell, Mail, MessageCircle, Check, X, Copy, ExternalLink } from "lucide-react";

//  Types 
type ConnectStatus = {
  connectCode: string;
  isConnected: boolean;
  botUsername: string | null;
  notification_prefs?: NotificationPrefs;
};

type NotificationPrefs = {
  email: boolean;
  telegram: boolean;
  in_app: boolean;
};

type Props = {
  className?: string;
};

//  Component 
export function NotificationPreferences({ className }: Props) {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email: true,
    telegram: false,
    in_app: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  //  Fetch connect status 
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/connect");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.notification_prefs) {
          setPrefs(data.notification_prefs);
        } else if (data.isConnected) {
          setPrefs((current) => ({ ...current, telegram: true }));
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  //  Toggle preference 
  const togglePref = (key: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  //  Save preferences 
  const savePrefs = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_prefs: prefs }),
      });
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  //  Copy connect code 
  const copyCode = async () => {
    if (!status?.connectCode) return;
    await navigator.clipboard.writeText(status.connectCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  //  Disconnect Telegram 
  const disconnectTelegram = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/telegram/connect", { method: "DELETE" });
      if (res.ok) {
        setStatus((prev) => prev ? { ...prev, isConnected: false } : null);
        setPrefs((p) => ({ ...p, telegram: false }));
      }
    } catch {
      // silent
    } finally {
      setDisconnecting(false);
    }
  };

  const sendTestNotification = async () => {
    setTesting(true);
    setTestMessage(null);
    try {
      const response = await fetch("/api/alerts/test-notification", {
        method: "POST",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || "Failed to send test notification.");
      }

      const sentChannels = Object.entries(body.dispatched ?? {})
        .filter(([, sent]) => sent)
        .map(([channel]) => channel.replace("_", "-"));
      setTestMessage(
        sentChannels.length > 0
          ? `Test sent via ${sentChannels.join(", ")}.`
          : "No channel was enabled or connected.",
      );
    } catch (error) {
      setTestMessage(
        error instanceof Error ? error.message : "Failed to send test notification.",
      );
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 bg-surface rounded" />
          <div className="h-8 w-full bg-surface rounded" />
          <div className="h-8 w-full bg-surface rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 space-y-5", className)}>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Bell className="w-4 h-4 text-gold" />
        <h3 className="font-display text-base text-text-primary">Notification Preferences</h3>
      </div>

      {/* Channels */}
      <div className="space-y-3">
        {/* Email */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5 text-gold" />
            </div>
            <div>
              <p className="font-mono text-sm text-text-primary">Email</p>
              <p className="font-mono text-[13px] text-text-muted">Alert emails to your account email</p>
            </div>
          </div>
          <button
            onClick={() => togglePref("email")}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              prefs.email ? "bg-green" : "bg-border"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                prefs.email ? "left-[22px]" : "left-0.5"
              )}
            />
          </button>
        </div>

        {/* Telegram */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <p className="font-mono text-sm text-text-primary">Telegram</p>
              <p className="font-mono text-[13px] text-text-muted">
                {status?.isConnected
                  ? "Connected - instant alerts via Telegram"
                  : "Connect your Telegram to receive alerts"}
              </p>
            </div>
          </div>
          {status?.isConnected ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-mono text-[13px] text-green">
                <Check className="w-3 h-3" /> Connected
              </span>
              <button
                onClick={disconnectTelegram}
                disabled={disconnecting}
                className="font-mono text-[13px] text-red hover:text-red/80 transition-colors"
              >
                {disconnecting ? "..." : "Disconnect"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => togglePref("telegram")}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                prefs.telegram ? "bg-green" : "bg-border"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  prefs.telegram ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          )}
        </div>

        {/* In-App */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-gold" />
            </div>
            <div>
              <p className="font-mono text-sm text-text-primary">In-App</p>
              <p className="font-mono text-[13px] text-text-muted">Show notifications in dashboard</p>
            </div>
          </div>
          <button
            onClick={() => togglePref("in_app")}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              prefs.in_app ? "bg-green" : "bg-border"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                prefs.in_app ? "left-[22px]" : "left-0.5"
              )}
            />
          </button>
        </div>
      </div>

      {/* Telegram Connect Section */}
      {!status?.isConnected && status?.botUsername && (
        <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-3">
          <p className="font-mono text-xs text-text-secondary">
            To connect Telegram, send this code to{" "}
            <a
              href={`https://t.me/${status.botUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-gold-bright transition-colors"
            >
              @{status.botUsername}
            </a>
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md border border-gold/20 bg-deep px-3 py-2 font-mono text-sm text-gold select-all">
              {status.connectCode}
            </code>
            <button
              onClick={copyCode}
              className="shrink-0 h-9 w-9 rounded-md border border-border bg-surface flex items-center justify-center hover:border-gold/30 transition-colors"
              title="Copy code"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-text-muted" />
              )}
            </button>
          </div>
          <a
            href={`https://t.me/${status.botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-gold hover:text-gold-bright transition-colors"
          >
            Open Telegram Bot <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Save Button */}
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          onClick={savePrefs}
          disabled={saving}
          className="rounded-md bg-gold px-4 py-2.5 font-mono text-sm font-medium text-deep hover:bg-gold-bright transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
        <button
          onClick={sendTestNotification}
          disabled={testing}
          className="rounded-md border border-border-gold px-4 py-2.5 font-mono text-sm font-medium text-gold hover:bg-gold/10 transition-colors disabled:opacity-50"
        >
          {testing ? "Sending..." : "Send Test"}
        </button>
      </div>

      {testMessage && (
        <p className="rounded-md border border-border bg-surface/60 px-3 py-2 font-mono text-[13px] text-text-secondary">
          {testMessage}
        </p>
      )}
    </div>
  );
}

