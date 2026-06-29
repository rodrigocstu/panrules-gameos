import { Home, BookOpen, Flame, User, type LucideIcon } from 'lucide-react';

export type BottomNavTab = 'home' | 'modulos' | 'streak' | 'perfil';

export interface BottomNavProps {
  /** Currently active tab — defaults to 'home' */
  activeTab?: BottomNavTab;
  /** Called when the user selects a tab */
  onTabChange?: (tab: BottomNavTab) => void;
  /** Extra Tailwind classes on the root nav element */
  className?: string;
}

interface TabDef {
  id: BottomNavTab;
  label: string;
  Icon: LucideIcon;
}

const TABS: TabDef[] = [
  { id: 'home',    label: 'Inicio',  Icon: Home },
  { id: 'modulos', label: 'Módulos', Icon: BookOpen },
  { id: 'streak',  label: 'Racha',   Icon: Flame },
  { id: 'perfil',  label: 'Perfil',  Icon: User },
];

/**
 * NORA Design System — BottomNav.
 * Mobile-first fixed bottom navigation bar with 4 tabs.
 * Uses role="navigation" + aria-current="page" for accessibility.
 * Keyboard-navigable; each tab meets the 44 px touch target minimum.
 */
export function BottomNav({ activeTab = 'home', onTabChange, className = '' }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className={[
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-white border-t border-neutral-200',
        'flex items-stretch',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="ui-bottom-nav"
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onTabChange?.(id)}
            className={[
              'flex-1 flex flex-col items-center justify-center gap-0.5',
              'min-h-touch py-2 px-1',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-inset focus-visible:ring-primary',
              isActive ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <Icon size={22} aria-hidden="true" />
            <span className="text-mobile-xs font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
