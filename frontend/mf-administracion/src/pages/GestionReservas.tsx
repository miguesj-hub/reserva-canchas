import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  cancelarReserva,
  listarCanchas,
  listarReservas,
  type Cancha,
  type EstadoReserva,
  type Reserva,
} from '../api/client';

const ESTADO_STYLES: Record<EstadoReserva, string> = {
  CONFIRMADA: 'bg-success/10 text-success border-success/20',
  FINALIZADA: 'bg-surface-variant text-on-surface-variant border-border-subtle',
  CANCELADA: 'bg-error/10 text-error border-error/20',
};

const ESTADO_LABEL: Record<EstadoReserva, string> = {
  CONFIRMADA: 'Confirmada',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
};

const ETIQUETA_DEPORTE: Record<string, string> = {
  PADEL: 'Pádel',
  TENIS: 'Tenis',
  BASQUET: 'Básquet',
};

function fechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

type Filtros = { desde: string; hasta: string; canchaId: string; estado: string };

const SIN_FILTROS: Filtros = { desde: '', hasta: '', canchaId: '', estado: '' };

export default function GestionReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aCancelar, setACancelar] = useState<Reserva | null>(null);
  const [cancelando, setCancelando] = useState(false);

  // El catálogo completo alimenta el desplegable de filtro, incluidas las
  // inactivas: siguen teniendo reservas históricas que hay que poder filtrar.
  useEffect(() => {
    listarCanchas().then(setCanchas).catch(() => setCanchas([]));
  }, []);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    // Los filtros se aplican en el backend, no sobre una lista ya traída: es
    // lo que permite acotar por rango sin descargar el histórico entero.
    listarReservas({
      desde: filtros.desde || undefined,
      hasta: filtros.hasta || undefined,
      canchaId: filtros.canchaId ? Number(filtros.canchaId) : undefined,
      estado: (filtros.estado || undefined) as EstadoReserva | undefined,
    })
      .then(setReservas)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las reservas.'),
      )
      .finally(() => setCargando(false));
  }, [filtros]);

  useEffect(cargar, [cargar]);

  async function confirmarCancelacion() {
    if (!aCancelar) return;
    setCancelando(true);
    setError(null);
    try {
      // Misma operación que usa el dueño: la diferencia de rol la aplica
      // BookingService leyendo X-User-Role (RN-03).
      const actualizada = await cancelarReserva(aCancelar.id);
      setReservas((previas) => previas.map((r) => (r.id === actualizada.id ? actualizada : r)));
      setACancelar(null);
    } catch (e) {
      // El 409 de RN-04 —la reserva ya inició— llega por aquí con su motivo, y
      // aplica igual al administrador.
      setError(e instanceof ApiError ? e.message : 'No se pudo cancelar la reserva.');
      setACancelar(null);
    } finally {
      setCancelando(false);
    }
  }

  return (
    <main className="p-container-margin w-full">
      <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-text-primary">
            Gestión de Reservas
          </h2>
          <p className="font-body-md text-body-md text-text-muted mt-1">
            Todas las reservas del club. Puedes cancelar cualquiera que no haya iniciado.
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

      <section className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-section-gap bg-surface p-4 rounded-xl border border-border-subtle shadow-sm">
        <label className="block">
          <span className="font-label-sm text-label-sm text-text-muted">Desde</span>
          <input
            type="date"
            value={filtros.desde}
            onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-border-subtle rounded-lg font-body-md text-sm"
          />
        </label>
        <label className="block">
          <span className="font-label-sm text-label-sm text-text-muted">Hasta</span>
          <input
            type="date"
            value={filtros.hasta}
            onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-border-subtle rounded-lg font-body-md text-sm"
          />
        </label>
        <label className="block">
          <span className="font-label-sm text-label-sm text-text-muted">Cancha</span>
          <select
            value={filtros.canchaId}
            onChange={(e) => setFiltros({ ...filtros, canchaId: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-border-subtle rounded-lg font-body-md text-sm"
          >
            <option value="">Todas</option>
            {canchas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-label-sm text-label-sm text-text-muted">Estado</span>
          <select
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-border-subtle rounded-lg font-body-md text-sm"
          >
            <option value="">Todos</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="FINALIZADA">Finalizada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setFiltros(SIN_FILTROS)}
            className="w-full px-4 py-2 rounded-lg border border-border-subtle font-label-md text-label-md text-text-muted hover:text-text-primary"
          >
            Limpiar
          </button>
        </div>
      </section>

      <section className="bg-surface rounded-xl shadow-sm border border-border-subtle overflow-hidden">
        {cargando ? (
          <p className="font-body-md text-body-md text-text-muted py-16 text-center">
            Cargando reservas…
          </p>
        ) : reservas.length === 0 ? (
          <p className="font-body-md text-body-md text-text-muted py-16 text-center">
            No hay reservas que coincidan con los filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-subtle">
                  <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Código</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Usuario</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Cancha</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Deporte</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Fecha</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Bloque</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Estado</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-text-muted text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-text-primary divide-y divide-border-subtle">
                {reservas.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-sm text-text-muted">#RS-{r.id}</td>
                    <td className="py-4 px-6">{r.usuarioNombre ?? `Usuario ${r.usuarioId}`}</td>
                    <td className="py-4 px-6">{r.canchaNombre ?? `Cancha ${r.canchaId}`}</td>
                    <td className="py-4 px-6 text-text-muted">
                      {r.deporte ? (ETIQUETA_DEPORTE[r.deporte] ?? r.deporte) : '—'}
                    </td>
                    <td className="py-4 px-6">{fechaCorta(r.fecha)}</td>
                    <td className="py-4 px-6">
                      {r.horaInicio} – {r.horaFin}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full font-label-sm text-label-sm border ${ESTADO_STYLES[r.estado]}`}
                      >
                        {ESTADO_LABEL[r.estado]}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {/* Solo las confirmadas: una finalizada ya ocurrió y una
                          cancelada no vuelve. */}
                      {r.estado === 'CONFIRMADA' ? (
                        <button
                          type="button"
                          onClick={() => setACancelar(r)}
                          className="text-error hover:bg-error/10 rounded-lg px-3 py-1.5 font-label-sm text-label-sm inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[18px]">cancel</span>
                          Cancelar
                        </button>
                      ) : (
                        <span className="text-text-muted font-label-sm text-label-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {aCancelar && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <h3 className="font-headline-sm text-headline-sm text-primary">Cancelar reserva</h3>
            <p className="font-body-md text-body-md text-text-muted">
              Vas a cancelar la reserva <strong>#RS-{aCancelar.id}</strong> de{' '}
              {aCancelar.usuarioNombre ?? `el usuario ${aCancelar.usuarioId}`} en{' '}
              {aCancelar.canchaNombre ?? `la cancha ${aCancelar.canchaId}`}, el{' '}
              {fechaCorta(aCancelar.fecha)} de {aCancelar.horaInicio} a {aCancelar.horaFin}. El
              bloque quedará libre.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setACancelar(null)}
                className="px-4 py-2 rounded-lg border border-border-subtle font-label-md text-label-md text-text-primary"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmarCancelacion}
                disabled={cancelando}
                className="px-5 py-2 rounded-lg bg-error text-white font-label-md text-label-md disabled:opacity-60"
              >
                {cancelando ? 'Cancelando…' : 'Cancelar reserva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
