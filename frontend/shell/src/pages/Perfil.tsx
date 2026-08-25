import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/** Etiqueta legible de cada rol. El valor canónico se guarda en mayúsculas
 * (R-001); traducirlo es cosa de la pantalla, no del contrato. */
const ETIQUETA_ROL = {
  USUARIO_FINAL: 'Usuario final',
  ADMINISTRADOR: 'Administrador',
} as const;

/**
 * Perfil de solo lectura (R-006).
 *
 * La maqueta traía edición de datos, cambio de contraseña, foto, teléfono,
 * correo, notificaciones y métodos de pago. Nada de eso está en §3.1 ni tiene
 * endpoint en los contratos, y los pagos y las notificaciones están
 * explícitamente fuera de alcance (§3.5). Se retiran en lugar de dejarlos como
 * botones que no hacen nada: una pantalla que promete lo que no existe es peor
 * que una pantalla que no lo promete (Principio VI).
 *
 * Lo que queda sale de la prop `sesion`, así que no consume ningún endpoint.
 */
export default function Perfil() {
  const { sesion, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  if (!sesion) return null;

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-[1200px] mx-auto p-container-margin md:p-[32px]">
        <button
          className="mb-gutter flex items-center gap-2 px-3 py-2 -ml-3 rounded-lg font-label-md text-label-md text-text-muted hover:text-text-primary hover:bg-surface-container-low transition-colors"
          onClick={() => navigate(-1)}
          type="button"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Volver
        </button>

        <div className="mb-section-gap flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-text-primary">
              Mi Perfil
            </h2>
            <p className="font-body-md text-body-md text-text-muted mt-2">
              Los datos de tu cuenta en el club.
            </p>
          </div>
          <button
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-surface border border-border-subtle rounded-lg font-label-md text-label-md text-text-primary hover:border-error hover:text-error transition-colors"
            onClick={handleLogout}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Cerrar Sesión
          </button>
        </div>

        <div className="bg-surface rounded-xl shadow-[0_4px_20px_rgba(15,23,42,0.05)] overflow-hidden max-w-2xl">
          <div className="p-[24px] flex items-center gap-4 border-b border-border-subtle">
            <div className="w-16 h-16 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-3xl">person</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-headline-md text-headline-md text-text-primary truncate">
                {sesion.nombre}
              </h3>
              <p className="font-body-md text-body-md text-text-muted">
                {ETIQUETA_ROL[sesion.rol]}
              </p>
            </div>
          </div>

          <dl className="divide-y divide-border-subtle">
            <div className="p-[24px] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-text-muted shrink-0">
                <span className="material-symbols-outlined">badge</span>
              </div>
              <div className="min-w-0">
                <dt className="font-label-sm text-label-sm text-text-muted">
                  Usuario
                </dt>
                <dd className="font-body-md text-body-md text-text-primary truncate">
                  {sesion.username}
                </dd>
              </div>
            </div>

            <div className="p-[24px] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-text-muted shrink-0">
                <span className="material-symbols-outlined">shield_person</span>
              </div>
              <div>
                <dt className="font-label-sm text-label-sm text-text-muted">Rol</dt>
                <dd className="font-body-md text-body-md text-text-primary">
                  {ETIQUETA_ROL[sesion.rol]}
                </dd>
              </div>
            </div>

            <div className="p-[24px] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-text-muted shrink-0">
                <span className="material-symbols-outlined">tag</span>
              </div>
              <div>
                <dt className="font-label-sm text-label-sm text-text-muted">
                  Identificador
                </dt>
                <dd className="font-body-md text-body-md text-text-primary">
                  {sesion.usuarioId}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
