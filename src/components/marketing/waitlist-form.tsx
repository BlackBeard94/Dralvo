"use client";

import { useState, type FormEvent } from "react";

type FormState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

export function WaitlistForm() {
  const [state, setState] = useState<FormState>({ status: "idle", message: "" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();

    if (!email) {
      setState({ status: "error", message: "Enter an email address to join the beta." });
      return;
    }

    setState({ status: "loading", message: "Securing your beta spot..." });

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing" }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setState({
          status: "error",
          message: payload.error || "Something went wrong. Please try again.",
        });
        return;
      }

      form.reset();
      setState({
        status: "success",
        message: payload.message || "You're on the Dralvo beta list.",
      });
    } catch {
      setState({
        status: "error",
        message: "Network error. Please try again in a moment.",
      });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-[460px]"
      aria-describedby="waitlist-status"
    >
      <div className="flex items-center justify-center gap-3 max-sm:flex-col">
        <label className="sr-only" htmlFor="waitlist-email">
          Email address
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          required
          placeholder="your@email.com"
          className="w-full flex-1 px-4 py-3 bg-deep border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-colors font-mono"
        />
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="px-6 py-3 bg-gold text-deep rounded-lg text-sm font-semibold tracking-[0.03em] hover:bg-gold-bright transition-all duration-300 hover:shadow-[0_8px_32px_rgba(212,168,67,0.25)] disabled:cursor-not-allowed disabled:opacity-70 max-sm:w-full"
        >
          {state.status === "loading" ? "Joining..." : "Join Beta"}
        </button>
      </div>
      <p
        id="waitlist-status"
        className={
          state.status === "error"
            ? "mt-4 text-sm text-red"
            : state.status === "success"
              ? "mt-4 text-sm text-green"
              : "mt-4 text-[11px] text-text-muted"
        }
      >
        {state.message || "No spam. No credit card required."}
      </p>
    </form>
  );
}
