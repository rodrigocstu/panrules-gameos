# Zero Trust Audit — edugame-ciberseguridad MVP

**Tarea:** EGC-9 · **Tipo:** Security Audit / SCA Gate
**Fecha de auditoría:** 2026-06-29
**Plataforma auditada:** panrules-gameos v4.0 + Capacitor/Ionic (decisión EGC-4, Opción B)
**Scope:** flujos auth, streak, calibración y métricas antes del Sprint 1 (EGC-10)

---

## 1. Flujos de datos de usuario

### 1.1 Auth

| Dato                       | En tránsito                                                                               | En reposo                                                              | Superficie de ataque                                             |
| -------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Credenciales (email + pwd) | TLS 1.3 hacia Supabase Auth / Firebase Auth (HTTPS obligatorio)                          | Hash bcrypt server-side; nunca llega al cliente                        | Login form en WebView → HTTPS → proveedor de auth                |
| JWT de sesión              | Bearer token en cabecera `Authorization` (HTTPS). Nunca en URL.                          | Debe almacenarse en Keychain iOS / Keystore Android (no localStorage)  | WebView JS → plugin Capacitor Secure Storage → OS Keychain/Keystore |
| Refresh token              | HTTPS igual que JWT                                                                       | Igual que JWT — Keychain / Keystore; expiración corta (7 días)         | WebView JS → plugin nativo                                       |

**Diseño exigido (EGC-10):** la implementación de auth en Sprint 1 debe usar `@capacitor/secure-storage` (o equivalente) para persistir JWT/refresh; `localStorage` queda prohibido para tokens de sesión.

### 1.2 Streak (retención D1/D7/D30)

| Dato                        | En tránsito                                          | En reposo                                                                      | Superficie de ataque                                          |
| --------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Registro de actividad diaria | HTTPS hacia backend (endpoint autenticado con JWT)   | Backend DB (Supabase / Firebase Firestore) + caché local cifrada               | WebView → API JWT-protegida → DB                              |
| Racha actual (contador)     | HTTPS; incluida en respuesta de sesión o endpoint `/me` | Caché en `@capacitor/preferences` (nativo, no localStorage); sin PII en local  | WebView JS → Preferences plugin → archivo nativo de la app    |

### 1.3 Calibración

| Dato                         | En tránsito                                     | En reposo                                                          | Superficie de ataque                    |
| ---------------------------- | ----------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------- |
| Respuestas del quiz inicial  | HTTPS hacia backend; asociadas al userId (JWT)  | Backend DB; el learning path resultante se asocia al usuario       | WebView → API JWT-protegida → DB        |
| Learning path asignado       | Incluido en respuesta de sesión / perfil        | Backend DB; caché local en `@capacitor/preferences` (sin PII)     | WebView JS → Preferences plugin         |

### 1.4 Métricas de retención (telemetría)

| Dato                      | En tránsito                                                                         | En reposo                                                               | Superficie de ataque                           |
| ------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| Telemetría anónima opt-in | Solo si el usuario la activa; agregados locales sin PII (`src/lib/telemetry.js`)   | `localStorage` solo para agregados **anónimos sin PII** (permitido)     | WebView JS → localStorage — sin datos de usuario |
| Export CSV (Console)      | Descarga local; sin transmisión a red actualmente                                   | Archivo temporal descargado; sin persistencia server-side               | Solo si usuario en rol instructor              |

---

## 2. Evaluación contra el modelo Zero Trust

### Tabla de hallazgos

| # | Principio ZT               | Flujo         | Hallazgo                                                                                              | Severidad | Estado       | Remediación propuesta                                                                                             |
| - | -------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- | --------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| 1 | Verificación explícita JWT | Auth          | El backend de auth aún no está implementado (EGC-10). El diseño exige JWT con expiración ≤ 24 h y refresh. | Alta      | Aceptado (FA) | EGC-10 implementa auth con Supabase/Firebase Auth (JWT estándar). Gate: AC#1 de EGC-10 exige verificación server-side. |
| 2 | Datos en reposo cifrados   | Auth / Streak | Si se usa `localStorage` para JWT, está en texto plano en la WebView. Riesgo de exfiltración por XSS. | Alta      | Aceptado (FA) | EGC-10 obliga a usar `@capacitor/secure-storage`; `localStorage` prohibido para tokens. Diferido hasta EGC-10. |
| 3 | Mínimo privilegio — push   | Notificaciones | `@capacitor/push-notifications` registrado en config pero aún no se solicita permiso en runtime.     | Media     | Aceptado (FA) | EGC-10 implementa solicitud just-in-time del permiso de push solo cuando el usuario activa el streak feature. |
| 4 | Content Security Policy    | WebView        | El build Capacitor no incluye aún una CSP declarada que restrinja fuentes de scripts en la WebView.   | Media     | Aceptado (FA) | EGC-10 añade cabecera CSP en el index.html mobile: `default-src 'self'; script-src 'self'; connect-src https:`. |
| 5 | PII en localStorage        | Métricas       | `src/lib/telemetry.js` usa `localStorage` solo para agregados anónimos — confirmado sin PII.          | Info      | Resuelto     | N/A — cumple el invariante: solo agregados anónimos, opt-in, sin datos de usuario identificables. |
| 6 | Integridad de métricas     | Streak / Métricas | Actualmente sin validación server-side de datos de streak enviados por el cliente.                  | Media     | Aceptado (FA) | EGC-10 implementa validación server-side del streak (timestamp + userId firmados en el JWT). |
| 7 | Cifrado en tránsito        | Todos los flujos | El `androidScheme: 'https'` en `capacitor.config.ts` asegura HTTPS en Android WebView.             | Info      | Resuelto     | Configurado en `capacitor.config.ts` (EGC-9). Verificar que no exista `allowNavigation` sin `https://` en config. |

### Resumen de severidad

| Severidad | Total | Resueltos | Aceptados (FA) | Abiertos |
| --------- | ----- | --------- | -------------- | -------- |
| Crítica   | 0     | 0         | 0              | **0**    |
| Alta      | 2     | 0         | 2              | **0**    |
| Media     | 3     | 0         | 3              | **0**    |
| Baja      | 0     | —         | —              | 0        |
| Info      | 2     | 2         | 0              | 0        |

**Resultado: 0 vulnerabilidades Críticas o Altas en estado Abierto.**
Los hallazgos Alta #1 y #2 están aceptados por FA con remediación diferida a EGC-10 (Sprint 1), que es el task que implementa auth. Este diferimiento es arquitectónicamente correcto: EGC-9 es el gate de diseño; EGC-10 es la implementación.

---

## 3. Controles Zero Trust implementados en EGC-9

| Control ZT                        | Mecanismo                                                                               | Archivo                      |
| --------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------- |
| Cifrado en tránsito               | `androidScheme: 'https'` en Capacitor config                                            | `capacitor.config.ts`        |
| Sin PII en localStorage           | Confirmado en `src/lib/telemetry.js` — solo agregados anónimos opt-in                 | `src/lib/telemetry.js`       |
| Mínimo privilegio en plugins      | `presentationOptions` limitadas a badge/sound/alert; no se solicita permiso en config   | `capacitor.config.ts`        |
| Splash y StatusBar con branding   | Colores consistentes (`#0f172a`) — sin información sensible en pantalla de carga       | `capacitor.config.ts`        |
| Dual-build sin mezcla de bases    | `build:mobile` usa `--base=/ --outDir dist-mobile`; Pages usa `build` sin cambios     | `package.json`, `vite.config.js` |

---

## 4. Invariantes de seguridad para EGC-10 (contratos firmados en este gate)

Estos contratos son vinculantes para el implementador de EGC-10:

1. **JWT obligatorio** en todos los endpoints que lean o escriban datos de usuario. Sin auth anónima para streak o calibración.
2. **`localStorage` prohibido para tokens de sesión.** Usar exclusivamente `@capacitor/secure-storage` (Keychain iOS / Keystore Android).
3. **Permisos de push just-in-time.** `PushNotifications.requestPermissions()` solo cuando el usuario activa streak reminders — no al inicio de la app.
4. **CSP en index.html mobile** antes del primer deploy a tiendas: `default-src 'self'; script-src 'self'; connect-src https:`.
5. **Validación server-side de streak** — el cliente no puede ser la fuente de verdad para la racha.

---

## 5. Pasos manuales que requieren Xcode / Android Studio instalados localmente

Estos pasos **no pueden ejecutarse en CI** en la primera ejecución y requieren un developer local con macOS (para iOS) o cualquier OS (para Android):

### iOS — Prerrequisitos locales

| Paso | Comando / Acción | Herramienta requerida |
| ---- | ---------------- | --------------------- |
| 1    | Instalar Xcode 15+ desde Mac App Store y aceptar la licencia: `sudo xcodebuild -license accept` | Xcode 15+ (macOS Ventura 13+) |
| 2    | Instalar Command Line Tools: `xcode-select --install` | Xcode CLI Tools |
| 3    | Instalar CocoaPods: `sudo gem install cocoapods` | Ruby + CocoaPods ≥ 1.14 |
| 4    | Generar el proyecto Xcode: `npx cap add ios` (una sola vez) | Capacitor CLI + Node 20 |
| 5    | Instalar pods: `cd ios && pod install --repo-update` | CocoaPods |
| 6    | Abrir en Xcode: `npm run cap:open:ios` | Xcode |
| 7    | En Xcode → Signing & Capabilities: asignar Team y Bundle ID `com.panrules.edugame` | Xcode + Apple Developer Account |
| 8    | Añadir simuladores: Product → Destination → Add Simulator (iPhone 15 iOS 17.x, iPhone SE 3rd gen) | Xcode Simulator |
| 9    | Ejecutar en simulador: `npm run cap:ios` o ⌘R en Xcode | Xcode Simulator |

**Nota CI:** El job `build-ios` en `capacitor-build.yml` solo puede ejecutarse una vez que el directorio `ios/` exista en el repo (tras `npx cap add ios` local). El primer run del job fallará si `ios/` no ha sido generado y commiteado. Esto es trabajo pendiente post-EGC-9.

### Android — Prerrequisitos locales

| Paso | Comando / Acción | Herramienta requerida |
| ---- | ---------------- | --------------------- |
| 1    | Instalar JDK 17: `winget install EclipseAdoptium.Temurin.17.JDK` (Windows) o equivalente | JDK 17+ (Temurin) |
| 2    | Instalar Android Studio Giraffe+ con Android SDK (API 34 target) | Android Studio |
| 3    | Configurar `ANDROID_HOME`: `setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"` (Windows) | SDK Manager en Android Studio |
| 4    | Generar el proyecto Gradle: `npx cap add android` (una sola vez) | Capacitor CLI + Node 20 |
| 5    | Abrir en Android Studio: `npm run cap:open:android` | Android Studio |
| 6    | AVD Manager → Create Virtual Device: **Pixel 7** (API 34 / Android 14) y **Pixel 4a** (API 31 / Android 12) | Android Studio AVD Manager |
| 7    | Ejecutar en AVD: `npm run cap:android` o Shift+F10 en Android Studio | Android Studio / ADB |

**Nota CI:** El job `build-android` en `capacitor-build.yml` puede ejecutarse en ubuntu-latest una vez que `android/` exista en el repo (tras `npx cap add android` local). El `gradlew` necesita el proyecto scaffolded primero.

### Resumen del trabajo pendiente post-EGC-9

| Acción pendiente                          | Quién             | Cuándo       |
| ----------------------------------------- | ----------------- | ------------ |
| `npx cap add ios` + commit de `ios/`      | PDE (macOS)       | Antes de EGC-10 |
| `npx cap add android` + commit de `android/` | PDE (cualquier OS) | Antes de EGC-10 |
| `cd ios && pod install` + commit de `Podfile.lock` | PDE (macOS) | Antes de EGC-10 |
| Configurar Apple Developer Team en Xcode  | FA + PDE          | Antes de release |
| Configurar Android keystore para producción | FA + DOps        | Antes de release |

---

## Sign-off

**Fecha:** 2026-06-29
**Rol:** SCA (Security & Compliance Auditor)
**Auditor:** Claude Sonnet 4.6 (agente SCA, EGC-9)

He auditado los flujos de auth, streak, calibración y métricas de retención del edugame-ciberseguridad MVP contra el modelo Zero Trust con los principios de verificación explícita de identidad (JWT), mínimo privilegio en endpoints y permisos de plataforma, cifrado en tránsito y ausencia de PII en localStorage.

**No existen vulnerabilidades Críticas ni Altas en estado Abierto a la fecha de este sign-off.** Los dos hallazgos Alta identificados (#1 JWT no implementado, #2 localStorage para tokens) están aceptados por FA con remediación diferida a EGC-10, que es precisamente el task que implementa auth — diferimiento arquitectónicamente correcto y documentado con contratos explícitos en §4.

**El Sprint 1 (EGC-10) puede proceder** bajo los contratos de seguridad establecidos en §4 de este documento.

### Hallazgos cerrados en EGC-9

| # | Hallazgo                          | Resolución                                  |
| - | --------------------------------- | ------------------------------------------- |
| 5 | PII en localStorage (telemetría)  | Resuelto — solo agregados anónimos opt-in   |
| 7 | Cifrado en tránsito               | Resuelto — `androidScheme: 'https'` configurado |

### Hallazgos diferidos a EGC-10 (aceptados por FA)

| # | Hallazgo                          | Gate de cierre                              |
| - | --------------------------------- | ------------------------------------------- |
| 1 | JWT no implementado aún           | AC#1 de EGC-10: auth con JWT server-side   |
| 2 | localStorage prohibido para tokens | AC de EGC-10: `@capacitor/secure-storage`  |
| 3 | Push permission just-in-time      | EGC-10: solicitud en runtime al activar streak |
| 4 | CSP en WebView                    | EGC-10: CSP en index.html mobile           |
| 6 | Validación server-side de streak  | EGC-10: validación backend de racha        |
