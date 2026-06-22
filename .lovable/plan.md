# Fish-X Business — Detailed Plan Document

Generate a single Microsoft Word file (`.docx`) containing the full, detailed version of the originally proposed standalone Fish-X Business plan. No project code will be written or modified.

## Deliverable

- File: `/mnt/documents/FishX-Business-Plan.docx`
- Format: Word (.docx), US Letter, Arial, branded heading styles (navy `#031029` / primary `#1454AE`), TOC, page numbers.
- Length target: ~15–25 pages of substantive detail (not filler).

## Document outline

1. **Cover & Executive Summary** — product vision, who it serves, why standalone, success metrics.
2. **Scope & Non-Goals** — what v1 includes vs. explicitly excludes.
3. **Personas & Use Cases** — Charter Captain, Tackle Shop Owner, Marina, Apparel Brand, Gear Manufacturer, Guide Service; primary jobs-to-be-done per persona.
4. **Architecture Overview**
   - Standalone Lovable project, own Supabase instance, own auth namespace.
   - Cross-app integration surface with consumer Fish-X (read-only directory feed, challenge sponsorship handshake, deep links).
   - Tech stack, hosting, domains (`business.fishx.app` proposed).
5. **Auth & Account Model** — business accounts, team members/roles (owner, manager, staff), invite flow, email verification, password reset, OAuth providers.
6. **Data Model** — tables: `businesses`, `business_members`, `business_categories`, `business_posts`, `business_followers`, `business_buddies`, `business_messages`, `sponsored_challenges`, `subscriptions`, `verification_requests`. ER overview + RLS strategy (security-definer `has_business_role`).
7. **Core Features (v1)**
   - Signup wizard (category, location, verification docs upload).
   - Public business profile page (hero, about, hours, location/map, gallery, posts, reviews stub).
   - Social feed posts (text, photos, link to challenges/products).
   - Followers + discoverable directory with filters (category, location, verified).
   - Map view (Mapbox) with clustering.
   - Buddies + 1:1 messaging with anglers (cross-app bridge via signed tokens).
   - Sponsor a Fishing Challenge (creates entry in consumer Fish-X via signed webhook).
8. **Monetization**
   - Free tier: 1 location, basic profile, 5 posts/mo, basic directory listing.
   - Premium tier: unlimited posts, featured placement, analytics, sponsored challenges, multi-location, verified badge priority.
   - Stripe Checkout + Customer Portal, webhook to `business_subscriptions`.
9. **Discovery & SEO** — public profile pages indexable, JSON-LD `LocalBusiness`, sitemap, OG/Twitter cards.
10. **Admin & Moderation** — admin panel for verification approvals, reports, takedowns, audit logs.
11. **Cross-App Integration Contracts** — exact endpoints, token format, payload shapes for: directory mirror, sponsored challenges, buddy/message bridge, deep links.
12. **Security & Compliance** — RLS patterns, rate limiting, file upload validation, GDPR data export/delete, business verification document handling.
13. **Notifications** — email (Resend), in-app, optional push (FCM) — event matrix.
14. **Analytics** — profile views, follower growth, post reach, message response rate, sponsored challenge ROI.
15. **Roadmap & Phasing**
   - Phase 0 (week 1): project scaffold, auth, schema, RLS.
   - Phase 1 (weeks 2–3): profile, posts, directory, map.
   - Phase 2 (weeks 4–5): messaging + buddies + cross-app bridge.
   - Phase 3 (week 6): Stripe + premium gating + sponsored challenges.
   - Phase 4 (week 7): admin, moderation, analytics, polish, launch.
16. **Open Questions & Risks** — verification SLA, cross-Supabase auth bridge approach, content moderation scale, payout model for sponsorships.
17. **Appendix** — full table DDL sketches, RLS policy examples, edge function list, env vars.

## How it will be produced

- Use the bundled `docx` skill (`docx-js`) to generate the file programmatically with proper heading styles, TOC, tables for data model and event matrices, and footer page numbers.
- Validate the output and save to `/mnt/documents/FishX-Business-Plan.docx` so the user can download it.

## Out of scope

- No source code, migrations, edge functions, or routes are added to this project.
- No new Supabase project is provisioned.
