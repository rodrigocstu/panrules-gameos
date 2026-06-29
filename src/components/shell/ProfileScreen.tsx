// ProfileScreen — vista mínima de perfil (EGC-10).
//
// Ruta protegida `/profile`: muestra los datos básicos de la sesión (email, learning path,
// racha) y permite cerrar sesión. Sin PII más allá del email (PII mínima, architecture §4).
import type { UserProfile } from '../../types/domain';
import { Button, Card, Badge } from '../ui';
import { useStreak } from '../../hooks/useStreak';

const PATH_LABEL: Record<UserProfile['learningPath'], string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export interface ProfileScreenProps {
  user: UserProfile;
  onLogout: () => void;
}

export function ProfileScreen({ user, onLogout }: ProfileScreenProps) {
  const { streak } = useStreak();

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <h1 className="text-mobile-xl font-bold text-neutral-900">Tu perfil</h1>

      <Card aria-label="Datos de la cuenta" className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-mobile-sm text-neutral-500">Email</span>
          <span className="text-mobile-sm font-medium">{user.email}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-mobile-sm text-neutral-500">Camino</span>
          <Badge variant={user.learningPath === 'beginner' ? 'success' : 'primary'}>
            {PATH_LABEL[user.learningPath]}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-mobile-sm text-neutral-500">Racha actual</span>
          <span className="text-mobile-sm font-medium tabular-nums">
            {streak?.currentStreak ?? 0} día(s)
          </span>
        </div>
      </Card>

      <Button variant="secondary" className="w-full" onClick={onLogout}>
        Cerrar sesión
      </Button>
    </div>
  );
}

export default ProfileScreen;
