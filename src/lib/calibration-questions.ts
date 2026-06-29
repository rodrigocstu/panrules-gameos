// Banco de preguntas del test de calibración inicial (EGC-10).
//
// Copiado VERBATIM de `docs/calibration-test-design.md` §2 (EGC-3). Son 6 preguntas
// reales de PAN-OS en la frontera Tier F / Tier N del curriculum, 4 opciones (A–D)
// cada una, una sola correcta. El tipo `CalibrationQuestion` proviene de
// `src/types/domain.ts` (bloque EGC-6) y NO se redefine aquí.
//
// Mapeo de tema (`CalibrationTopic`): Q1/Q5 → zones, Q2 → app-id, Q3 → policy-order,
// Q4 → nat-type, Q6 → security-profiles (cubre los 5 temas del modelo EGC-6).
import type { CalibrationQuestion } from '../types/domain';

export const CALIBRATION_QUESTIONS: CalibrationQuestion[] = [
  {
    id: 'q1',
    topic: 'zones',
    prompt: 'En PAN-OS, una zona de seguridad es:',
    options: [
      { id: 'A', text: 'Una VLAN configurada en el switch de acceso' },
      {
        id: 'B',
        text: 'Un agrupador lógico de interfaces al que se aplican políticas de seguridad',
      },
      { id: 'C', text: 'Un rango de IPs reservado para servidores críticos' },
      { id: 'D', text: 'Un perfil de amenazas aplicado a una interfaz' },
    ],
    correctOptionId: 'B',
  },
  {
    id: 'q2',
    topic: 'app-id',
    prompt:
      'En una Security Rule de PAN-OS, ¿cuál es la diferencia entre App-ID y el campo Service?',
    options: [
      {
        id: 'A',
        text: 'App-ID identifica la aplicación por comportamiento; Service define el puerto TCP/UDP',
      },
      { id: 'B', text: 'Son sinónimos: ambos controlan qué aplicación puede pasar' },
      { id: 'C', text: 'Service identifica la aplicación; App-ID controla el puerto permitido' },
      { id: 'D', text: 'App-ID aplica solo en tráfico cifrado; Service aplica en tráfico en claro' },
    ],
    correctOptionId: 'A',
  },
  {
    id: 'q3',
    topic: 'policy-order',
    prompt: 'Al final de toda Security Policy de PAN-OS existe una regla implícita. ¿Qué hace?',
    options: [
      { id: 'A', text: 'Permite el tráfico entre zonas del mismo tipo (intrazone)' },
      {
        id: 'B',
        text: 'Registra en log todo el tráfico que no coincidió con ninguna regla explícita',
      },
      {
        id: 'C',
        text: 'Deniega silenciosamente todo el tráfico que no coincidió con ninguna regla, sin generar log por defecto',
      },
      { id: 'D', text: 'Redirige el tráfico no permitido a la zona de cuarentena' },
    ],
    correctOptionId: 'C',
  },
  {
    id: 'q4',
    topic: 'nat-type',
    prompt:
      'Un servidor web interno (IP 192.168.1.10) debe ser accesible desde Internet en la IP pública 203.0.113.5. ¿Qué tipo de NAT configuras?',
    options: [
      { id: 'A', text: 'SNAT — para traducir la IP pública de entrada a la IP privada del servidor' },
      { id: 'B', text: 'DNAT — para traducir la IP destino pública a la IP privada del servidor' },
      { id: 'C', text: 'SNAT — para traducir la IP privada del servidor a la IP pública al salir' },
      { id: 'D', text: 'No se necesita NAT; se usa una ruta estática al servidor' },
    ],
    correctOptionId: 'B',
  },
  {
    id: 'q5',
    topic: 'zones',
    prompt:
      '¿Cuál es la diferencia funcional entre las zonas Trust y Untrust en un firewall PAN-OS típico?',
    options: [
      { id: 'A', text: 'Trust solo acepta tráfico cifrado; Untrust acepta tráfico en claro' },
      {
        id: 'B',
        text: 'Trust agrupa las redes internas de confianza; Untrust representa redes externas no confiables (normalmente Internet)',
      },
      { id: 'C', text: 'Trust y Untrust son nombres decorativos; no afectan la política de seguridad' },
      { id: 'D', text: 'Untrust permite todo el tráfico por defecto; Trust lo deniega todo' },
    ],
    correctOptionId: 'B',
  },
  {
    id: 'q6',
    topic: 'security-profiles',
    prompt: 'En una Security Rule con acción ALLOW, ¿para qué sirve un Security Profile?',
    options: [
      { id: 'A', text: 'Para cifrar el tráfico permitido mediante TLS en el propio firewall' },
      { id: 'B', text: 'Para registrar qué usuario inició la sesión permitida' },
      { id: 'C', text: 'Para definir qué zonas puede cruzar el tráfico autorizado' },
      {
        id: 'D',
        text: 'Para inspeccionar el contenido del tráfico permitido en busca de amenazas (virus, exploits, URLs maliciosas, etc.)',
      },
    ],
    correctOptionId: 'D',
  },
];

/** Número total de preguntas del test (6). */
export const CALIBRATION_TOTAL = CALIBRATION_QUESTIONS.length;
