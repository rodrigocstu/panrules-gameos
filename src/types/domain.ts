// Tipos del dominio del simulador PAN-OS NGFW (T1.5).
//
// El dominio es un caso ideal para tipos discriminados: zonas, App-ID, servicio,
// perfil, tipo de NAT y acción son conjuntos cerrados de literales. Tiparlos hace
// que un valor inválido (un typo como 'UTURN' o 'DNAT+SANT') sea un error de
// compilación, no un bug silencioso en runtime.

// --- Literales del dominio ---
export type ZoneId = 'trust' | 'untrust' | 'dmz' | 'guest';
export type AppId =
  | 'any'
  | 'web-browsing'
  | 'ssl'
  | 'ssh'
  | 'dns'
  | 'ftp'
  | 'ms-rdp'
  | 'unknown-tcp';
export type ServiceId =
  | 'application-default'
  | 'service-http'
  | 'service-https'
  | 'service-rdp'
  | 'any';
export type ProfileId = 'none' | 'default' | 'strict';
// El perfil REQUERIDO por una solución puede además ser 'any' (irrelevante).
export type RequiredProfile = ProfileId | 'any';
export type NatType = 'NONE' | 'SNAT' | 'DNAT' | 'DNAT+SNAT';
export type Action = 'ALLOW' | 'DENY';

export type Lang = 'es' | 'en';

// Texto bilingüe de los niveles (T3.6). Puede ser string (legacy) o { es, en }.
export type LocalizedText = string | Record<Lang, string>;

// --- Estructuras de dominio ---
export interface Zone {
  id: ZoneId;
  label: string;
  color: string;
  ip: string;
}

export interface Option<TId extends string = string> {
  id: TId;
  label: string;
}

// El paquete observado en el ticket (datos de tráfico que el jugador ve).
export interface Packet {
  srcZone: ZoneId;
  dstZone: ZoneId;
  srcIp: string;
  dstIp: string;
  proto: string;
  app: AppId;
}

// La política correcta esperada: la fuente de verdad de la validación.
export interface Solution {
  srcZone: ZoneId;
  dstZone: ZoneId;
  app: AppId;
  service: ServiceId;
  action: Action;
  nat: NatType;
  profile: RequiredProfile;
}

// Una dirección NAT: IP original -> traducida (igual si no se traduce).
export interface NatDirection {
  original: string;
  translated: string;
}

// Bloque NAT del nivel (T2.6): qué traduce la regla NAT del escenario.
export interface NatData {
  type: NatType;
  source: NatDirection;
  destination: NatDirection;
  packetLabel: string;
}

// Resultado de un specialCheck de nivel (hoy solo el nivel 3).
export interface SpecialCheckResult {
  success: boolean;
  msg: string;
}

// Configuración que el jugador arma en el editor de políticas.
export interface PolicyConfig {
  srcZone: ZoneId;
  dstZone: ZoneId;
  app: AppId;
  service: ServiceId;
  action: Action;
  nat: NatType;
  profile: ProfileId;
}

// Un escenario ("ticket") del juego.
export interface Level {
  id: number;
  title: LocalizedText;
  desc: LocalizedText;
  packet: Packet;
  solution: Solution;
  nat: NatData;
  hint: LocalizedText;
  explanation: LocalizedText;
  specialCheck?: (config: PolicyConfig) => SpecialCheckResult;
}

// --- Veredicto del motor ---
export type Outcome = 'allow-win' | 'block-win' | 'failure';

export type ReasonCode =
  | 'OK_ALLOW'
  | 'OK_BLOCK'
  | 'ZONE_MISMATCH'
  | 'APP_MISMATCH'
  | 'SERVICE_MISMATCH'
  | 'ACTION_MISMATCH'
  | 'NAT_MISMATCH'
  | 'PROFILE_MISSING'
  | 'PROFILE_INSUFFICIENT'
  | 'SPECIAL_DROPPED'
  | 'SPECIAL_WARNING'
  | 'SPECIAL_MISMATCH';

export interface Verdict {
  isWin: boolean;
  resultMsg: string;
  finalAction: 'allow' | 'drop';
  terminal: boolean;
  outcome: Outcome;
  reasonCode: ReasonCode;
}
