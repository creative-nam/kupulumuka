# Project Overview

## Product

**Kupulumuka** — a resilient, hyper-local flood navigation and shelter management platform for Mozambique (Maputo Cidade, Maputo Província, Matola, Boane).

It bridges the gap between national-level flood warnings (INAM, INGD) and block-by-block action: helping citizens find the nearest open shelter, get there via landmark-based directions, and helping communities keep shelter capacity data current.

## Current Phase

This phase builds the **PWA (Progressive Web App)** channel only. The USSD/SMS channel described in the original architecture concept is **deferred**, but the backend and data model are being designed to support it later without a rewrite (see `architecture.md`, "Future-channel compatibility").

## Target Users

1. **Citizens** — smartphone users searching for a shelter during or ahead of a flood. Must not be required to create an account to search.
2. **Community contributors** — citizens who report a shelter (e.g. a church, a compound) or update its live capacity. Enter via phone number, start `unverified`.
3. **Institutional users** — municipal/provincial admins, INGD staff. Enter via whitelisted email domain, auto-`verified`.

## Core User Flows (in scope)

### 1. Anonymous Shelter Search
A citizen opens the PWA (installed or in-browser), selects their province → district → bairro → quarteirão (or types free-text if cached geographic data is loaded), and sees a list of nearby open shelters, sorted Tier 1 (official) before Tier 2 (community), with capacity status and landmark directions. Works fully offline against the cached geographic snapshot; falls back to live data when online.

### 2. Alert Subscription (lightweight)
A citizen can bind their phone number to a `home_quarteirao_id` to receive future flood alerts, without filling out a profile. (Actual SMS delivery is out of scope for this phase — see below — but the subscription record and API should exist, so the USSD/SMS channel can use it later.)

### 3. Shelter Contribution (Community Lane)
A contributor submits a new shelter: name, quarteirão, route description, optional photo/GPS if online. The record is created as `tier: 2`, `uploaded_by: <user>`, owned by that user regardless of verification status.

### 4. Capacity Update
A contributor updates the capacity status (`livre` / `quase_cheio` / `esgotado`) of a shelter they own (`uploaded_by` match), independent of whether they are personally verified.

### 5. Institutional Verification Queue
A municipal admin (auto-verified via email domain) views a queue of `pending` community contributors and approves/rejects them. Approving a contributor cascades their shelters from Tier 2 to Tier 1.

## Out of Scope (this phase)

- **USSD/SMS execution** — the telephony webhook handlers (`/api/ussd`, `/api/sms`) and the actual send/receive integration with a telecom aggregator. The data model and core business logic (search, contribution, verification) are built so this channel can be added later as a thin adapter, not a rewrite.
- **Hydrology/meteorology alert worker** — automatic detection of flood risk from INAM/ARA-Sul bulletins. Alerts in this phase, if built at all, are manually triggered by an admin, not automatically detected.
- **Actual alert message delivery** (SMS dispatch to subscribers) — the subscription *record* is in scope; the delivery pipeline is not.
- **Recovery-phase features** (category 4 of the original hackathon brief: cholera tracking, clean-water mapping, compensation claims) — not part of this build.
- **Native mobile apps** (iOS/Android) — PWA only.
- **Multi-language beyond Portuguese** (English as fallback only, per original brief).
- **Payments or financial flows** of any kind.

## Success Criteria for This Phase

A citizen with no account can, on a slow connection (or offline, if the geographic snapshot is already cached), find a nearby shelter and see how to get there. A contributor can register a shelter and update its capacity, with their submission usable immediately (Tier 2) even before an admin reviews them.
