import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => legalHead("privacy"),
  component: () => <LegalPage slug="privacy" />,
});
