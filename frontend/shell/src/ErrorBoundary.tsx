import { Component, type ReactNode } from 'react';

type Props = { nombre: string; children: ReactNode };
type State = { fallo: boolean };

/**
 * Aísla el fallo de un microfrontend.
 *
 * Sin esto, si un remote no carga —porque su contenedor está caído o su
 * remoteEntry.js devuelve 404— el error sube por el árbol de React y tumba la
 * aplicación entera. Eso contradice el sentido de los microfrontends: cada uno
 * debe poder fallar por separado.
 *
 * Tiene que ser un componente de clase: React no ofrece equivalente con hooks
 * para capturar errores de renderizado.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { fallo: false };

  static getDerivedStateFromError(): State {
    return { fallo: true };
  }

  render() {
    if (this.state.fallo) {
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded">
          <p className="font-semibold">
            El módulo «{this.props.nombre}» no está disponible.
          </p>
          <p className="text-sm">
            El resto de la aplicación sigue funcionando.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
