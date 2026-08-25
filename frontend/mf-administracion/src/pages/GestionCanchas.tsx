import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ApiError,
  cambiarEstadoCancha,
  crearCancha,
  editarCancha,
  listarBloqueos,
  listarCanchas,
  registrarBloqueo,
  retirarBloqueo,
  type Bloqueo,
  type Cancha,
  type CanchaRequest,
  type Deporte,
} from '../api/client';

/** Vocabulario canónico de R-008. "Fútbol" no está en el alcance. */
const DEPORTES: { valor: Deporte; etiqueta: string; icono: string }[] = [
  { valor: 'PADEL', etiqueta: 'Pádel', icono: 'sports_tennis' },
  { valor: 'TENIS', etiqueta: 'Tenis', icono: 'sports_tennis' },
  { valor: 'BASQUET', etiqueta: 'Básquet', icono: 'sports_basketball' },
];

const ETIQUETA: Record<Deporte, string> = {
  PADEL: 'Pádel',
  TENIS: 'Tenis',
  BASQUET: 'Básquet',
};

const ICONO: Record<Deporte, string> = {
  PADEL: 'sports_tennis',
  TENIS: 'sports_tennis',
  BASQUET: 'sports_basketball',
};

const FORM_VACIO: CanchaRequest = {
  nombre: '',
  deporte: 'PADEL',
  horaApertura: '07:00',
  horaCierre: '22:00',
};

function instanteLegible(iso: string): string {
  return new Date(iso).toLocaleString('es-EC', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function GestionCanchas() {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [filtro, setFiltro] = useState<'TODAS' | Deporte>('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulario de alta y edición. `editando` null = alta.
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Cancha | null>(null);
  const [form, setForm] = useState<CanchaRequest>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  // Panel de bloqueos de la cancha seleccionada.
  const [bloqueosDe, setBloqueosDe] = useState<Cancha | null>(null);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [nuevoBloqueo, setNuevoBloqueo] = useState({ desde: '', hasta: '', motivo: '' });

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    listarCanchas()
      .then((lista) => setCanchas(lista.sort((a, b) => a.id - b.id)))
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar el catálogo.'),
      )
      .finally(() => setCargando(false));
  }, []);

  useEffect(cargar, [cargar]);

  function abrirAlta() {
    setEditando(null);
    setForm(FORM_VACIO);
    setError(null);
    setFormAbierto(true);
  }

  function abrirEdicion(cancha: Cancha) {
    setEditando(cancha);
    setForm({
      nombre: cancha.nombre,
      deporte: cancha.deporte,
      horaApertura: cancha.horaApertura,
      horaCierre: cancha.horaCierre,
      activa: cancha.activa,
    });
    setError(null);
    setFormAbierto(true);
  }

  async function guardar(event: FormEvent) {
    event.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      // El backend valida que el cierre sea posterior a la apertura y devuelve
      // 400 con el motivo; no se duplica esa regla aquí para que no puedan
      // desincronizarse.
      if (editando) {
        await editarCancha(editando.id, form);
      } else {
        await crearCancha(form);
      }
      setFormAbierto(false);
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar la cancha.');
    } finally {
      setGuardando(false);
    }
  }

  async function alternarEstado(cancha: Cancha) {
    setError(null);
    try {
      const actualizada = await cambiarEstadoCancha(cancha.id, !cancha.activa);
      setCanchas((previas) => previas.map((c) => (c.id === cancha.id ? actualizada : c)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cambiar el estado.');
    }
  }

  function abrirBloqueos(cancha: Cancha) {
    setBloqueosDe(cancha);
    setNuevoBloqueo({ desde: '', hasta: '', motivo: '' });
    setError(null);
    listarBloqueos(cancha.id)
      .then(setBloqueos)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los bloqueos.'),
      );
  }

  async function anadirBloqueo(event: FormEvent) {
    event.preventDefault();
    if (!bloqueosDe) return;
    setError(null);
    try {
      // El <input type="datetime-local"> ya entrega "YYYY-MM-DDTHH:mm", que es
      // el formato date-time sin zona que espera el contrato.
      await registrarBloqueo(
        bloqueosDe.id,
        nuevoBloqueo.desde,
        nuevoBloqueo.hasta,
        nuevoBloqueo.motivo,
      );
      setNuevoBloqueo({ desde: '', hasta: '', motivo: '' });
      setBloqueos(await listarBloqueos(bloqueosDe.id));
    } catch (e) {
      // El 409 de bloqueo solapado llega por aquí con su motivo.
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar el bloqueo.');
    }
  }

  async function quitarBloqueo(bloqueoId: number) {
    if (!bloqueosDe) return;
    setError(null);
    try {
      await retirarBloqueo(bloqueosDe.id, bloqueoId);
      setBloqueos((previos) => previos.filter((b) => b.id !== bloqueoId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo retirar el bloqueo.');
    }
  }

  const visibles = canchas.filter(
    (c) =>
      (filtro === 'TODAS' || c.deporte === filtro) &&
      (busqueda.trim() === '' ||
        c.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()) ||
        ETIQUETA[c.deporte].toLowerCase().includes(busqueda.trim().toLowerCase())),
  );

  return (
    <main className="p-container-margin w-full">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-section-gap gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-1">
            Gestión de Canchas
          </h2>
          <p className="font-body-md text-body-md text-text-muted">
            Administra las instalaciones, horarios y estado de las canchas.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirAlta}
          className="bg-primary text-on-primary font-label-md text-label-md py-2.5 px-5 rounded-lg shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2 flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva Cancha
        </button>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-6 font-label-md text-label-md text-error bg-error/10 border border-error rounded-lg px-4 py-3"
        >
          {error}
        </p>
      )}

      <section className="bg-surface rounded-xl p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center border border-border-subtle">
        <div className="relative w-full md:w-96 flex-shrink-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-lg font-body-md text-body-md focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors text-text-primary placeholder:text-text-muted"
            placeholder="Buscar por nombre o deporte…"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {(['TODAS', ...DEPORTES.map((d) => d.valor)] as const).map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => setFiltro(valor)}
              className={`px-4 py-1.5 rounded-full border font-label-sm text-label-sm whitespace-nowrap transition-colors ${
                filtro === valor
                  ? 'border-secondary bg-secondary text-on-secondary'
                  : 'border-border-subtle bg-surface text-text-muted hover:border-secondary hover:text-secondary'
              }`}
            >
              {valor === 'TODAS' ? 'Todas' : ETIQUETA[valor]}
            </button>
          ))}
        </div>
      </section>

      {cargando ? (
        <p className="font-body-md text-body-md text-text-muted py-10 text-center">
          Cargando catálogo…
        </p>
      ) : visibles.length === 0 ? (
        <p className="font-body-md text-body-md text-text-muted py-16 text-center border-2 border-dashed border-border-subtle rounded-xl">
          No hay canchas que coincidan con el filtro.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibles.map((cancha) => (
            <article
              key={cancha.id}
              className={`bg-surface rounded-xl shadow-sm border border-border-subtle overflow-hidden transition-shadow group ${
                cancha.activa ? 'hover:shadow-md' : 'opacity-75 hover:opacity-100'
              }`}
            >
              <div
                className={`h-32 relative flex items-center justify-center ${
                  cancha.activa ? 'bg-surface-container-low' : 'bg-surface-variant grayscale'
                }`}
              >
                <span className="material-symbols-outlined text-5xl text-outline-variant">
                  {ICONO[cancha.deporte]}
                </span>
                <div
                  className={`absolute top-3 left-3 px-2 py-1 rounded font-label-sm text-label-sm flex items-center gap-1 backdrop-blur-sm border ${
                    cancha.activa
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-surface-variant text-text-muted border-outline-variant'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${cancha.activa ? 'bg-success' : 'bg-text-muted'}`}
                  />
                  {cancha.activa ? 'Activa' : 'Inactiva'}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-headline-sm text-headline-sm text-primary">{cancha.nombre}</h3>
                <p className="font-body-md text-body-md text-text-muted flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[16px]">
                    {ICONO[cancha.deporte]}
                  </span>
                  {ETIQUETA[cancha.deporte]}
                </p>
                <div className="mt-4 pt-4 border-t border-border-subtle">
                  <p className="font-label-sm text-label-sm text-text-muted uppercase mb-2">
                    Horario de atención
                  </p>
                  <p className="font-body-md text-body-md text-text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      schedule
                    </span>
                    {cancha.horaApertura} – {cancha.horaCierre}
                  </p>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => abrirEdicion(cancha)}
                    className="flex-1 bg-surface text-secondary border border-secondary font-label-md text-label-md py-2 rounded-lg hover:bg-secondary/5 transition-colors text-center"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirBloqueos(cancha)}
                    title="Bloqueos de mantenimiento"
                    className="px-4 bg-warning/10 text-warning border border-warning/20 font-label-md text-label-md py-2 rounded-lg hover:bg-warning/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">build</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alternarEstado(cancha)}
                    title={cancha.activa ? 'Inactivar' : 'Activar'}
                    className={`px-4 font-label-md text-label-md py-2 rounded-lg transition-colors border ${
                      cancha.activa
                        ? 'bg-error/10 text-error border-error/20 hover:bg-error/20'
                        : 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {cancha.activa ? 'block' : 'check_circle'}
                    </span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* --- Alta y edición --- */}
      {formAbierto && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form
            onSubmit={guardar}
            className="bg-surface rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4"
          >
            <h3 className="font-headline-sm text-headline-sm text-primary">
              {editando ? `Editar ${editando.nombre}` : 'Nueva cancha'}
            </h3>

            <label className="block">
              <span className="font-label-md text-label-md text-text-primary">Nombre</span>
              <input
                required
                maxLength={120}
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border-subtle rounded-lg font-body-md text-body-md"
              />
            </label>

            <label className="block">
              <span className="font-label-md text-label-md text-text-primary">Deporte</span>
              <select
                value={form.deporte}
                onChange={(e) => setForm({ ...form, deporte: e.target.value as Deporte })}
                className="mt-1 w-full px-3 py-2 border border-border-subtle rounded-lg font-body-md text-body-md"
              >
                {DEPORTES.map((d) => (
                  <option key={d.valor} value={d.valor}>
                    {d.etiqueta}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="font-label-md text-label-md text-text-primary">Apertura</span>
                <input
                  required
                  type="time"
                  value={form.horaApertura}
                  onChange={(e) => setForm({ ...form, horaApertura: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-border-subtle rounded-lg font-body-md text-body-md"
                />
              </label>
              <label className="block">
                <span className="font-label-md text-label-md text-text-primary">Cierre</span>
                <input
                  required
                  type="time"
                  value={form.horaCierre}
                  onChange={(e) => setForm({ ...form, horaCierre: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-border-subtle rounded-lg font-body-md text-body-md"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFormAbierto(false)}
                className="px-4 py-2 rounded-lg border border-border-subtle font-label-md text-label-md text-text-primary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md disabled:opacity-60"
              >
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- Bloqueos de mantenimiento --- */}
      {bloqueosDe && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-lg w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary">
                  Mantenimiento · {bloqueosDe.nombre}
                </h3>
                <p className="font-label-sm text-label-sm text-text-muted mt-1">
                  Un bloqueo impide reservas nuevas en su rango. Las reservas ya confirmadas se
                  conservan: cancélalas desde Gestión de reservas si hace falta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBloqueosDe(null)}
                className="text-text-muted hover:text-text-primary"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={anadirBloqueo} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <label className="block sm:col-span-1">
                <span className="font-label-sm text-label-sm text-text-muted">Desde</span>
                <input
                  required
                  type="datetime-local"
                  value={nuevoBloqueo.desde}
                  onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, desde: e.target.value })}
                  className="mt-1 w-full px-2 py-2 border border-border-subtle rounded-lg font-body-md text-sm"
                />
              </label>
              <label className="block sm:col-span-1">
                <span className="font-label-sm text-label-sm text-text-muted">Hasta</span>
                <input
                  required
                  type="datetime-local"
                  value={nuevoBloqueo.hasta}
                  onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, hasta: e.target.value })}
                  className="mt-1 w-full px-2 py-2 border border-border-subtle rounded-lg font-body-md text-sm"
                />
              </label>
              <label className="block sm:col-span-1">
                <span className="font-label-sm text-label-sm text-text-muted">Motivo</span>
                <input
                  maxLength={200}
                  placeholder="Repintado…"
                  value={nuevoBloqueo.motivo}
                  onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, motivo: e.target.value })}
                  className="mt-1 w-full px-2 py-2 border border-border-subtle rounded-lg font-body-md text-sm"
                />
              </label>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-warning/10 text-warning border border-warning/20 font-label-md text-label-md"
              >
                Bloquear
              </button>
            </form>

            {bloqueos.length === 0 ? (
              <p className="font-body-md text-body-md text-text-muted text-center py-6 border-2 border-dashed border-border-subtle rounded-lg">
                Sin bloqueos registrados.
              </p>
            ) : (
              <ul className="divide-y divide-border-subtle border border-border-subtle rounded-lg">
                {bloqueos.map((b) => (
                  <li key={b.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-body-md text-body-md text-text-primary">
                        {instanteLegible(b.desde)} → {instanteLegible(b.hasta)}
                      </p>
                      {b.motivo && (
                        <p className="font-label-sm text-label-sm text-text-muted">{b.motivo}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => quitarBloqueo(b.id)}
                      className="text-error hover:bg-error/10 rounded-lg px-3 py-1.5 font-label-sm text-label-sm flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      Retirar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
