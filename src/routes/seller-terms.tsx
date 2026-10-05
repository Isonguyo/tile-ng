import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";

export const Route = createFileRoute("/seller-terms")({
  head: () => legalHead("seller-terms"),
  component: () => <LegalPage slug="seller-terms" />,
});
