// Almacén persistente consciente del canal (EGC-10, invariante ZT §4.2).
//
// Canal web (GitHub Pages): no existe Keychain en el browser, así que los datos viven
// en `localStorage` bajo claves `egc_*` (decisión de refinamiento de la tarea). Canal
// nativo (Capacitor iOS/Android): se usa `@capacitor/preferences`, que persiste fuera
// del DOM y nunca expone los tokens al `localStorage` de la WebView — esto cumple el
// invariante 2 ("localStorage prohibido para tokens en el canal nativo") y mantiene la
// PII mínima (email del perfil) fuera del almacenamiento de la WebView. El upgrade a
// Keychain/Keystore real (plugin de comunidad) es hardening post-MVP.
//
// El plugin nativo se importa dinámicamente sólo en la rama nativa, de modo que el
// bundle web y los tests jamás cargan `@capacitor/preferences`.
import { Capacitor } from '@capacitor/core';

export const ACCESS_TOKEN_KEY = 'egc_access_token';
export const REFRESH_TOKEN_KEY = 'egc_refresh_token';

function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    // En SSR/entornos sin el bridge Capacitor asumimos canal web.
    return false;
  }
}

/** Lee un valor del almacén del canal activo (preferences nativo / localStorage web). */
export async function storageGet(key: string): Promise<string | null> {
  if (isNative()) {
    const { Preferences } = await import('@capacitor/preferences');
    const { value } = await Preferences.get({ key });
    return value ?? null;
  }
  try {
    return localStorage.getItem(key);
  } catch {
    // localStorage bloqueado (incógnito): degradamos a "sin valor".
    return null;
  }
}

/** Escribe un valor en el almacén del canal activo. */
export async function storageSet(key: string, value: string): Promise<void> {
  if (isNative()) {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key, value });
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage bloqueado: el valor sólo vive en memoria esta sesión.
  }
}

/** Elimina un valor del almacén del canal activo. */
export async function storageRemove(key: string): Promise<void> {
  if (isNative()) {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.remove({ key });
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // Sin almacenamiento: nada que limpiar.
  }
}

export function getAccessToken(): Promise<string | null> {
  return storageGet(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): Promise<string | null> {
  return storageGet(REFRESH_TOKEN_KEY);
}

export async function setTokens(accessToken: string, refreshToken?: string): Promise<void> {
  await storageSet(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken !== undefined) {
    await storageSet(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function clearTokens(): Promise<void> {
  await storageRemove(ACCESS_TOKEN_KEY);
  await storageRemove(REFRESH_TOKEN_KEY);
}
