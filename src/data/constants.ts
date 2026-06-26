// Constantes de dominio del simulador PAN-OS NGFW.
// Datos puros (sin React) consumidos por la UI (dropdowns) y el motor.

import type {
  Zone,
  ZoneId,
  Option,
  AppId,
  ServiceId,
  ProfileId,
  AddressObject,
} from '../types/domain.js';

export const ZONES: Record<ZoneId, Zone> = {
  trust: { id: 'trust', label: 'Trust-L3', color: 'emerald', ip: '10.1.1.0/24' },
  untrust: { id: 'untrust', label: 'Untrust-L3', color: 'blue', ip: '0.0.0.0/0' },
  dmz: { id: 'dmz', label: 'DMZ-L3', color: 'purple', ip: '192.168.50.0/24' },
  guest: { id: 'guest', label: 'Guest-L3', color: 'yellow', ip: '172.16.0.0/24' },
  // v2: nuevas zonas para niveles avanzados
  management: { id: 'management', label: 'Management', color: 'gray', ip: '192.168.1.0/24' },
  iot: { id: 'iot', label: 'IoT', color: 'orange', ip: '10.4.0.0/16' },
  industrial: { id: 'industrial', label: 'Industrial', color: 'red', ip: '172.20.0.0/16' },
};

export const APPS: Option<AppId>[] = [
  { id: 'any', label: 'any' },
  { id: 'web-browsing', label: 'web-browsing (HTTP)' },
  { id: 'ssl', label: 'ssl (HTTPS)' },
  { id: 'ssh', label: 'ssh' },
  { id: 'dns', label: 'dns' },
  { id: 'ftp', label: 'ftp' },
  { id: 'ms-rdp', label: 'ms-rdp (RDP)' },
  { id: 'unknown-tcp', label: 'unknown-tcp' },
  // v2: App-IDs para niveles de infraestructura y comunicaciones
  { id: 'ipsec-esp-udp', label: 'ipsec-esp-udp (VPN)' },
  { id: 'ntp', label: 'ntp (UDP/123)' },
  { id: 'syslog', label: 'syslog (UDP/514)' },
  { id: 'ldap', label: 'ldap (TCP/389)' },
  { id: 'kerberos', label: 'kerberos (TCP-UDP/88)' },
  { id: 'smtp', label: 'smtp (TCP/25)' },
  { id: 'imap', label: 'imap (TCP/143)' },
  { id: 'pop3', label: 'pop3 (TCP/110)' },
  { id: 'snmp', label: 'snmp (UDP/161)' },
  { id: 'tftp', label: 'tftp (UDP/69)' },
  { id: 'msrpc', label: 'msrpc (dynamic ports)' },
  { id: 'office365-base', label: 'office365-base (SaaS)' },
  { id: 'unknown-udp', label: 'unknown-udp' },
];

export const SERVICES: Option<ServiceId>[] = [
  { id: 'application-default', label: 'application-default' },
  { id: 'service-http', label: 'service-http (80)' },
  { id: 'service-https', label: 'service-https (443)' },
  { id: 'any', label: 'any' },
  // v2: servicios de infraestructura y custom
  { id: 'service-dns', label: 'service-dns (TCP/UDP 53)' },
  { id: 'service-smtp', label: 'service-smtp (TCP 25)' },
  { id: 'service-ldap', label: 'service-ldap (TCP 389)' },
  { id: 'service-ldaps', label: 'service-ldaps (TCP 636)' },
  { id: 'service-ntp', label: 'service-ntp (UDP 123)' },
  { id: 'service-syslog', label: 'service-syslog (UDP 514)' },
  { id: 'service-custom-8443', label: 'service-custom-8443 (TCP 8443)' },
  { id: 'service-custom-4443', label: 'service-custom-4443 (TCP 4443)' },
];

export const PROFILES: Option<ProfileId>[] = [
  { id: 'none', label: 'None' },
  { id: 'default', label: 'Default (AV+Vuln)' },
  { id: 'strict', label: 'Strict (URL+Wildfire)' },
  // v2: perfiles granulares por componente
  { id: 'av-only', label: 'AV Only (Antivirus)' },
  { id: 'vuln-only', label: 'Vuln Only (Vulnerability Protection)' },
  { id: 'antispyware-only', label: 'Anti-Spyware Only' },
  { id: 'url-only', label: 'URL Filtering Only' },
  { id: 'wildfire-only', label: 'WildFire Only' },
  { id: 'file-blocking-basic', label: 'File Blocking Basic' },
  { id: 'threat-prevention-full', label: 'Threat Prevention Full (superset)' },
];

// Orden de severidad de perfiles: mayor índice = más cobertura de inspección.
// Usar en el engine para validar "al menos X" perfil.
export const PROFILE_RANK: Record<ProfileId, number> = {
  none: 0,
  'av-only': 1,
  'vuln-only': 1,
  'antispyware-only': 1,
  'file-blocking-basic': 1,
  default: 1,
  'url-only': 2,
  'wildfire-only': 2,
  strict: 2,
  'threat-prevention-full': 3,
};

// ─── Address Objects ──────────────────────────────────────────────────────────
export const ADDRESS_OBJECTS: Record<string, AddressObject> = {
  'addr-web-server': {
    id: 'addr-web-server',
    type: 'ip-netmask',
    value: '192.168.50.10/32',
    tags: ['web', 'dmz'],
  },
  'addr-db-server': {
    id: 'addr-db-server',
    type: 'ip-netmask',
    value: '192.168.50.20/32',
    tags: ['database', 'dmz'],
  },
  'addr-dc': {
    id: 'addr-dc',
    type: 'ip-netmask',
    value: '10.1.1.10/32',
    tags: ['active-directory', 'trust'],
  },
  'addr-panorama': {
    id: 'addr-panorama',
    type: 'ip-netmask',
    value: '192.168.1.5/32',
    tags: ['management'],
  },
  'addr-jump-host': {
    id: 'addr-jump-host',
    type: 'ip-netmask',
    value: '192.168.50.30/32',
    tags: ['jump', 'dmz'],
  },
  'addr-mail-server': {
    id: 'addr-mail-server',
    type: 'fqdn',
    value: 'mail.empresa.local',
    tags: ['email', 'dmz'],
  },
  'group-dmz-servers': {
    id: 'group-dmz-servers',
    type: 'ip-netmask',
    value: '192.168.50.0/24',
    tags: ['dmz'],
  },
  'group-trust-clients': {
    id: 'group-trust-clients',
    type: 'ip-netmask',
    value: '10.1.1.0/24',
    tags: ['trust', 'clients'],
  },
  'edl-tor-exit-nodes': {
    id: 'edl-tor-exit-nodes',
    type: 'ip-netmask',
    value: 'EDL-feed',
    tags: ['threat-intel', 'tor'],
  },
  'edl-known-bad-ips': {
    id: 'edl-known-bad-ips',
    type: 'ip-netmask',
    value: 'EDL-feed',
    tags: ['threat-intel', 'blocklist'],
  },
  'edl-malware-domains': {
    id: 'edl-malware-domains',
    type: 'fqdn',
    value: 'EDL-feed',
    tags: ['threat-intel', 'malware'],
  },
  'addr-iot-gateway': {
    id: 'addr-iot-gateway',
    type: 'ip-netmask',
    value: '10.4.0.1/32',
    tags: ['iot', 'gateway'],
  },
};
