# Gentle Pulse — Product Requirements

## Problem
Solopreneurs doing everything alone accumulate dozens of repetitive micro-tasks they never consciously notice. The drain is invisible until burnout arrives. There is no lightweight tool that listens to daily frustrations, finds the pattern, and hands back one actionable fix.

## Target User
Tired solopreneur or small-business owner (e.g. Rin, a handmade perfume seller) who wears every hat, has no time for dashboards, and wants to feel less overwhelmed — not more organised.

## Core Objects
- **Check-in** — a single friction moment (mood + free text, any time of day)
- **Sigh Event** — one-tap "something annoyed me" capture with optional follow-up
- **Friction Tag** — AI-generated category, time estimate, repeat flag attached to a check-in
- **Pattern** — aggregated recurrence of a tag category over a 7-day window
- **Suggestion** — one plain-language recommendation tied to a pattern, with time/energy savings

## MVP Must-Haves (v1)
- [ ] Home screen visible without login, seeded with demo data
- [ ] Check-in form: mood picker + text input → persists to DB
- [ ] Sigh Button: one tap logs event; follow-up prompt saves note
- [ ] AI tags every check-in (category, time estimate, repeat flag) — stored with confidence + review_status
- [ ] Pattern aggregation runs after each check-in (top 3 categories, last 7 days)
- [ ] Insight card appears after 5+ check-ins: top drain + one suggestion
- [ ] Suggestion drawer: 4 options (ChatGPT prompt / template / n8n link / ignore)
- [ ] Friction log list showing all user entries + their AI tags
- [ ] All screens handle loading / empty / error states

## Non-Goals (v1)
SOP generator, automation builder, calendar/habit/time tracker, team features, CRM, dashboard charts, voice input, email digest, payments.

## Definition of Done
**Pass:** A first-time visitor opens the app, sees demo check-ins and an insight card, submits one new check-in with text, sees it appear in the friction log with an AI-generated tag within 5 seconds, and can read the suggestion drawer — all without creating an account.
