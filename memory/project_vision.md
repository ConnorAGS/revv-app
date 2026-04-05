---
name: Revv - Project Vision & Architecture
description: Core vision, target market, feature roadmap, and 5-phase build plan for the Revv mobile auto repair SaaS
type: project
---

Revv is a mobile auto repair SaaS targeting the exploding mobile repair market (shop owners are aging boomers, high barrier to open shops).

**Target jobs:** Lower-end, faster, one-day jobs — brakes, oil change, tires, battery, etc.
**Avg ticket:** ~$585
**Partner model:** Refer bigger jobs to AAMCO, take 10% referral fee.

## Current State (as of April 2026)
- Next.js + Supabase connected and working
- Booking form live (`/book`) — saves to `bookings` table
- Admin dashboard live (`/admin`) — jobs list, assign tech, update status
- Basic home page at `/`
- Missing: email confirmation (Resend), Vercel deploy

## 5-Phase Build Roadmap

### Phase 1 — Foundation + first booking (Weeks 1–3) — MOSTLY DONE
- [x] Next.js + Supabase connected
- [x] Booking form (vehicle, service, address)
- [x] Admin dashboard — jobs list, assign tech, status updates
- [ ] Email confirmation to customer on booking (Resend)
- [ ] Deployed to Vercel
**Goal:** Take a real booking and see it in the dashboard.

### Phase 2 — Tech app + job management (Weeks 4–7)
- Tech login — each tech has their own mobile browser view
- Daily job list with address, vehicle, job type, estimated time
- Job detail page — checklist, parts needed, customer notes
- Clock in / clock out tied to job (timestamps saved to DB)
- Photo upload — before/after attached to job record
- Mark job complete → triggers customer SMS update via Twilio
**Tools:** Supabase Auth, Twilio SMS, Supabase Storage (photos), Google Maps (directions link)
**Goal:** A real tech can run their whole day from their phone.

### Phase 3 — Scheduling, invoicing + payments (Weeks 8–12)
- Geo scheduling — assign jobs to closest available tech using Maps API
- Stripe invoice — auto-generated at job completion, sent to customer
- Customer payment page — pay invoice via link on phone
- Parts request flow — tech flags needed parts, syncs to admin dashboard
- Book of hours — record actual job duration vs estimate, build the dataset
**Tools:** Stripe, Google Maps API, Supabase Edge Functions, Twilio (payment link SMS)
**Goal:** Full job lifecycle: book → dispatch → complete → invoice → paid.

### Phase 4 — AI layer (Weeks 13–18)
- AI booking agent — chat widget on website, qualifies job, books slot
- AI dispatch — looks at tech locations + book of hours, recommends assignment
- Upsell detection — flags likely add-ons per vehicle history
- AI CRM summaries — customer history at a glance before each job
- Customer job tracker page — real-time status with SMS pings (Domino's style)
**Tools:** Claude API, Supabase Realtime (live tracker), Twilio (status SMS)
**Goal:** The system runs itself for 80% of jobs. You manage exceptions, not the whole flow.

### Phase 5 — SaaS multi-tenancy (Month 5+)
- Multi-tenant architecture — each shop gets isolated data + custom subdomain
- Onboarding flow — a new shop can set up in under 30 minutes
- Stripe billing — monthly SaaS subscription per shop
- White-label option — shops use their own branding on customer-facing pages
**Goal:** Sell the platform to other shops. Every feature is battle-tested before you sell it.
