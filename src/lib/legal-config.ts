// Business details used to fill placeholders in the legal documents. Update here.
export const LEGAL_CONFIG = {
  platform: "Tile",
  entity: "Pi10 Technologies",
  domain: "tile.com.ng",
  minimumAge: "18",
  jurisdiction: "Nigeria",
  email: "princewillisonguyo@gmail.com",
  // A postal address was not provided yet; the contact inbox is shown instead.
  address: "Contact: tilemarketplace0@gmail.com (postal address to be published)",
  phone: "Available on request via email",
  supportPath: "Report buttons on listings/profiles, or email princewillisonguyo@gmail.com",
  version: "1.0",
  effectiveDate: "4 October 2026",
};

export function fillLegal(text: string): string {
  const c = LEGAL_CONFIG;
  return text
    .replaceAll("[INSERT LEGAL ENTITY NAME]", c.entity)
    .replaceAll("[INSERT ADDRESS]", c.address)
    .replaceAll("[INSERT EMAIL]", c.email)
    .replaceAll("[INSERT PHONE]", c.phone)
    .replaceAll("[INSERT MINIMUM AGE]", c.minimumAge)
    .replaceAll("[INSERT AGE]", c.minimumAge)
    .replaceAll("[INSERT AFTER LEGAL REVIEW]", `Courts of the Federal Republic of ${c.jurisdiction}`)
    .replaceAll("[INSERT JURISDICTION]", c.jurisdiction)
    .replaceAll("[INSERT FINAL DOMAIN]", c.domain)
    .replaceAll("[INSERT DATE]", c.effectiveDate)
    .replaceAll("[INSERT PATH]", c.supportPath);
}

export const LEGAL_LINKS = [
  { to: "/terms", label: "Terms of Service" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/cookies", label: "Cookie Policy" },
  { to: "/seller-terms", label: "Seller Terms" },
  { to: "/artisan-terms", label: "Artisan Terms" },
  { to: "/billing-terms", label: "Billing Terms" },
  { to: "/acceptable-use", label: "Acceptable Use" },
  { to: "/complaints", label: "Complaints" },
] as const;
