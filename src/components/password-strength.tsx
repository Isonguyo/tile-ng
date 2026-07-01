import { useMemo } from "react";

function scorePassword(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string; tone: string } {
  if (!pw) return { score: 0, label: "Empty", tone: "bg-muted" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  // Penalise very repetitive
  if (/^(.)\1+$/.test(pw)) s = 1;
  const score = Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Very weak", "Weak", "Okay", "Strong", "Excellent"];
  const tones = ["bg-red-500", "bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"];
  return { score, label: labels[score], tone: tones[score] };
}

export function PasswordStrength({ password }: { password: string }) {
  const { score, label, tone } = useMemo(() => scorePassword(password), [password]);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1 h-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${i < score ? tone : "bg-muted"}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Strength: <span className="font-medium text-foreground">{label}</span>
      </p>
    </div>
  );
}

export { scorePassword };