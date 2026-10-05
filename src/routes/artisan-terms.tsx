import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";

export const Route = createFileRoute("/artisan-terms")({
  head: () => legalHead("artisan-terms"),
  component: () => <LegalPage slug="artisan-terms" />,
});
