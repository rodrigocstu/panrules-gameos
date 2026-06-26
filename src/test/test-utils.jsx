// Utilidades de test compartidas: render con proveedores necesarios.
import { render } from '@testing-library/react';
import { I18nProvider } from '../i18n/I18nContext.jsx';

export function renderWithI18n(ui, options = {}) {
  return render(<I18nProvider>{ui}</I18nProvider>, options);
}

// Re-exportar todo de @testing-library/react para que los tests solo importen desde aquí.
export * from '@testing-library/react';
