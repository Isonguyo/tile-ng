import { useMemo } from "react";

function scorePassword(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string; tone: string } {
  if (!pw) return { score: 0, label: "Empty", tone: "bg-[#163321]" };
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
  const tones = [
    "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
    "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]",
    "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
    "bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.7)]",
  ];
  return { score, label: labels[score], tone: tones[score] };
}

export function PasswordStrength({ password }: { password: string }) {
  const { score, label, tone } = useMemo(() => scorePassword(password), [password]);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5 h-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              i < score ? tone : "bg-[#163321]"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-400">
        Strength: <span className="font-semibold text-slate-200">{label}</span>
      </p>
    </div>
  );
}

export { scorePassword };
