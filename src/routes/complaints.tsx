import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";

export const Route = createFileRoute("/complaints")({
  head: () => legalHead("complaints"),
  component: () => <LegalPage slug="complaints" />,
});
