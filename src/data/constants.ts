// Constantes de dominio del simulador PAN-OS NGFW.
// Datos puros (sin React) consumidos por la UI (dropdowns) y el motor.

import type { Zone, ZoneId, Option, AppId, ServiceId, ProfileId } from '../types/domain.js';

export const ZONES: Record<ZoneId, Zone> = {
  trust: { id: 'trust', label: 'Trust-L3', color: 'emerald', ip: '10.1.1.0/24' },
  untrust: { id: 'untrust', label: 'Untrust-L3', color: 'blue', ip: '0.0.0.0/0' },
  dmz: { id: 'dmz', label: 'DMZ-L3', color: 'purple', ip: '192.168.50.0/24' },
  guest: { id: 'guest', label: 'Guest-L3', color: 'yellow', ip: '172.16.0.0/24' },
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
];

export const SERVICES: Option<ServiceId>[] = [
  { id: 'application-default', label: 'application-default' },
  { id: 'service-http', label: 'service-http (80)' },
  { id: 'service-https', label: 'service-https (443)' },
  { id: 'any', label: 'any' },
];

export const PROFILES: Option<ProfileId>[] = [
  { id: 'none', label: 'None' },
  { id: 'default', label: 'Default (AV+Vuln)' },
  { id: 'strict', label: 'Strict (URL+Wildfire)' },
];
