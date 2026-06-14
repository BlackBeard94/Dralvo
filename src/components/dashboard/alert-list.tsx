"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertCard } from "./alert-card";
import { AlertForm } from "./alert-form";
import type { Alert, CreateAlertInput, UpdateAlertInput } from "@/types/alerts";

type Props = {
  className?: string;
};

export function AlertList({ className }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editAlert, setEditAlert] = useState<Alert | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get the authenticated user's ID from Supabase session
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAlerts = useCallback(async () => {
    if (!userId) return;
    try {
      setError("");
      const res = await fetch("/api/alerts");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchAlerts();
    }
  }, [userId, fetchAlerts]);

  const handleCreate = async (input: CreateAlertInput) => {
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "Failed to create alert");
    }
    await fetchAlerts();
  };

  const handleUpdate = async (id: string, input: UpdateAlertInput) => {
    const res = await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "Failed to update alert");
    }
    await fetchAlerts();
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to toggle alert");
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, active } : a))
      );
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete alert");
      }
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      setError(err instanceof Error ? err.message : "Failed to delete alert");
    }
  };

  const handleEdit = (alert: Alert) => {
    setEditAlert(alert);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditAlert(null);
  };

  const activeCount = alerts.filter((a) => a.active).length;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg text-text-primary">
            Alert Rules
          </h3>
          <p className="font-mono text-xs text-text-muted mt-0.5">
            {activeCount} active / {alerts.length} total
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-md bg-gold px-3 py-1.5 font-mono text-xs font-medium text-deep hover:bg-gold-bright transition-colors"
        >
          + New Alert
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[88px] rounded-lg border border-border/50 bg-card/50 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red/30 bg-red/5 p-4">
          <p className="font-mono text-sm text-red">{error}</p>
          <button
            onClick={fetchAlerts}
            className="mt-2 font-mono text-xs text-gold hover:text-gold-bright transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && alerts.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/50 p-8 text-center">
          <p className="font-mono text-sm text-text-muted">
            No alert rules yet.
          </p>
          <p className="font-mono text-xs text-text-muted/70 mt-1">
            Create your first alert to get notified when indicators hit your targets.
          </p>
        </div>
      )}

      {/* Alert list */}
      {!loading && !error && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      <AlertForm
        open={formOpen}
        onClose={handleFormClose}
        onSave={handleCreate}
        onUpdate={handleUpdate}
        editAlert={editAlert}
      />
    </div>
  );
}
