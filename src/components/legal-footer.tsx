import { Link } from "@tanstack/react-router";
import { LEGAL_CONFIG, LEGAL_LINKS } from "@/lib/legal-config";
import { openCookieSettings } from "@/components/cookie-banner";

export function LegalFooter() {
  return (
    <footer className="border-t border-border px-4 py-6 text-xs text-muted-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 font-semibold text-foreground">Legal</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-foreground hover:underline">{l.label}</Link>
          ))}
          <button type="button" onClick={openCookieSettings} className="hover:text-foreground hover:underline">Cookie Settings</button>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} {LEGAL_CONFIG.entity}. Tile · {LEGAL_CONFIG.domain}</p>
      </div>
    </footer>
  );
}
