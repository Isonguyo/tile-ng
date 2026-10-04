import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";

export const Route = createFileRoute("/billing-terms")({
  head: () => legalHead("billing-terms"),
  component: () => <LegalPage slug="billing-terms" />,
});
