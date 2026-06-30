# Store submission runbook — CiberSec Edugame (EGC-15)

End-to-end checklist for submitting CiberSec Edugame to the **App Store
Connect** (iOS) and **Google Play Console** (Android). It extends
`docs/zero-trust-audit.md` §5 (local Xcode/Android Studio prerequisites) into a
full submission flow.

**Scope of this document:** the steps below are **HOTL (human-operated)**. They
require macOS + Xcode (iOS), Android Studio (Android), Apple Developer / Google
Play accounts, and signing credentials — none of which exist in the agent CI
environment. The agent deliverables for EGC-15 (privacy policy, store-listing
metadata, the 1024 App Store icon, and this runbook) are complete and merged;
everything in this runbook is the remaining HOTL residue.

There is **no automated-delivery tooling** in the repo (no `fastlane`,
`Appfile`, `Matchfile`, or CI upload pipeline — confirmed by filesystem scan).
Upload is fully manual.

## 0. Agent deliverables already landed (context)

- [x] `public/privacy-policy.html` — COPPA/GDPR-K policy (minor-inclusive interpretation).
- [x] `docs/store-listing.md` — ES/EN copy, keywords, Privacy-Nutrition + Data-Safety answers, age-rating reasoning.
- [x] `public/icons/appstore-1024.png` — 1024×1024 App Store marketing icon, RGB (no alpha).
- [x] `docs/store-submission-runbook.md` — this checklist.
- [x] Verified `capacitor.config.ts` identifiers (`com.panrules.edugame` / `CiberSec Edugame` / `webDir: dist-mobile`) and `package.json` Capacitor scripts (`build:mobile`, `cap:sync`, `cap:ios`, `cap:android`, `cap:open:ios`, `cap:open:android`).

## 1. Native project scaffolding (BLOCKS AC#1) — owner: PDE

The `ios/` and `android/` projects **do not exist in the repo** and were never
committed (assigned to PDE "antes de EGC-10" in `zero-trust-audit.md` §5 but
never landed). Nothing downstream can build a binary until this is done.

- [ ] `npx cap add ios` (once, on macOS) + commit `ios/`.
- [ ] `npx cap add android` (once) + commit `android/`.
- [ ] `cd ios && pod install --repo-update` + commit `Podfile.lock` (macOS).
- [ ] `npm run cap:sync` to build `dist-mobile` and copy the web bundle into both native projects.

See `docs/zero-trust-audit.md` §5 for the full local-prerequisites tables
(Xcode 15+, CocoaPods ≥ 1.14, JDK 17, Android Studio, `ANDROID_HOME`).

## 2. Signing (BLOCKS AC#1) — owner: FA + PDE / DevOps

- [ ] iOS: in Xcode → Signing & Capabilities, assign Apple Developer Team and Bundle ID `com.panrules.edugame`.
- [ ] iOS: create the App Store distribution provisioning profile.
- [ ] Android: create a production upload keystore; configure `signingConfigs` in `android/app/build.gradle` (keep the keystore + passwords out of version control).

## 3. Build & upload binaries (BLOCKS AC#1) — owner: PDE

- [ ] iOS: in Xcode, Product → Archive, then distribute via Organizer/Transporter to App Store Connect.
- [ ] Android: build a signed AAB (`./gradlew bundleRelease`) and upload it in Play Console → Production (or an internal-testing track first).

## 4. Store listing entry (BLOCKS AC#2 reference + AC#3) — owner: PDE + Marketing

Use `docs/store-listing.md` as the source for all text fields.

- [ ] App Store Connect: create the app record (Bundle ID `com.panrules.edugame`), fill Name/Subtitle/Keywords/Description/Promotional text.
- [ ] Play Console: create the app, fill app name, short + full description, category (Education).
- [ ] Upload the 1024×1024 App Store icon (`public/icons/appstore-1024.png`).
- [ ] Capture and upload screenshots per device class (iPhone 6.7"/6.5", iPad 12.9", Android phone + tablet) — requires running native builds on simulators/devices.
- [ ] Play: upload the feature graphic (1024×500).

## 5. Privacy answers & age rating (BLOCKS AC#2 + AC#3) — owner: PDE + Legal

- [ ] App Store Connect: fill the Privacy "Nutrition Label" using the table in `docs/store-listing.md` (email + progress = linked to identity, no tracking, no sharing).
- [ ] Play Console: fill the Data-Safety form using the table in `docs/store-listing.md`.
- [ ] Resolve the COPPA audience-scope decision (Open question #1) and pick the age-rating path (A: 4+/Everyone with parental consent, or B: 12+/Everyone 10+).
- [ ] Complete the IARC/age-rating questionnaire accordingly (declare push usage; declare free / no in-app purchases).

## 6. Privacy policy hosting (BLOCKS AC#2) — owner: PDE

- [ ] Host `public/privacy-policy.html` at a public, reachable URL (e.g. GitHub Pages under `/panrules-gameos/privacy-policy.html`, Cloudflare Pages, or a dedicated domain — Open question #4).
- [ ] Set that URL as `[POLICY_URL]` in both store listings.

## 7. PDE sign-off & submit (BLOCKS AC#3) — owner: PDE

- [ ] PDE reviews that all assets (icon, screenshots, description, age rating) are complete and consistent.
- [ ] Submit for review on both stores in S15 (to absorb Apple's 1–7 business-day and Google's 1–3 day review buffers).

## HOTL placeholders to resolve before submission

These appear in `public/privacy-policy.html` and/or `docs/store-listing.md` and
must be filled by a human before publishing:

| Placeholder              | Used in                              | Resolved by              |
| ------------------------ | ------------------------------------ | ------------------------ |
| `[ENTITY]`               | privacy policy                       | Legal — legal entity name |
| `[CONTACT_EMAIL]`        | privacy policy, store listing        | PDE — support/privacy contact |
| `[POLICY_URL]`           | privacy policy, store listing        | PDE — hosting URL (step 6) |
| `[EFFECTIVE_DATE]`       | privacy policy                       | PDE — publication date    |
| `[AUTH_BACKEND_PROVIDER]`| privacy policy, store listing        | Architecture — Supabase vs Firebase vs other (Open question #4) |
| `[SUPPORT_URL]`          | store listing                        | PDE / Marketing          |
| `[MARKETING_URL]`        | store listing (optional)             | Marketing                |

## Open questions gating full closure (surface to operator)

1. **COPPA audience scope** — are under-13 users genuinely in scope? Selects the age-rating path and whether the parental-consent flow activates. Legal/product call.
2. **Native scaffolding ownership** — who runs `npx cap add ios/android` (and when) so the binaries can be built? Assigned to PDE in `zero-trust-audit.md` §5 but never landed.
3. **Monetization declaration** — confirm "free, no in-app purchases (yet)" for the Data-Safety and pricing answers (only a `paywall_seen` telemetry event exists; no billing code).
4. **Hosting URL + sub-processor identity** — where is the privacy policy hosted, and which auth/DB backend (Supabase / Firebase / other) is named as `[AUTH_BACKEND_PROVIDER]`?
