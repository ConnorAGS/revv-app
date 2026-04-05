---
name: Tech App — Available Jobs Feed & Dispatch Model
description: First-to-accept job feed, geo-filtering, estimated repair time roadmap
type: project
---

## Available Jobs Feed
Techs see open (unassigned) jobs within 25 miles of their location. First tech to tap "Accept" gets the job — it disappears from everyone else's feed instantly.

**Why first-to-accept over bidding:** Early stage, speed matters, customers want fast confirmation. Admin can still override. Phase 4 AI dispatch will eventually replace this mechanic.

## Estimated Repair Time — 3 Stages
1. **Now:** Admin manually sets estimated duration (minutes) per booking. Already have `estimated_duration_minutes` column on bookings.
2. **Phase 3 (Book of hours):** Auto-calculate from clock in/out history per service type.
3. **Phase 4 (AI):** Factor in vehicle make/model and which tech is doing it.

## Job Card Display (available feed)
Each available job shows: service type, estimated duration, price, distance away, address. Techs can accept directly from the card.

## Admin Override
Admin can always manually assign a job regardless of who accepted. Available jobs feed is a convenience layer, not a hard lock.

## How to apply
When building dispatch or scheduling features, default to first-to-accept. Build the book-of-hours data collection (clock in/out already done) before attempting AI estimates.
