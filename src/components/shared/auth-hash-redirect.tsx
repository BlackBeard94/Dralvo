"use client";

import { useEffect } from "react";

export function AuthHashRedirect() {
  useEffect(() => {
    if (!window.location.hash.includes("access_token=")) {
      return;
    }

    const params = new URLSearchParams(window.location.hash.slice(1));
    const type = params.get("type");

    if (type === "recovery") {
      window.location.replace(`/reset-password?update=true${window.location.hash}`);
      return;
    }

    window.location.replace("/dashboard");
  }, []);

  return null;
}
