/// <reference types="vite/client" />

// Tipado de las variables de entorno Vite que consume el frontend (EGC-10).
// `VITE_API_URL` vacío ⇒ modo offline-first (sin llamadas de red); ver
// `src/services/api.ts`. `VITE_TUTOR_URL` es el worker opcional del Policy Tutor.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_TUTOR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
