// Generador de IDs opacos para el cliente (EGC-10). Usa `crypto.randomUUID` cuando
// está disponible (browser/WebView/Node modernos) y cae a un id pseudo-único si no.
// Sólo para identificadores locales (usuario mock offline, id de resultado de
// calibración offline); los IDs autoritativos los genera el servidor.
export function genId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Sin Web Crypto: caemos al fallback determinístico-en-el-tiempo.
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
