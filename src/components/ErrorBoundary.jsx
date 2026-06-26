import { Component } from 'react';
import { RefreshCw } from 'lucide-react';

// Error Boundary de clase (React requiere clase para getDerivedStateFromError).
// Captura errores en el árbol hijo y muestra un fallback en vez de romper la app.
// Props:
//   children   — árbol normal
//   fallback   — opcional: función (error) => ReactNode para UI de error personalizada
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Reservado para telemetría anónima opt-in (WBS 6.3).
    // No loguear en test para no ensuciar la salida de Vitest.
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center bg-slate-950"
        >
          <div className="text-red-500 text-5xl">⚠</div>
          <h2 className="text-lg font-bold text-white">Algo salió mal</h2>
          <p className="text-sm text-slate-400 max-w-sm">
            {this.state.error?.message ?? 'Error inesperado en el simulador.'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold"
          >
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
