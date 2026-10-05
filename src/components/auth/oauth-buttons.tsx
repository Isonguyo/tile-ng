import { Button } from "@/components/ui/button";
import { Chrome, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export function OAuthButtons({ disabled = false }: { disabled?: boolean }) {
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  const handleGoogle = async () => {
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}${location.pathname}${location.search}`
        : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      toast.error("Google sign-in could not be started. Please try again.");
      return;
    }

    navigate({ to: "/dashboard" });
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={disabled}
      >
        {disabled ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Chrome className="mr-2 h-4 w-4" />
        )}
        Continue with Google
      </Button>
    </div>
  );
}
