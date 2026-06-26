import { useState, useCallback } from 'react';

// Gestiona cohorts de instructor persistidos en localStorage (sin backend).
// Un cohort = { id, name, track, createdAt }. El track asignado determina qué
// conjunto de niveles ve el grupo (ngfw-engineer / netsec-architect).
const STORAGE_KEY = 'panrules-gameos:cohorts:v1';

export function loadCohorts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // localStorage no disponible o JSON corrupto.
    return [];
  }
}

function saveCohorts(cohorts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts));
  } catch {
    // Silencioso: la consola sigue funcionando en memoria.
  }
}

// Contador monótono para evitar colisiones de id dentro del mismo milisegundo.
let counter = 0;
export function makeCohortId() {
  counter += 1;
  return `cohort-${Date.now()}-${counter}`;
}

export function useCohorts() {
  const [cohorts, setCohorts] = useState(loadCohorts);

  const addCohort = useCallback((name, track) => {
    setCohorts((prev) => {
      const next = [
        ...prev,
        {
          id: makeCohortId(),
          name: (name || '').trim() || 'Cohort',
          track: track || 'ngfw-engineer',
          createdAt: new Date().toISOString(),
        },
      ];
      saveCohorts(next);
      return next;
    });
  }, []);

  const updateCohort = useCallback((id, patch) => {
    setCohorts((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      saveCohorts(next);
      return next;
    });
  }, []);

  const removeCohort = useCallback((id) => {
    setCohorts((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveCohorts(next);
      return next;
    });
  }, []);

  return { cohorts, addCohort, updateCohort, removeCohort };
}
