import { useMemo } from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const rules = [
  { key: "length", label: "8+ characters" },
  { key: "uppercase", label: "Uppercase" },
  { key: "lowercase", label: "Lowercase" },
  { key: "number", label: "Number" },
  { key: "special", label: "Special character" },
] as const;

export function PasswordStrength({ password }: { password: string }) {
  const score = useMemo(() => {
    if (!password) return 0;
    let value = 0;
    if (password.length >= 8) value += 1;
    if (/[A-Z]/.test(password)) value += 1;
    if (/[a-z]/.test(password)) value += 1;
    if (/\d/.test(password)) value += 1;
    if (/[^A-Za-z0-9]/.test(password)) value += 1;
    if (/^(.)\1+$/.test(password)) value = Math.min(value, 1);
    return Math.min(value, 5);
  }, [password]);

  const label = ["Weak", "Fair", "Good", "Strong", "Excellent"][Math.min(score, 4)] ?? "Weak";
  const tone =
    ["bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500", "bg-emerald-600"][
      Math.min(score, 4)
    ] ?? "bg-red-500";
  const met = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-3">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-muted-foreground">Password strength</span>
        <span
          className={cn(
            "font-semibold",
            score >= 4 ? "text-emerald-600" : score >= 2 ? "text-amber-600" : "text-red-600",
          )}
        >
          {label}
        </span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              step < score ? tone : "bg-muted",
            )}
          />
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {rules.map((rule, index) => {
          const valid = met[index];
          return (
            <div key={rule.key} className="flex items-center gap-2 text-xs text-muted-foreground">
              {valid ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              <span className={valid ? "text-foreground" : undefined}>{rule.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function scorePassword(password: string) {
  if (!password) return { score: 0, label: "Weak" };
  let value = 0;
  if (password.length >= 8) value += 1;
  if (/[A-Z]/.test(password)) value += 1;
  if (/[a-z]/.test(password)) value += 1;
  if (/\d/.test(password)) value += 1;
  if (/[^A-Za-z0-9]/.test(password)) value += 1;
  if (/^(.)\1+$/.test(password)) value = Math.min(value, 1);
  return {
    score: Math.min(value, 5),
    label: ["Weak", "Fair", "Good", "Strong", "Excellent"][Math.min(value, 4)] ?? "Weak",
  };
}
