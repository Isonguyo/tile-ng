
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  document_type text NOT NULL,
  version text NOT NULL,
  content text NOT NULL,
  content_hash text,
  effective_at timestamptz NOT NULL DEFAULT now(),
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS legal_documents_one_current ON public.legal_documents(slug) WHERE is_current;

CREATE TABLE IF NOT EXISTS public.user_legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_document_id uuid NOT NULL REFERENCES public.legal_documents(id) ON DELETE RESTRICT,
  document_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  acceptance_context text NOT NULL DEFAULT 'manual',
  document_hash text,
  UNIQUE (user_id, legal_document_id)
);

CREATE INDEX IF NOT EXISTS ula_user_idx ON public.user_legal_acceptances(user_id);

CREATE TABLE IF NOT EXISTS public.user_marketing_consents (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  opted_in boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.legal_documents TO anon, authenticated;
GRANT SELECT ON public.user_legal_acceptances TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_marketing_consents TO authenticated;
GRANT ALL ON public.legal_documents, public.user_legal_acceptances, public.user_marketing_consents TO service_role;

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_marketing_consents ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.tile_is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin')
$$;

DROP POLICY IF EXISTS "legal docs readable" ON public.legal_documents;
CREATE POLICY "legal docs readable" ON public.legal_documents FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "own acceptances readable" ON public.user_legal_acceptances;
CREATE POLICY "own acceptances readable" ON public.user_legal_acceptances FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.tile_is_admin());

DROP POLICY IF EXISTS "own marketing consent" ON public.user_marketing_consents;
CREATE POLICY "own marketing consent" ON public.user_marketing_consents FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

INSERT INTO public.legal_documents (slug, title, document_type, version, content, content_hash, effective_at, is_current)
SELECT s.slug, s.title, s.dtype, s.ver, s.body, s.hash, '2026-10-04'::timestamptz,
       NOT EXISTS (SELECT 1 FROM public.legal_documents x WHERE x.slug = s.slug AND x.is_current)
FROM (VALUES
('terms', 'Terms of Service', 'terms', '1.0', $tile_legal$## 1. About Tile

Tile is an online marketplace for discovering, advertising, communicating with, and engaging sellers, merchants, artisans, and service providers. “Tile”, “we”, “us” and “our” mean the legal entity operating Tile. “User” means anyone using Tile. “Seller/Merchant” offers goods. “Artisan/Service Provider” offers services. “Buyer/Customer/Client” discovers or engages them.

By creating an account, submitting a listing/profile, purchasing a Tile service, or using a feature requiring acceptance, you agree to these Terms and applicable additional terms.

## 2. Eligibility and accounts

You must provide accurate information and meet Tile’s minimum age requirement: 18. You are responsible for account security and activity through your account, subject to applicable law. Do not impersonate others, use another person’s account without authorization, create fraudulent accounts, or bypass security controls.

## 3. Tile’s role

Tile provides marketplace technology. Unless expressly stated otherwise, Tile is not the seller of products listed by Sellers and is not the service provider for services offered by Artisans. A listing, profile, approval or verification badge is not a guarantee of authenticity, qualification, quality, availability, safety or successful completion of a transaction.

## 4. Sellers

Sellers must provide accurate and non-misleading information about products, including price, condition, specifications, availability, location, material defects and relevant delivery/return information. Sellers must have the legal right to sell listed goods and comply with applicable laws.

## 5. Artisans

Artisans must provide truthful information about profession, qualifications, experience, certifications, service area, availability, pricing and portfolio. Where a service requires a licence or registration, the Artisan is responsible for maintaining it. Tile approval does not guarantee professional competence or service quality.

## 6. Transactions

Unless Tile expressly becomes a contracting party, transactions and service engagements are between the relevant Users. Users are responsible for complying with applicable law and evaluating counterparties.

## 7. Pre-launch

During pre-launch, content may be reviewed and approved while remaining private. Approval does not necessarily mean publication. Tile controls marketplace launch.

## 8. Content

You retain rights you own in content you submit. You grant Tile a non-exclusive, worldwide, royalty-free licence to host, store, reproduce, display, format, distribute and use that content as reasonably necessary to operate, secure, moderate, improve and promote Tile and provide marketplace services. You represent that you have the necessary rights.

## 9. Reviews

Reviews must reflect genuine experiences. Fake reviews, rating manipulation, threats over reviews, multiple accounts for manipulation, and knowingly false or unlawful content are prohibited.

## 10. Prohibited activity

Fraud, impersonation, illegal goods/services, scams, malware, unauthorized access, abusive conduct, spam, deceptive listings, privacy violations, intellectual-property infringement, ranking manipulation, review manipulation and attempts to evade moderation are prohibited.

## 11. Moderation

Tile may use automated tools, reports and human review to reject, restrict, remove or suspend content and accounts where reasonably necessary and permitted by law.

## 12. Communications

Tile may provide chat, phone, WhatsApp, enquiry and quote tools. Users are responsible for their communications and must not use them for fraud, spam, harassment, threats or other prohibited activity.

## 13. Privacy

Tile processes personal data under its Privacy Policy and applicable Nigerian data-protection law.

## 14. Intellectual property

Tile and its licensors own or control Tile software, branding, logos, interface and proprietary materials except where stated otherwise. Unauthorized copying, modification, distribution, reverse engineering or commercial exploitation is prohibited except where permitted by law.

## 15. Subscriptions

Tile may offer merchant, artisan and bundled paid features. Subscription prices, renewal, cancellation and refunds are governed by the Subscription & Billing Terms. Paid visibility does not guarantee sales, leads, traffic or revenue.

## 16. Availability and disclaimers

Tile is provided subject to availability. To the extent permitted by law, Tile does not guarantee uninterrupted operation, accuracy of every User submission, User conduct, or any commercial result. Nothing excludes a right or liability that cannot lawfully be excluded.

## 17. Liability

To the extent permitted by law, Tile is not responsible for losses arising solely from transactions or interactions between Users that Tile did not undertake as a contracting party, including fraudulent statements by Users, defective goods, poor workmanship, non-payment or failure to deliver. Mandatory statutory rights and liabilities remain unaffected.

## 18. Indemnity

To the extent permitted by law, you are responsible for claims/losses arising from your violation of these Terms, unlawful conduct, fraud, rights infringement or submitted content. This does not apply where prohibited by law.

## 19. Suspension and termination

Tile may suspend or terminate accounts for serious/repeated violations, fraud, illegal activity, security threats, misleading listings, review manipulation, failed verification or conduct materially threatening Users or Tile.

## 20. Complaints and redress

Tile will provide an accessible complaints mechanism for listings, Users, subscriptions, payments, moderation, privacy and other Platform matters.

Support/complaints: princewillisonguyo@gmail.com

Address: Contact: tilemarketplace0@gmail.com (postal address to be published)

Users retain rights available under applicable law.

## 21. Governing law

These Terms are governed by the laws of the Federal Republic of Nigeria, subject to mandatory legal rights and remedies.

Jurisdiction/forum: Courts of the Federal Republic of Nigeria

## 22. Changes and electronic acceptance

Tile may update these Terms. Material changes may require notice or re-acceptance. Tile may record acceptance electronically, including checkbox/button acceptance, together with the document version and timestamp.

## 23. Contact

Legal operator: Pi10 Technologies

Address: Contact: tilemarketplace0@gmail.com (postal address to be published)

Email: princewillisonguyo@gmail.com

Phone: Available on request via email

Domain: tile.com.ng$tile_legal$, '3e63896bebc942172e4d6d9135d39f904bf357c805c282aa419e1e2f87afeb0e'),
('privacy', 'Privacy Policy', 'privacy', '1.0', $tile_legal$## 1. Who we are

Tile is an online marketplace. Data Controller: Pi10 Technologies. Address: Contact: tilemarketplace0@gmail.com (postal address to be published). Privacy contact: princewillisonguyo@gmail.com.

## 2. Information Tile may process

Depending on how you use Tile:

- full name, email and authentication identifiers;
- phone, WhatsApp, avatar/profile photo;
- state, LGA, city/location;
- business name and shop slug;
- bio and portfolio information;
- seller listing titles, descriptions, categories, prices, condition, brand, service mode, location, phone, images, status, promotion, views and clicks;
- artisan profession, experience, starting price, availability, service area, portfolio images, verification/status, ratings and response metrics;
- KYC status and documents where required;
- bank name, account number and account name for applicable seller functionality;
- waitlist/referral information;
- messages, enquiries and notifications;
- subscription plan/status/dates and payment/transaction references;
- artisan analytics events such as impressions, profile views, saves, shares, WhatsApp and phone actions;
- technical, security, log and cookie information where applicable.

Tile does not need to store raw passwords or payment-card credentials when those are handled by authentication/payment providers.

## 3. Uses

Tile may use information to operate accounts and the marketplace; authenticate users; manage pre-launch content; publish approved content after launch; process subscriptions; provide communications; verify users; prevent fraud; moderate content; provide analytics; improve search/ranking; maintain security; respond to complaints; comply with law; enforce agreements; and send permitted service/marketing communications.

## 4. Lawful bases

Depending on the activity, Tile may rely on contract performance, legal obligations, legitimate interests, consent where required, and other lawful bases available under Nigerian data-protection law.

## 5. Public content

Information intentionally placed in a public seller listing or artisan profile may become public after approval and launch. During pre-launch, approved marketplace content may remain private. Do not place private information in public-facing fields.

## 6. Sharing

Tile may share information with hosting/infrastructure, authentication, payment, communication, analytics/security providers, professional advisers, regulators, law enforcement and courts where appropriate or legally required. Tile does not sell personal information merely because you use the Platform.

## 7. International processing

Some service providers may process data outside Nigeria. Tile will use legally appropriate safeguards where required.

## 8. Retention

Tile retains information as reasonably necessary for the purpose collected, account operation, security, disputes, legal obligations and enforcement. Retention periods vary by data type.

## 9. Security

Tile uses reasonable technical and organizational safeguards. No internet service can guarantee absolute security.

## 10. Rights

Subject to applicable law, you may have rights to access, correct, delete/erase, object, restrict processing, portability and withdraw consent where consent is the lawful basis.

Privacy requests: princewillisonguyo@gmail.com

## 11. Marketing

Service messages may be necessary for account operation. Promotional communications will use applicable lawful bases and user preferences. Marketing consent is separate from Terms acceptance.

## 12. Children

Minimum age: 18. Tile does not knowingly invite users below the applicable minimum age to create restricted accounts.

## 13. Cookies

See the separate Cookie Policy.

## 14. Changes and contact

Tile may update this Policy when practices, services, security or legal obligations change.

Privacy contact: princewillisonguyo@gmail.com

Address: Contact: tilemarketplace0@gmail.com (postal address to be published)$tile_legal$, '71cf39f0589d7c987484c9334201340ada00fee3c04ce11048e6d1f9d7777727'),
('cookies', 'Cookie Policy', 'cookies', '1.0', $tile_legal$## 1. What cookies are

Cookies and similar technologies are stored on or associated with a browser/device to provide functionality, remember choices, measure use or support other purposes.

## 2. Necessary cookies

These support authentication/session management, security, fraud prevention, network stability, accessibility and core Platform functionality. They remain enabled because they are necessary for the service.

## 3. Preferences cookies

Optional technologies may remember non-essential interface preferences.

## 4. Analytics cookies

If enabled, analytics technologies may measure page usage, marketplace interactions, performance, errors and aggregate usage. Where consent is required, analytics remains off until the user opts in.

## 5. Marketing cookies

If Tile later deploys advertising/marketing cookies, pixels or similar technologies requiring consent, they will be a separate optional category and not enabled by default.

## 6. Controls

Users can Accept All, Reject Optional or Customize. Optional consent can be changed/withdrawn later through Cookie Settings.

## 7. Third parties

Hosting, authentication, payment, analytics or security providers may use their own technologies subject to their policies and Tile's configuration.

## 8. Changes

Tile may update this Policy when technologies or purposes change.

Contact: princewillisonguyo@gmail.com$tile_legal$, '29576350db371abc6d825114789a8c5170314fa413986f9e45dab76f518f5b90'),
('seller-terms', 'Seller Terms', 'seller', '1.0', $tile_legal$1. Sellers must provide accurate, current and non-misleading product information.

2. Sellers must own or be legally authorized to sell listed goods.

3. Sellers must not list prohibited or unlawful goods.

4. Price, condition, specifications, availability, defects and material limitations must be disclosed accurately.

5. Used, second-hand, refurbished and reconditioned goods must be described honestly.

6. Sellers must comply with applicable consumer, tax, licensing, product-safety and regulatory requirements.

7. Sellers are responsible for fulfilment, delivery/collection arrangements and applicable returns/refunds unless Tile expressly provides the service.

8. Fake discounts, bait pricing, deceptive claims and review manipulation are prohibited.

9. Seller communication must be professional and lawful.

10. Tile may restrict/remove listings or accounts for violations, fraud, repeated complaints or security concerns.

11. Approved listings may remain private until marketplace launch.

12. Acceptance of these Terms is required where the seller onboarding flow presents them.$tile_legal$, '530fcfde186e065b2786a310ab34005d6eb5d85013b60a09c6ad476f042d4f12'),
('artisan-terms', 'Artisan Terms', 'artisan', '1.0', $tile_legal$1. Artisans must provide truthful information about profession, experience, qualifications, certifications, service area, availability, pricing and portfolio.

2. Artisans are responsible for licences/registrations legally required for their services.

3. Artisans are responsible for workmanship, scope, timing, safety, pricing and lawful delivery of their services.

4. Quotes must be honest and not materially misleading.

5. Customer safety and professional conduct are required.

6. Portfolio content must belong to the Artisan or be used with permission.

7. Do not claim qualifications, jobs or experience that you do not possess.

8. Verification by Tile is not a blanket guarantee of competence or future conduct.

9. Do not fabricate or manipulate reviews.

10. Do not misuse customer contact information for unrelated spam or unauthorized marketing.

11. Keep availability and service-area information current.

12. Approved profiles remain private during pre-launch until publication rules permit public visibility.

13. Tile may suspend/remove profiles for fraud, false claims, prohibited services, safety concerns, failed verification or other violations.$tile_legal$, 'acce24d41d01e923340289c19c52aef409682a899d0884a2c06c028f1af34578'),
('billing-terms', 'Subscription & Billing Terms', 'billing', '1.0', $tile_legal$## 1. Separate product families

Tile supports dual-role accounts. One account may have a Merchant subscription, an Artisan subscription, or both. A Merchant plan does not automatically purchase an Artisan plan and vice versa unless a bundle explicitly says so.

## 2. Plan disclosure

Before payment, Tile will display the plan, price, billing interval, material benefits and conditions.

## 3. Payments

Payments may be processed by third-party providers. Tile may retain transaction/reference information needed to reconcile payments and manage subscriptions.

## 4. Renewal and cancellation

Where recurring billing is offered, renewal terms will be shown before purchase. Users may cancel using the available cancellation mechanism. Cancellation does not necessarily refund a period already paid unless Tile's policy or applicable law provides otherwise.

## 5. Refunds

Refunds follow Tile's published refund policy and applicable law. Mandatory statutory rights are unaffected.

## 6. Payment failure

Tile may restrict paid features after payment failure and applicable notice/grace period.

## 7. Promotions

Founding-user, free, discounted and promotional plans may have separate expiry or eligibility conditions.

## 8. Premium visibility

Paid visibility does not guarantee views, leads, sales, customers or revenue.

## 9. Changes

Tile may change plan prices/features subject to applicable law and appropriate notice.

Billing contact: princewillisonguyo@gmail.com$tile_legal$, 'be4c04f7535931e3169f2943a4e50b5340736460a1e43d621766574e99a3977b'),
('acceptable-use', 'Acceptable Use Policy', 'policy', '1.0', $tile_legal$Prohibited conduct includes fraud, scams, impersonation, fake accounts, unlawful goods/services, stolen goods, materially misleading listings, fake reviews, rating manipulation, harassment, threats, abusive content, malware, unauthorized access, spam, intellectual-property infringement, privacy violations, unauthorized scraping/data harvesting, ranking manipulation, moderation evasion, and other unlawful or harmful activity.

Users can report suspicious listings, profiles, messages or conduct through Tile's support/reporting channels.

Tile may investigate and take action including warnings, content removal, restricted visibility, suspension, termination, verification requests or referral to appropriate authorities where legally appropriate.

Moderation cannot guarantee that every violation will be detected immediately.$tile_legal$, 'db6649b61fa1fb9b1d8ca99ecf922a56b06361e3e68738dabcb9b74c10154a2c2'),
('complaints', 'Complaints & Disputes', 'policy', '1.0', $tile_legal$Tile provides a channel for complaints concerning listings, Sellers, Artisans, accounts, subscriptions, payments, moderation, privacy, security and other Platform matters.

Complaint email: princewillisonguyo@gmail.com

In-platform support: Report buttons on listings/profiles, or email princewillisonguyo@gmail.com

A complaint should identify the relevant account/listing/profile, explain the issue and include available supporting evidence.

Tile may request information, contact relevant parties, review Platform records and take appropriate action.

Unless Tile expressly becomes a contracting party, disputes about the underlying sale or service should first be addressed between the Buyer/Customer and the relevant Seller/Artisan, without limiting any statutory rights.

Nothing prevents a user from exercising rights available under Nigerian law or approaching a competent regulator/court.$tile_legal$, '3418bb76b536d9d99975182468efe3ede8a1194375916dca1fd1f808dfc2b996')
) AS s(slug, title, dtype, ver, body, hash)
ON CONFLICT (slug, version) DO NOTHING;

CREATE OR REPLACE FUNCTION public.record_legal_acceptance(_slug text, _context text DEFAULT 'manual')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.legal_documents;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO d FROM public.legal_documents WHERE slug = _slug AND is_current;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown document %', _slug; END IF;
  INSERT INTO public.user_legal_acceptances(user_id, legal_document_id, document_version, acceptance_context, document_hash)
  VALUES (auth.uid(), d.id, d.version, left(coalesce(_context, 'manual'), 60), d.content_hash)
  ON CONFLICT (user_id, legal_document_id) DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.my_pending_legal_documents()
RETURNS TABLE(slug text, title text, version text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.slug, d.title, d.version FROM public.legal_documents d
  WHERE d.is_current AND d.slug IN ('terms', 'privacy') AND auth.uid() IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.user_legal_acceptances a
                    WHERE a.user_id = auth.uid() AND a.legal_document_id = d.id)
$$;

CREATE OR REPLACE FUNCTION public.admin_publish_legal_version(_slug text, _version text, _content text, _effective_at timestamptz DEFAULT now())
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE old public.legal_documents; nid uuid;
BEGIN
  IF NOT public.tile_is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO old FROM public.legal_documents WHERE slug = _slug AND is_current;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown document %', _slug; END IF;
  UPDATE public.legal_documents SET is_current = false, updated_at = now() WHERE id = old.id;
  INSERT INTO public.legal_documents(slug, title, document_type, version, content, content_hash, effective_at, is_current)
  VALUES (_slug, old.title, old.document_type, _version, _content, encode(digest(_content, 'sha256'), 'hex'), _effective_at, true)
  RETURNING id INTO nid;
  RETURN nid;
END $$;

CREATE OR REPLACE FUNCTION public.admin_legal_acceptance_stats()
RETURNS TABLE(slug text, title text, version text, is_current boolean, effective_at timestamptz, acceptances bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tile_is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY SELECT d.slug, d.title, d.version, d.is_current, d.effective_at,
    (SELECT count(*) FROM public.user_legal_acceptances a WHERE a.legal_document_id = d.id)
  FROM public.legal_documents d ORDER BY d.slug, d.effective_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.tile_record_signup_legal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb); s text; slugs text[];
BEGIN
  IF m ? 'accepted_terms_version' THEN
    slugs := ARRAY['terms', 'privacy'];
    IF m->>'account_type' = 'merchant' THEN slugs := slugs || 'seller-terms'::text; END IF;
    IF m->>'account_type' = 'artisan' THEN slugs := slugs || 'artisan-terms'::text; END IF;
    FOREACH s IN ARRAY slugs LOOP
      INSERT INTO public.user_legal_acceptances(user_id, legal_document_id, document_version, acceptance_context, document_hash)
      SELECT NEW.id, d.id, d.version, 'signup', d.content_hash FROM public.legal_documents d WHERE d.slug = s AND d.is_current
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  INSERT INTO public.user_marketing_consents(user_id, opted_in)
  VALUES (NEW.id, coalesce((m->>'marketing_opt_in')::boolean, false))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN others THEN
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tile_signup_legal ON auth.users;
CREATE TRIGGER tile_signup_legal AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.tile_record_signup_legal();

REVOKE ALL ON FUNCTION public.record_legal_acceptance(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_pending_legal_documents() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_publish_legal_version(text, text, text, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_legal_acceptance_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.tile_record_signup_legal() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_legal_acceptance(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_pending_legal_documents() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_publish_legal_version(text, text, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_legal_acceptance_stats() TO authenticated;
