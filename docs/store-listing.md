# Store listing metadata — CiberSec Edugame (EGC-15)

Metadata deliverable for the App Store (iOS) and Google Play (Android)
submissions. Identifiers below are the source of truth and **must match
`capacitor.config.ts` verbatim** (verified lines 7–8). App copy is aligned with
the PWA manifest in `vite.config.js` so the store listing and the installed app
agree.

Bracketed tokens (`[LIKE_THIS]`) are HOTL-resolved before submission and are
enumerated in `docs/store-submission-runbook.md`.

## Identifiers (verified against `capacitor.config.ts`)

| Field            | Value                                  | Source                            |
| ---------------- | -------------------------------------- | --------------------------------- |
| App name         | `CiberSec Edugame`                     | `capacitor.config.ts:8`           |
| Bundle / App ID  | `com.panrules.edugame`                 | `capacitor.config.ts:7`           |
| Default language | Spanish (es)                           | PWA manifest `lang` (`vite.config.js`) |
| Theme color      | `#0f172a`                              | `capacitor.config.ts` / manifest  |
| Category         | Education                              | listing decision (educational game) |
| Price            | Free (no in-app purchases — see Open question #3) | brief; `src/types/domain.ts:396` |

## App Store Connect (iOS)

- **Name (30 char max):** `CiberSec Edugame`
- **Subtitle (30 char max):** `Aprende firewalls jugando`
- **Promotional text (170 char max):** `Configura políticas NGFW reales, aprende DNAT/SNAT y domina la lógica de reglas de un firewall de Palo Alto — sin riesgo y a tu ritmo.`
- **Keywords (100 char max, comma-separated):** `firewall,ciberseguridad,NGFW,PAN-OS,NAT,seguridad,red,Palo Alto,certificación,PCNSE`
- **Support URL:** `[SUPPORT_URL]`
- **Marketing URL (optional):** `[MARKETING_URL]`
- **Privacy Policy URL:** `[POLICY_URL]` (hosted copy of `public/privacy-policy.html`)
- **Primary category:** Education · **Secondary category:** Reference

### Description (ES — long)

```
CiberSec Edugame es un simulador educativo de la consola de un firewall NGFW
de Palo Alto. Recibe "tickets" (escenarios reales), configura la política
correcta —zonas, App-ID, servicio, acción y perfil de seguridad—, decide el
tipo de NAT, haz commit y observa cómo el paquete cruza las zonas.

El objetivo pedagógico es entender de verdad DNAT y SNAT y la lógica de
evaluación de reglas de seguridad, con feedback campo por campo. Incluye tres
módulos de Fundamentos (El Portero, La Centralita y Políticas de Red) y un
seguimiento de progreso con rachas de estudio.

Sin publicidad. Sin rastreo de terceros. Telemetría anónima opcional y
desactivada por defecto.
```

### Description (EN — long)

```
CiberSec Edugame is an educational simulator of a Palo Alto NGFW firewall
console. You receive real-world "tickets" (scenarios), configure the correct
policy —zones, App-ID, service, action, and security profile—, choose the NAT
type, commit, and watch the packet cross the zones.

The learning goal is to genuinely understand DNAT and SNAT and the logic of
security-rule evaluation, with field-by-field feedback. It includes three
Fundamentals modules (The Gatekeeper, The Switchboard, and Network Policies)
and progress tracking with study streaks.

No ads. No third-party tracking. Optional anonymous telemetry, off by default.
```

## Google Play (Android)

- **App name (30 char max):** `CiberSec Edugame`
- **Short description (80 char max):** `Simulador educativo de firewall NGFW: aprende políticas, NAT y seguridad de red.`
- **Full description:** reuse the ES long description above (Play allows up to 4000 chars).
- **Application category:** Education
- **Content rating:** see Age-rating section below (IARC questionnaire is filled in Play Console — HOTL).
- **Privacy Policy URL:** `[POLICY_URL]`
- **Support email:** `[CONTACT_EMAIL]`

## Apple Privacy "Nutrition Label" answers

Derived from the audited data inventory (`docs/zero-trust-audit.md` §1) and the
privacy policy. Defensible interpretation; HOTL confirms in App Store Connect.

| Data type                | Collected? | Linked to identity | Used for tracking | Purpose                 |
| ------------------------ | ---------- | ------------------ | ----------------- | ----------------------- |
| Email address            | Yes        | Yes                | No                | App functionality (account) |
| User ID                  | Yes        | Yes                | No                | App functionality (account) |
| Product interaction / progress | Yes  | Yes                | No                | App functionality       |
| Diagnostics (anonymous telemetry) | Optional | No        | No                | Analytics (opt-in, on-device) |
| Advertising data         | No         | —                  | —                 | —                       |
| Location, contacts, financial info | No | —                | —                 | —                       |

- **Tracking:** None. The app does not track users across apps or websites.
- **Data shared with third parties:** None.

## Google Play Data-Safety answers

| Question                                        | Answer                                                        |
| ----------------------------------------------- | ------------------------------------------------------------- |
| Does the app collect or share user data?        | Collects: yes. Shares with third parties: no.                 |
| Personal info — Email address                   | Collected; purpose: Account management; required; encrypted in transit. |
| App activity — Progress / interactions          | Collected; purpose: App functionality / personalization.      |
| Is data encrypted in transit?                   | Yes (HTTPS / TLS).                                            |
| Can users request data deletion?                | Yes — via `[CONTACT_EMAIL]` (account deletion).               |
| Does the app use advertising / third-party analytics SDKs? | No.                                                |
| Does the app collect data from children?        | Governed by the COPPA/GDPR-K stance (see Age-rating). Designed-for-Families considerations apply if under-13 is in scope. |

## Age-rating questionnaire answers

The COPPA audience-scope decision (Open question #1) selects between two
defensible ratings. The privacy policy is authored to the stricter,
minor-inclusive interpretation regardless, so either rating is consistent with
the published policy.

- **Common answers (both paths):** No violence, no sexual content, no profanity,
  no gambling, no user-generated content sharing, no unrestricted web access.
  Push notifications: **declared** (opt-in streak reminders). Monetization:
  **free, no in-app purchases** (pending Open question #3).
- **Path A — 4+ (Apple) / "Everyone" (IARC/Play):** chosen if under-13 users are
  in scope. Activates the Designed-for-Families / parental-consent path in the
  listing flow; the privacy policy's parental-consent section applies.
- **Path B — 12+ (Apple) / "Everyone 10+" (IARC/Play):** chosen if the audience
  is gated to 13+/teens. The educational-reference framing supports a low
  rating without the Designed-for-Families flow.

> HOTL picks Path A or B in App Store Connect / Play Console after the legal/
> product COPPA age-scope decision. Do not hard-code one here.

## Required visual assets (produced HOTL — see runbook)

- App icon: `public/icons/appstore-1024.png` (1024×1024, no alpha) — **delivered
  this task**; PWA/maskable icons under `public/icons/` cover Android adaptive.
- Screenshots per device class (iPhone 6.7"/6.5", iPad 12.9", Android phone/tablet)
  — require running native builds on simulators/devices (HOTL).
- Feature graphic (Play, 1024×500) — HOTL.

## HOTL placeholders to resolve

`[POLICY_URL]`, `[SUPPORT_URL]`, `[MARKETING_URL]`, `[CONTACT_EMAIL]`,
`[ENTITY]`, `[AUTH_BACKEND_PROVIDER]` (shared with the privacy policy). See
`docs/store-submission-runbook.md` for the consolidated list and owners.
