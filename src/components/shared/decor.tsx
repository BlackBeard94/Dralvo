import { cn } from "@/lib/utils";

export function GridPattern() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(212,168,67,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,0.3) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }}
    />
  );
}

export function GlowOrb({ className }: { className?: string }) {
  return (
    <div
      className={cn("absolute rounded-full blur-[120px] pointer-events-none", className)}
      style={{
        background: "radial-gradient(circle, rgba(212,168,67,0.12) 0%, transparent 70%)",
      }}
    />
  );
}
