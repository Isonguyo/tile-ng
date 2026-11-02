import { createFileRoute } from "@tanstack/react-router";
import { ResetPage } from "@/routes/reset-password";

export const Route = createFileRoute("/auth/reset-password")({ component: ResetPasswordAlias });

function ResetPasswordAlias() { return <ResetPage />; }
