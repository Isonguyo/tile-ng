-- ============================================================
-- WAITLIST PAGE CONTENT
-- ============================================================

CREATE TABLE IF NOT EXISTS public.waitlist_page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL DEFAULT 'waitlist',
  content_key text NOT NULL,
  content_value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, content_key)
);

GRANT SELECT ON public.waitlist_page_content TO anon, authenticated;
GRANT ALL ON public.waitlist_page_content TO service_role;

ALTER TABLE public.waitlist_page_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read waitlist page content"
ON public.waitlist_page_content;

CREATE POLICY "Anyone can read waitlist page content"
ON public.waitlist_page_content
FOR SELECT
TO anon, authenticated
USING (true);


-- ============================================================
-- WAITLIST PAGE DATA FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_waitlist_page_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats_json jsonb;
  content_json jsonb;
BEGIN

  SELECT jsonb_build_object(
    'count', (
      SELECT count(*)
      FROM public.waitlist
    ),
    'buyers', (
      SELECT count(*)
      FROM public.waitlist
      WHERE user_type = 'buyer'
    ),
    'sellers', (
      SELECT count(*)
      FROM public.waitlist
      WHERE user_type = 'seller'
    ),
    'artisans', (
      SELECT count(*)
      FROM public.waitlist
      WHERE user_type = 'artisan'
    ),
    'all_types', (
      SELECT count(*)
      FROM public.waitlist
      WHERE user_type = 'all'
    ),
    'visits', (
      SELECT count(*)
      FROM public.waitlist_events
      WHERE event_type = 'visit'
    ),
    'join_clicks', (
      SELECT count(*)
      FROM public.waitlist_events
      WHERE event_type = 'join_click'
    ),
    'signups', (
      SELECT count(*)
      FROM public.waitlist_events
      WHERE event_type = 'signup'
    )
  )
  INTO stats_json;

  SELECT COALESCE(
    jsonb_object_agg(content_key, content_value),
    '{}'::jsonb
  )
  INTO content_json
  FROM public.waitlist_page_content
  WHERE slug = 'waitlist';

  RETURN jsonb_build_object(
    'stats', stats_json,
    'content', content_json
  );

END;
$$;


REVOKE ALL
ON FUNCTION public.get_waitlist_page_data()
FROM public;

GRANT EXECUTE
ON FUNCTION public.get_waitlist_page_data()
TO anon, authenticated;


-- ============================================================
-- WAITLIST CONTENT
-- ============================================================

INSERT INTO public.waitlist_page_content
  (slug, content_key, content_value)
VALUES

(
  'waitlist',
  'hero',
  $${
    "badge": "Launching soon in Nigeria",
    "title": "Buy. Sell. Hire.",
    "highlight": "Everything you need in one trusted marketplace.",
    "description": "Tile connects buyers, sellers and skilled artisans across Nigeria in one powerful platform. Join the waitlist today and be among the first to experience the future of local commerce.",
    "ctaPrimary": "Join the Waitlist",
    "ctaSecondary": "Learn More",
    "countLabel": "Join {count} early members preparing for launch"
  }$$::jsonb
),

(
  'waitlist',
  'community',
  $${
    "title": "Live community momentum",
    "subtitle": "Nigerians are already joining the waitlist and preparing for launch.",
    "items": [
      {
        "label": "Buyers",
        "key": "buyers"
      },
      {
        "label": "Sellers",
        "key": "sellers"
      },
      {
        "label": "Artisans",
        "key": "artisans"
      },
      {
        "label": "Businesses",
        "key": "all_types"
      }
    ]
  }$$::jsonb
),

(
  'waitlist',
  'launch',
  $${
    "heading": "Launching in",
    "description": "A countdown keeps the urgency alive and makes the launch feel near.",
    "deadline": "2026-10-15T00:00:00.000Z"
  }$$::jsonb
),

(
  'waitlist',
  'benefits',
  $$[
    {
      "title": "Early Access",
      "body": "Be among the very first people to use Tile when we open the doors.",
      "icon": "Rocket"
    },
    {
      "title": "Priority Verification",
      "body": "Get your account verified faster, before the public rush.",
      "icon": "BadgeCheck"
    },
    {
      "title": "Seller Advantage",
      "body": "Build and stock your shop before everyone else joins.",
      "icon": "Store"
    },
    {
      "title": "Artisan Exposure",
      "body": "Get discovered by paying customers from day one.",
      "icon": "Wrench"
    },
    {
      "title": "Launch Rewards",
      "body": "Exclusive launch bonuses and free promotional slots.",
      "icon": "Gift"
    }
  ]$$::jsonb
),

(
  'waitlist',
  'features',
  $$[
    {
      "title": "Buy & Sell Products",
      "body": "List anything from phones to property in minutes.",
      "icon": "ShoppingBag"
    },
    {
      "title": "Find Trusted Artisans",
      "body": "Plumbers, tailors, electricians and more, near you.",
      "icon": "Wrench"
    },
    {
      "title": "Secure Messaging",
      "body": "Chat with buyers and sellers without sharing your number.",
      "icon": "MessageSquare"
    },
    {
      "title": "Verified Vendors",
      "body": "KYC-backed badges so you know who you are dealing with.",
      "icon": "ShieldCheck"
    },
    {
      "title": "Business Shops",
      "body": "A shareable storefront with your own link and QR code.",
      "icon": "Store"
    },
    {
      "title": "Promotions",
      "body": "Boost listings to the top of search and category pages.",
      "icon": "Megaphone"
    },
    {
      "title": "Smart Search",
      "body": "Filter by state, LGA, price, condition and rating.",
      "icon": "Search"
    },
    {
      "title": "AI Recommendations",
      "body": "Personalised picks tailored to you.",
      "icon": "Sparkles",
      "soon": true
    }
  ]$$::jsonb
),

(
  'waitlist',
  'faqs',
  $$[
    {
      "q": "When is Tile launching?",
      "a": "We are in the final stretch of development. Waitlist members get the launch date by email before anyone else."
    },
    {
      "q": "Is joining free?",
      "a": "Yes. Joining the waitlist is completely free, and there is no obligation to buy or sell anything."
    },
    {
      "q": "Can artisans register?",
      "a": "Absolutely. Artisans get a dedicated profile with portfolio, ratings and direct customer enquiries. Choose Artisan when joining."
    },
    {
      "q": "Can businesses use Tile?",
      "a": "Yes. Businesses can open a verified shop with their own storefront link, QR code, analytics and promotion tools."
    },
    {
      "q": "How will I know when it launches?",
      "a": "We will email you the moment we go live, along with your early-access invitation and launch bonuses."
    }
  ]$$::jsonb
),

(
  'waitlist',
  'socials',
  $$[
    {
      "label": "Facebook",
      "href": "#",
      "icon": "Facebook"
    },
    {
      "label": "Instagram",
      "href": "#",
      "icon": "Instagram"
    },
    {
      "label": "TikTok",
      "href": "#",
      "icon": "Music2"
    },
    {
      "label": "X",
      "href": "#",
      "icon": "Twitter"
    },
    {
      "label": "LinkedIn",
      "href": "#",
      "icon": "Linkedin"
    },
    {
      "label": "YouTube",
      "href": "#",
      "icon": "Youtube"
    },
    {
      "label": "WhatsApp Community",
      "href": "#",
      "icon": "MessageCircle",
      "soon": true
    }
  ]$$::jsonb
),

(
  'waitlist',
  'progress',
  $${
    "heading": "Launch progress",
    "description": "A live view of the build status keeps momentum high.",
    "overall": 82,
    "milestones": [
      {
        "label": "Marketplace",
        "status": "Completed"
      },
      {
        "label": "Messaging",
        "status": "Completed"
      },
      {
        "label": "Wallet",
        "status": "In Progress"
      },
      {
        "label": "AI",
        "status": "In Progress"
      },
      {
        "label": "Delivery",
        "status": "Coming Soon"
      }
    ]
  }$$::jsonb
),

(
  'waitlist',
  'footer',
  $${
    "heading": "Ready to join Nigeria's next marketplace?",
    "body": "Join the waitlist today — it is free, and it takes 20 seconds.",
    "cta": "Join the Waitlist",
    "copyright": "© {year} Tile. Nigeria's marketplace for buying, selling and hiring artisans."
  }$$::jsonb
),

(
  'waitlist',
  'sections',
  $${
    "benefits": {
      "title": "Why join early?",
      "description": "Early members get advantages the public launch won't offer."
    },
    "features": {
      "title": "Everything Tile will do",
      "description": "One platform for goods, services and the people behind them."
    },
    "faqs": {
      "title": "Frequently asked questions"
    },
    "form": {
      "title": "Join the waitlist",
      "subtitle": "Takes 20 seconds. No payment needed.",
      "submit": "Join the Waitlist",
      "successTitle": "You're on the list 🎉",
      "successTitleExists": "You're already on the waitlist 🎉",
      "successBody": "We'll email you the moment Tile goes live, with your early-access invite.",
      "successButton": "Add another person"
    }
  }$$::jsonb
)

ON CONFLICT (slug, content_key)
DO UPDATE SET
  content_value = EXCLUDED.content_value,
  updated_at = now();