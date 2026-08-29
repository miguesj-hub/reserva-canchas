/**
 * Disponibilidad para el administrador — feature 002, Historia 1.
 *
 * §3.1 le atribuye "Consultar disponibilidad de canchas" a los dos roles, y
 * FR-007 de la feature 001 lo exige explícitamente para ambos, pero hasta esta
 * historia solo existía la pantalla de mf-reservas, restringida a
 * USUARIO_FINAL por el RoleRoute del shell.
 *
 * Adaptada de frontend/mf-reservas/src/pages/Disponibilidad.tsx, NO importada:
 * el Principio V prohíbe que un remote importe código de otro. Y adaptada, no
 * copiada, por tres diferencias deliberadas (R-011):
 *
 *   1. Sin acción de reservar (FR-051). §3.1 no atribuye la creación de
 *      reservas al administrador, y BookingService.crear lo rechaza con 403:
 *      un botón aquí sería una acción que siempre falla.
 *   2. Sin estado de selección, porque no hay nada que seleccionar. Los bloques
 *      son <div>, no <button>: nada en esta pantalla es pulsable.
 *   3. Muestra también las canchas inactivas marcadas como tales, porque el
 *      administrador sí las gestiona, mientras que al socio no se le ofrecen.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  consultarDisponibilidad,
  listarCanchas,
  type Bloque,
  type Cancha,
  type Deporte,
} from '../api/client';

/** Etiquetas de pantalla. El valor canónico va en mayúsculas (R-008). */
const DEPORTES: { valor: Deporte; etiqueta: string; icono: string }[] = [
  { valor: 'PADEL', etiqueta: 'Pádel', icono: 'sports_tennis' },
  { valor: 'TENIS', etiqueta: 'Tenis', icono: 'sports_tennis' },
  { valor: 'BASQUET', etiqueta: 'Básquet', icono: 'sports_basketball' },
];

const DIA_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Los próximos cinco días a partir de hoy, en la zona del navegador. */
function proximosDias(cuantos: number) {
  const hoy = new Date();
  return Array.from({ length: cuantos }, (_, i) => {
    const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
    // Se compone a mano en vez de con toISOString(): esa convierte a UTC y en
    // husos al oeste devuelve el día anterior.
    const iso = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(
      dia.getDate(),
    ).padStart(2, '0')}`;
    return { iso, etiqueta: i === 0 ? 'Hoy' : DIA_CORTO[dia.getDay()], numero: dia.getDate() };
  });
}

export default function Disponibilidad() {
  const dias = useMemo(() => proximosDias(5), []);

  const [deporte, setDeporte] = useState<Deporte>('PADEL');
  const [fecha, setFecha] = useState(dias[0].iso);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [bloquesPorCancha, setBloquesPorCancha] = useState<Record<number, Bloque[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);

    // listarCanchas() sin filtro de estado: el administrador ve también las
    // inactivas, que es la diferencia con la pantalla del socio. El filtro por
    // deporte se aplica aquí porque el endpoint de admin no lo acepta.
    listarCanchas()
      .then((lista) => {
        if (!vigente) return;
        const delDeporte = lista.filter((c) => c.deporte === deporte);
        setCanchas(delDeporte);
        return Promise.all(
          delDeporte.map((c) =>
            consultarDisponibilidad(c.id, fecha).then((d) => [c.id, d.bloques] as const),
          ),
        ).then((pares) => {
          if (!vigente) return;
          setBloquesPorCancha(Object.fromEntries(pares));
        });
      })
      .catch((e) => {
        if (!vigente) return;
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar la disponibilidad.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [deporte, fecha]);

  const iconoDeporte = DEPORTES.find((d) => d.valor === deporte)?.icono ?? 'sports_tennis';

  return (
    <main className="p-container-margin w-full">
      <header className="mb-section-gap">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-1">
          Disponibilidad
        </h2>
        <p className="font-body-md text-body-md text-text-muted">
          Consulta de ocupación por cancha y fecha. Solo lectura: la creación de reservas
          corresponde al usuario final.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-section-gap">
        <div className="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-6 border border-border-subtle/50">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-4">Deporte</h3>
          <div className="flex space-x-2">
            {DEPORTES.map((d) => (
              <button
                key={d.valor}
                type="button"
                onClick={() => setDeporte(d.valor)}
                className={`flex-1 py-2 px-3 rounded-lg font-label-md border transition-colors ${
                  deporte === d.valor
                    ? 'bg-primary-container text-on-primary-container border-transparent shadow-sm'
                    : 'bg-surface text-text-primary border-border-subtle hover:border-secondary'
                }`}
              >
                {d.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-6 border border-border-subtle/50 lg:col-span-2">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-4">Fecha</h3>
          <div className="flex-1 flex justify-between overflow-x-auto space-x-2 pb-2">
            {dias.map((d) => (
              <button
                key={d.iso}
                type="button"
                onClick={() => setFecha(d.iso)}
                className={`flex flex-col items-center justify-center min-w-[60px] h-[70px] rounded-lg cursor-pointer transition-colors ${
                  fecha === d.iso
                    ? 'bg-secondary text-on-secondary shadow-sm'
                    : 'bg-surface text-text-primary border border-border-subtle hover:border-secondary'
                }`}
              >
                <span className="font-label-sm text-label-sm">{d.etiqueta}</span>
                <span className="font-headline-md text-headline-md">{d.numero}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-6 flex-wrap gap-4">
          <h3 className="font-headline-md text-headline-md text-primary">Ocupación por cancha</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="font-label-sm text-label-sm text-text-muted">Libre</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-surface-dim border border-border-subtle" />
              <span className="font-label-sm text-label-sm text-text-muted">Ocupado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="font-label-sm text-label-sm text-text-muted">Mantenimiento</span>
            </div>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-6 font-label-md text-label-md text-error bg-error/10 border border-error rounded-lg px-4 py-3"
          >
            {error}
          </p>
        )}

        {cargando && (
          <p className="font-body-md text-body-md text-text-muted py-10 text-center">
            Cargando disponibilidad…
          </p>
        )}

        {!cargando && !error && canchas.length === 0 && (
          <p className="font-body-md text-body-md text-text-muted py-10 text-center border-2 border-dashed border-border-subtle rounded-xl">
            No hay canchas de este deporte en el catálogo.
          </p>
        )}

        {!cargando &&
          canchas.map((cancha) => {
            const bloques = bloquesPorCancha[cancha.id] ?? [];
            const ocupados = bloques.filter((b) => b.estado === 'OCUPADO').length;

            return (
              <div
                key={cancha.id}
                className="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-border-subtle/50 mb-6 overflow-hidden"
              >
                <div className="p-6 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-lg bg-primary-fixed-dim flex items-center justify-center text-primary-container">
                      <span className="material-symbols-outlined text-3xl">{iconoDeporte}</span>
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-primary">
                        {cancha.nombre}
                        {!cancha.activa && (
                          <span className="ml-2 align-middle font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-dim text-text-muted border border-border-subtle">
                            Inactiva
                          </span>
                        )}
                      </h4>
                      <p className="font-body-md text-body-md text-text-muted">
                        Horario de atención {cancha.horaApertura} – {cancha.horaCierre}
                      </p>
                    </div>
                  </div>
                  <p className="font-label-md text-label-md text-text-muted">
                    {ocupados} de {bloques.length} bloques ocupados
                  </p>
                </div>

                <div className="p-6 bg-surface-bright overflow-x-auto">
                  {bloques.length === 0 ? (
                    <p className="font-body-md text-body-md text-text-muted">
                      Sin bloques para esta fecha.
                    </p>
                  ) : (
                    <div className="flex min-w-max space-x-2">
                      {bloques.map((bloque) => (
                        // <div> y no <button>: aquí no se pulsa nada (FR-051).
                        <div
                          key={bloque.horaInicio}
                          className={`w-24 h-20 rounded-lg border flex flex-col items-center justify-center relative overflow-hidden ${
                            bloque.estado === 'LIBRE'
                              ? 'bg-surface border-l-4 border-l-success border-border-subtle'
                              : bloque.estado === 'MANTENIMIENTO'
                                ? 'bg-surface border-l-4 border-l-warning border-border-subtle opacity-80'
                                : 'bg-surface-dim border-border-subtle opacity-60'
                          }`}
                        >
                          {bloque.estado === 'MANTENIMIENTO' && (
                            <span className="material-symbols-outlined text-warning mb-1">
                              build
                            </span>
                          )}
                          <span
                            className={`font-label-md text-label-md ${
                              bloque.estado === 'OCUPADO' ? 'text-text-muted line-through' : ''
                            } ${bloque.estado === 'MANTENIMIENTO' ? 'text-warning' : ''}`}
                          >
                            {bloque.horaInicio}
                          </span>
                          <span className="font-label-sm text-label-sm text-text-muted">
                            {bloque.horaFin}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </section>
    </main>
  );
}
