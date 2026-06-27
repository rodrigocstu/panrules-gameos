// MITRE ATT&CK Scenario Mapper (concepto disruptivo 5.2).
//
// Mapa estático { levelId -> MitreTechnique[] } que muestra, al resolver un nivel,
// qué técnica ofensiva de MITRE ATT&CK (Enterprise) acaba de bloquear el control
// PAN-OS configurado. Datos puros, sin backend, sin fetch en runtime.
//
// Solo se mapean los niveles con una correspondencia técnica clara y defendible;
// los niveles sin mapeo simplemente no muestran el panel. Los TID son reales
// (verificables en https://attack.mitre.org/techniques/<TID>/).

import type { LocalizedText } from '../types/domain';

export interface MitreTechnique {
  tactic: string; // nombre de la táctica
  tacticId: string; // TAxxxx
  techniqueId: string; // Txxxx[.yyy]
  techniqueName: string;
  url: string;
  blurb: LocalizedText; // cómo el control configurado mitiga la técnica
}

function url(tid: string): string {
  // T1021.001 -> /techniques/T1021/001/ ; T1190 -> /techniques/T1190/
  const [base, sub] = tid.split('.');
  return sub
    ? `https://attack.mitre.org/techniques/${base}/${sub}/`
    : `https://attack.mitre.org/techniques/${base}/`;
}

const T = (
  tacticId: string,
  tactic: string,
  techniqueId: string,
  techniqueName: string,
  blurb: LocalizedText
): MitreTechnique => ({ tactic, tacticId, techniqueId, techniqueName, url: url(techniqueId), blurb });

export const MITRE_MAP: Record<number, MitreTechnique[]> = {
  1: [
    T('TA0011', 'Command and Control', 'T1105', 'Ingress Tool Transfer', {
      es: 'El perfil de Antivirus sobre el tráfico permitido inspecciona las descargas y bloquea la transferencia de malware hacia el host interno.',
      en: 'The Antivirus profile on allowed traffic inspects downloads and blocks malware transfer to the internal host.',
    }),
  ],
  2: [
    T('TA0001', 'Initial Access', 'T1190', 'Exploit Public-Facing Application', {
      es: 'Publicar el servidor solo vía DNAT a la DMZ limita la superficie expuesta: solo el servicio publicado es alcanzable desde Internet, no toda la red interna.',
      en: 'Publishing the server only via DNAT to the DMZ limits the exposed surface: only the published service is reachable from the Internet, not the whole internal network.',
    }),
  ],
  3: [
    T('TA0011', 'Command and Control', 'T1571', 'Non-Standard Port', {
      es: 'App-ID identifica SSH aunque corra en un puerto no estándar (2222), frustrando el intento de evadir la política usando un puerto atípico.',
      en: 'App-ID identifies SSH even on a non-standard port (2222), defeating the attempt to evade policy by using an atypical port.',
    }),
  ],
  5: [
    T('TA0010', 'Exfiltration', 'T1048', 'Exfiltration Over Alternative Protocol', {
      es: 'Denegar el túnel DNS saliente corta la exfiltración de datos camuflada en consultas DNS hacia un servidor controlado por el atacante.',
      en: 'Denying the outbound DNS tunnel cuts off data exfiltration disguised as DNS queries to an attacker-controlled server.',
    }),
  ],
  8: [
    T('TA0008', 'Lateral Movement', 'T1021.001', 'Remote Services: Remote Desktop Protocol', {
      es: 'Publicar el jump host por DNAT con App-ID ms-rdp controla exactamente qué RDP entra; sin esa regla, RDP expuesto es vía de movimiento lateral.',
      en: 'Publishing the jump host via DNAT with App-ID ms-rdp tightly controls inbound RDP; an exposed RDP would be a lateral-movement vector.',
    }),
  ],
  9: [
    T('TA0010', 'Exfiltration', 'T1048', 'Exfiltration Over Alternative Protocol', {
      es: 'Bloquear FTP saliente por App-ID (en cualquier puerto) impide la fuga de archivos por un canal alternativo no autorizado.',
      en: 'Blocking outbound FTP by App-ID (on any port) prevents file exfiltration over an unauthorized alternative channel.',
    }),
  ],
  10: [
    T('TA0008', 'Lateral Movement', 'T1021.001', 'Remote Services: Remote Desktop Protocol', {
      es: 'El U-Turn NAT permite controlar el RDP interno hacia el jump host de la DMZ manteniendo la inspección de la política, limitando el movimiento lateral.',
      en: 'U-Turn NAT lets you control internal RDP toward the DMZ jump host while keeping policy inspection, limiting lateral movement.',
    }),
  ],
  13: [
    T('TA0010', 'Exfiltration', 'T1048', 'Exfiltration Over Alternative Protocol', {
      es: 'El deny implícito descarta el FTP DMZ→Untrust no autorizado: lo que no se permite explícitamente no sale, cerrando un canal de exfiltración.',
      en: 'The implicit deny drops unauthorized FTP DMZ→Untrust: what is not explicitly allowed does not leave, closing an exfiltration channel.',
    }),
  ],
  22: [
    T('TA0001', 'Initial Access', 'T1189', 'Drive-by Compromise', {
      es: 'El URL Filtering por categoría bloquea sitios maliciosos o de alto riesgo, reduciendo la exposición a compromisos drive-by al navegar.',
      en: 'Category-based URL Filtering blocks malicious or high-risk sites, reducing exposure to drive-by compromise while browsing.',
    }),
  ],
  23: [
    T('TA0011', 'Command and Control', 'T1105', 'Ingress Tool Transfer', {
      es: 'El File Blocking Profile impide la transferencia de tipos de archivo peligrosos, cortando la entrega de herramientas/payloads del atacante.',
      en: 'The File Blocking Profile prevents transfer of dangerous file types, cutting off delivery of attacker tools/payloads.',
    }),
  ],
  24: [
    T('TA0011', 'Command and Control', 'T1090.003', 'Proxy: Multi-hop Proxy', {
      es: 'La EDL de nodos de salida Tor bloquea el tráfico hacia/desde la red de anonimato Tor, frustrando el C2 multi-salto y la ofuscación de origen.',
      en: 'The Tor exit-node EDL blocks traffic to/from the Tor anonymity network, defeating multi-hop C2 and source obfuscation.',
    }),
  ],
  25: [
    T('TA0011', 'Command and Control', 'T1573', 'Encrypted Channel', {
      es: 'El SSL Forward Proxy descifra el tráfico TLS para inspeccionarlo, revelando C2 o exfiltración que se esconde dentro de un canal cifrado.',
      en: 'SSL Forward Proxy decrypts TLS traffic for inspection, exposing C2 or exfiltration hiding inside an encrypted channel.',
    }),
  ],
  26: [
    T('TA0005', 'Defense Evasion', 'T1078', 'Valid Accounts', {
      es: 'La política basada en grupo de User-ID ata el acceso a la identidad real del usuario, dificultando el abuso de cuentas válidas robadas.',
      en: 'User-ID group-based policy ties access to the real user identity, making abuse of stolen valid accounts harder.',
    }),
  ],
  29: [
    T('TA0040', 'Impact', 'T1498', 'Network Denial of Service', {
      es: 'El Zone Protection Profile mitiga el SYN flood antes del rulebase de seguridad, protegiendo la disponibilidad frente a una denegación de servicio de red.',
      en: 'The Zone Protection Profile mitigates SYN floods before the security rulebase, protecting availability against a network denial of service.',
    }),
  ],
  31: [
    T('TA0008', 'Lateral Movement', 'T1021', 'Remote Services', {
      es: 'La micro-segmentación Zero Trust bloquea el tráfico lateral por defecto entre cargas de la DMZ, conteniendo el movimiento entre servicios.',
      en: 'Zero Trust micro-segmentation blocks lateral traffic by default between DMZ workloads, containing movement between services.',
    }),
  ],
  32: [
    T('TA0005', 'Defense Evasion', 'T1078', 'Valid Accounts', {
      es: 'Never-Trust-Always-Verify (User-ID + perfil estricto) verifica identidad y postura en cada acceso, limitando el uso de credenciales válidas comprometidas.',
      en: 'Never-Trust-Always-Verify (User-ID + strict profile) checks identity and posture on every access, limiting use of compromised valid credentials.',
    }),
  ],
};

export function mitreFor(levelId: number): MitreTechnique[] {
  return MITRE_MAP[levelId] ?? [];
}
