// HomeScreen — overview del track "Fundamentos" (EGC-19).
//
// Punto de entrada navegable del track autenticado: tres tarjetas (El Portero / La Centralita /
// Políticas de Red) con el progreso real leído de localStorage y un CTA por módulo a su ruta
// propia (firewall/nat/policy). Reemplaza el antiguo montaje directo de FirewallModule en 'home'
// (EGC-11), dando un overview y un punto de retorno tras completar cada módulo — cierra los
// callejones sin salida del track (AC#1) y cumple AC#4.
//
// Modelo open-access (decisión de planificación EGC-19): los CTA navegan SIEMPRE, sin bloqueo por
// completitud previa — coherente con la filosofía no-bloqueante del proyecto y con que las rutas
// nat/policy ya eran navegables sin gate de completitud.
//
// Lectura de progreso: replica el patrón read-only `loadCompleted()` de los hooks de módulo
// (src/hooks/useFirewallModule.ts) — `JSON.parse` con `try/catch`, extrayendo `parsed.completed`
// (array de números) con la misma guarda de forma. NO escribe localStorage ni se acopla con los
// hooks (lectura directa de la clave); degrada a 0/N ante clave ausente, JSON corrupto o storage
// bloqueado (incógnito).
import { BookOpen, CheckCircle } from 'lucide-react';
import { Badge, Button, Card, ProgressBar } from '../ui';
import { navigateTo } from '../../hooks/useHashRoute.js';

type TrackRoute = 'firewall' | 'nat' | 'policy';

interface ModuleCardDef {
  route: TrackRoute;
  name: string;
  blurb: string;
  storageKey: string;
  /** Totales por módulo: coinciden con FIREWALL_LEVELS.length (9), NAT_LEVELS.length (6) y
   *  POLICY_LEVELS.length (9). Constantes locales para no acoplar HomeScreen a los hooks. */
  total: number;
}

const MODULES: ModuleCardDef[] = [
  {
    route: 'firewall',
    name: 'El Portero',
    blurb: 'Reglas de seguridad: zonas, App-ID, servicio y acción.',
    storageKey: 'egc_firewall_progress',
    total: 9,
  },
  {
    route: 'nat',
    name: 'La Centralita',
    blurb: 'SNAT, DNAT y el U-Turn que más confunde a todos.',
    storageKey: 'egc_nat_progress',
    total: 6,
  },
  {
    route: 'policy',
    name: 'Políticas de Red',
    blurb: 'Orden de reglas y shadowing entre políticas.',
    storageKey: 'egc_policy_progress',
    total: 9,
  },
];

/** Niveles completados de un módulo, leídos read-only de localStorage. Degrada a 0 ante clave
 *  ausente, JSON corrupto o storage inaccesible — mismo contrato que `loadCompleted()`. */
function countCompleted(storageKey: string): number {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return 0;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { completed?: unknown }).completed)
    ) {
      return (parsed as { completed: unknown[] }).completed.filter((n) => typeof n === 'number')
        .length;
    }
    return 0;
  } catch {
    return 0;
  }
}

function ctaLabel(completed: number, done: boolean): string {
  if (done) return 'Repasar';
  if (completed > 0) return 'Continuar';
  return 'Empezar';
}

export function HomeScreen() {
  return (
    <section className="flex flex-col gap-4 p-4" aria-labelledby="home-title">
      <header className="flex items-center gap-2">
        <BookOpen size={24} className="text-primary" aria-hidden="true" />
        <h1 id="home-title" className="text-mobile-xl font-bold text-neutral-900">
          Track Fundamentos
        </h1>
      </header>
      <p className="text-mobile-sm text-neutral-600">
        Tres módulos para dominar las políticas de PAN-OS. Avanza a tu ritmo.
      </p>

      {MODULES.map((m) => {
        const completed = countCompleted(m.storageKey);
        const done = completed >= m.total;
        return (
          <Card
            key={m.route}
            className="flex flex-col gap-3"
            aria-label={`${m.name}: ${completed} de ${m.total} niveles completados`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-mobile-lg font-bold text-neutral-900">{m.name}</h2>
              {done && (
                <Badge variant="success">
                  <CheckCircle size={14} aria-hidden="true" className="mr-1 inline-block" />
                  Completado
                </Badge>
              )}
            </div>
            <p className="text-mobile-sm text-neutral-700">{m.blurb}</p>
            <ProgressBar
              value={completed}
              max={m.total}
              color={done ? 'success' : 'primary'}
              label={`Progreso de ${m.name}`}
            />
            <p className="text-mobile-xs text-neutral-500">
              {completed}/{m.total} niveles
            </p>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => navigateTo(m.route)}
            >
              {ctaLabel(completed, done)}
            </Button>
          </Card>
        );
      })}
    </section>
  );
}

export default HomeScreen;
