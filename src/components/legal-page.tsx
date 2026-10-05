import { Link } from "@tanstack/react-router";
import { LEGAL_DOCS } from "@/lib/legal-content";
import { LEGAL_CONFIG, LEGAL_LINKS, fillLegal } from "@/lib/legal-config";
import { LegalFooter } from "@/components/legal-footer";

export function legalHead(slug: string) {
  const doc = LEGAL_DOCS.find((d) => d.slug === slug)!;
  const title = `${doc.title} | Tile`;
  const description = `Read Tile's ${doc.title} — operated by ${LEGAL_CONFIG.entity}, Nigeria.`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}

export function LegalPage({ slug }: { slug: string }) {
  const doc = LEGAL_DOCS.find((d) => d.slug === slug)!;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[220px_1fr]">
        <nav className="space-y-1 text-sm md:sticky md:top-6 md:self-start">
          <Link to="/" className="mb-4 block font-semibold text-primary">← Tile home</Link>
          {LEGAL_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={`block rounded-md px-3 py-2 hover:bg-accent ${l.to === `/${slug}` ? "bg-accent font-semibold" : "text-muted-foreground"}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <article className="max-w-3xl">
          <h1 className="text-3xl font-bold">{doc.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Version {LEGAL_CONFIG.version} · Effective {LEGAL_CONFIG.effectiveDate} · {LEGAL_CONFIG.entity}
          </p>
          <div className="mt-8 space-y-4 leading-relaxed">
            {doc.blocks.map((b, i) =>
              b.h ? <h2 key={i} className="pt-4 text-xl font-semibold">{fillLegal(b.h)}</h2>
              : b.li ? <li key={i} className="ml-5 list-disc text-muted-foreground">{fillLegal(b.li)}</li>
              : <p key={i} className="text-muted-foreground">{fillLegal(b.p ?? "")}</p>,
            )}
          </div>
        </article>
      </div>
      <LegalFooter />
    </div>
  );
}
