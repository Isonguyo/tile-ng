import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MailCheck } from "lucide-react";

export function EmailVerificationNotice({
  email,
  onResend,
  busy,
  cooldown,
}: {
  email?: string | null;
  onResend: () => void;
  busy: boolean;
  cooldown: number;
}) {
  return (
    <div className="space-y-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-left">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
          <MailCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Verify your email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We’ve sent a confirmation link to{" "}
            <span className="font-semibold text-foreground">{email ?? "your inbox"}</span>.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          onClick={onResend}
          disabled={busy || cooldown > 0}
          className="w-full sm:w-auto"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
        </Button>
        <Button type="button" asChild variant="outline" className="w-full sm:w-auto">
          <Link to="/login">Back to login</Link>
        </Button>
      </div>
    </div>
  );
}
