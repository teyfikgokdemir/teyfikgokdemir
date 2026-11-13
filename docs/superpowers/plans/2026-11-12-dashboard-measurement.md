# Cansu Dashboard Measurement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace false zero/placeholder overview cards with live GA4, Clarity, and Cloudflare measurements.

**Architecture:** Reuse the existing API payloads and source loader. Render source summaries after successful loads and correct the Cloudflare payload property read.

**Tech Stack:** Astro 7.4.7, browser JavaScript, Cloudflare Pages Functions, Node tests

**Spec:** `docs/superpowers/specs/2026-11-12-dashboard-measurement-design.md`

## Global Constraints

- No analytics collection, consent, credential, API, layout, or site-content changes.
- Continue reporting exactly six active sites.
- Escape all source-provided labels before writing HTML.

## Review Focus

- Zero values remain valid and do not become placeholders.
- Disconnected sites do not outrank connected sites.
- GA4 ranking uses seven-day sessions.
- Clarity ranking uses 24-hour sessions.
- Partial Clarity API success still renders successful sites.

---

### Task 1: Correct Cloudflare overview values

**Files:**
- Modify: `tests/counter.test.mjs`
- Modify: `src/pages/cansu.astro`

- [x] Add an assertion for `cloudflare.last24h.requests` and absence of `requests24h`.
- [x] Run the focused test and verify failure.
- [x] Correct sorting and rendering paths.
- [x] Re-run the focused test.

### Task 2: Render GA4 and Clarity overview summaries

**Files:**
- Modify: `scripts/check-clarity-status.mjs`
- Modify: `src/scripts/cansu-portfolio.js`

- [x] Add failing assertions for GA4 and Clarity top-three cards.
- [x] Implement escaped source-summary rendering after each API load.
- [x] Run focused scripts, analytics checks, counter tests, and build.
- [x] Commit the focused change.
