// Tipos del dominio del simulador PAN-OS NGFW (T1.5).
//
// El dominio es un caso ideal para tipos discriminados: zonas, App-ID, servicio,
// perfil, tipo de NAT y acción son conjuntos cerrados de literales. Tiparlos hace
// que un valor inválido (un typo como 'UTURN' o 'DNAT+SANT') sea un error de
// compilación, no un bug silencioso en runtime.

// --- Literales del dominio ---
export type ZoneId = 'trust' | 'untrust' | 'dmz' | 'guest' | 'management' | 'iot' | 'industrial';
export type AppId =
  | 'any'
  | 'web-browsing'
  | 'ssl'
  | 'ssh'
  | 'dns'
  | 'ftp'
  | 'ms-rdp'
  | 'unknown-tcp'
  | 'ipsec-esp-udp'
  | 'ntp'
  | 'syslog'
  | 'ldap'
  | 'kerberos'
  | 'smtp'
  | 'imap'
  | 'pop3'
  | 'snmp'
  | 'tftp'
  | 'msrpc'
  | 'office365-base'
  | 'unknown-udp';
export type ServiceId =
  | 'application-default'
  | 'service-http'
  | 'service-https'
  | 'service-rdp'
  | 'any'
  | 'service-dns'
  | 'service-smtp'
  | 'service-ldap'
  | 'service-ldaps'
  | 'service-ntp'
  | 'service-syslog'
  | 'service-custom-8443'
  | 'service-custom-4443';
export type ProfileId =
  | 'none'
  | 'default'
  | 'strict'
  | 'av-only'
  | 'vuln-only'
  | 'antispyware-only'
  | 'url-only'
  | 'wildfire-only'
  | 'file-blocking-basic'
  | 'threat-prevention-full';
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

// ─── Cert Track System ───────────────────────────────────────────────────────
// Tier de dificultad: F = Fundamentals, N = NGFW Engineer, A = NetSec Architect.
export type LevelTier = 'F' | 'N' | 'A';
export type CertTrack = 'ngfw-engineer' | 'netsec-architect';

// ─── Object Library ──────────────────────────────────────────────────────────
export type AddressObjectId = string; // named object IDs

export type AddressObjectType = 'ip-netmask' | 'fqdn' | 'ip-range' | 'ip-wildcard';

export interface AddressObject {
  id: AddressObjectId;
  type: AddressObjectType;
  value: string;
  tags: string[];
}

export interface AddressGroup {
  id: AddressObjectId;
  members: AddressObjectId[];
  dynamicFilter?: string; // DAG filter expression
}

export interface ExternalDynamicList {
  id: AddressObjectId;
  type: 'ip' | 'domain' | 'url';
  url: string; // para referencia pedagógica, NUNCA se hace fetch en runtime
  updateInterval: 'hourly' | 'daily' | 'weekly';
}

export interface ObjectLibrary {
  addresses?: AddressObject[];
  groups?: AddressGroup[];
  edls?: ExternalDynamicList[];
  tags?: string[];
}

// ─── Security Profile Groups ──────────────────────────────────────────────────
export interface SecurityProfileGroup {
  antivirus?: ProfileId;
  vulnerability?: ProfileId;
  antispyware?: ProfileId;
  urlFiltering?: ProfileId;
  wildfire?: ProfileId;
  fileBlocking?: ProfileId;
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
  // Campos opcionales para los niveles de la v2 (address objects y profile groups).
  srcAddress?: AddressObjectId | 'any';
  dstAddress?: AddressObjectId | 'any';
  profileGroup?: SecurityProfileGroup;
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
  // Campos opcionales v2: address objects y profile groups (backward-compat).
  srcAddress?: string;
  dstAddress?: string;
  profileGroup?: SecurityProfileGroup;
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
  // Campos opcionales de la v2: track curricular y tier de dificultad.
  tier?: LevelTier;
  tracks?: CertTrack[];
  requires?: number[]; // IDs de niveles prerequisito que deben estar completados
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
  | 'SPECIAL_MISMATCH'
  // v2: nuevos reason codes para mecánicas avanzadas.
  | 'ADDRESS_MISMATCH'
  | 'PROFILE_COMPONENT_MISSING'
  | 'DECRYPTION_MISMATCH'
  | 'DESIGN_INCORRECT'
  | 'RULE_ORDER_MISMATCH'
  | 'SHADOW_DETECTED';

export interface Verdict {
  isWin: boolean;
  resultMsg: string;
  finalAction: 'allow' | 'drop';
  terminal: boolean;
  outcome: Outcome;
  reasonCode: ReasonCode;
}

// ─── Policy-Order Engine ──────────────────────────────────────────────────────
export interface PolicyRule extends Omit<PolicyConfig, 'srcZone' | 'dstZone'> {
  id: string;
  // Las zonas en una PolicyRule pueden ser 'any' (wildcard) o una zona específica.
  // PolicyConfig usa ZoneId (sin 'any') porque el jugador siempre elige una zona concreta.
  srcZone: ZoneId | 'any';
  dstZone: ZoneId | 'any';
  disabled?: boolean;
  description?: LocalizedText;
}

export interface OrderedVerdict extends Verdict {
  matchedRuleId: string | null;
  shadowedBy: string | null;
  rulesEvaluated: number;
}

export type ShadowReason =
  | 'superset-source'
  | 'superset-dest'
  | 'superset-app'
  | 'deny-before-allow';

export interface ShadowReport {
  shadowedRuleId: string;
  shadowingRuleId: string;
  reason: ShadowReason;
}

// ─── Architect Design Mechanic ────────────────────────────────────────────────
export type DesignChoiceId = string;

export interface DesignChoice {
  id: DesignChoiceId;
  label: LocalizedText;
  rationale: LocalizedText; // explicación de por qué esta opción es correcta/incorrecta
}

// ─── Decryption Rulebase ──────────────────────────────────────────────────────
export interface DecryptionConfig {
  action: 'decrypt' | 'no-decrypt';
  type: 'ssl-forward-proxy' | 'ssl-inbound-inspection' | 'ssh-proxy';
  profile?: string;
}
