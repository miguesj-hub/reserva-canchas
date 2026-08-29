import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  cambiarEstadoUsuario,
  listarUsuarios,
  type Rol,
  type Usuario,
} from '../api/client';

/** Vocabulario canónico de §3.1 (R-001). La maqueta decía "Jugador". */
const ETIQUETA_ROL: Record<Rol, string> = {
  ADMINISTRADOR: 'Administrador',
  USUARIO_FINAL: 'Usuario final',
};

const ESTILO_ROL: Record<Rol, string> = {
  ADMINISTRADOR: 'bg-secondary/10 text-secondary border-secondary/20',
  USUARIO_FINAL: 'bg-surface-container text-text-muted border-border-subtle',
};

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState<number | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    listarUsuarios()
      .then(setUsuarios)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los usuarios.'),
      )
      .finally(() => setCargando(false));
  }, []);

  useEffect(cargar, [cargar]);

  async function alternarEstado(usuario: Usuario) {
    setCambiando(usuario.id);
    setError(null);
    try {
      const actualizado = await cambiarEstadoUsuario(usuario.id, !usuario.activo);
      setUsuarios((previos) => previos.map((u) => (u.id === actualizado.id ? actualizado : u)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cambiar el estado.');
    } finally {
      setCambiando(null);
    }
  }

  const visibles = usuarios.filter(
    (u) =>
      busqueda.trim() === '' ||
      u.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()) ||
      u.username.toLowerCase().includes(busqueda.trim().toLowerCase()),
  );

  return (
    <main className="p-container-margin w-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-section-gap gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-text-primary">
            Gestión de Usuarios
          </h2>
          <p className="font-body-md text-body-md text-text-muted mt-1">
            Activa o inactiva cuentas. Una cuenta inactiva no puede iniciar sesión, y sus reservas
            se conservan.
          </p>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-6 font-label-md text-label-md text-error bg-error/10 border border-error rounded-lg px-4 py-3"
        >
          {error}
        </p>
      )}

      <section className="bg-surface rounded-xl p-4 shadow-sm mb-6 border border-border-subtle">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-lg font-body-md text-body-md focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors text-text-primary placeholder:text-text-muted"
            placeholder="Buscar por nombre o usuario…"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </section>

      <section className="bg-surface rounded-xl shadow-sm border border-border-subtle overflow-hidden">
        {cargando ? (
          <p className="font-body-md text-body-md text-text-muted py-16 text-center">
            Cargando usuarios…
          </p>
        ) : visibles.length === 0 ? (
          <p className="font-body-md text-body-md text-text-muted py-16 text-center">
            No hay usuarios que coincidan con la búsqueda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-subtle">
                  <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Usuario</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-text-muted">
                    Nombre de cuenta
                  </th>
                  <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Rol</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Estado</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-text-muted text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-text-primary divide-y divide-border-subtle">
                {visibles.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary-container/30 text-secondary flex items-center justify-center font-label-md text-label-md shrink-0">
                          {iniciales(u.nombre)}
                        </div>
                        <span>{u.nombre}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-sm text-text-muted">{u.username}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full font-label-sm text-label-sm border ${ESTILO_ROL[u.rol]}`}
                      >
                        {ETIQUETA_ROL[u.rol]}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 font-label-sm text-label-sm ${
                          u.activo ? 'text-success' : 'text-text-muted'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${u.activo ? 'bg-success' : 'bg-text-muted'}`}
                        />
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {u.rol === 'ADMINISTRADOR' ? (
                        <span className="text-text-muted">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alternarEstado(u)}
                          disabled={cambiando === u.id}
                          className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm inline-flex items-center gap-1 transition-colors disabled:opacity-60 ${
                            u.activo
                              ? 'text-error hover:bg-error/10'
                              : 'text-success hover:bg-success/10'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {u.activo ? 'block' : 'check_circle'}
                          </span>
                          {cambiando === u.id ? 'Guardando…' : u.activo ? 'Inactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
