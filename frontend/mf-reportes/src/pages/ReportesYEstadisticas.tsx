import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  cargarResumen,
  type Deporte,
  type OcupacionCancha,
  type Resumen,
} from '../api/client';
import type { PropsDeRemote } from '../tipos';

const ETIQUETA_DEPORTE: Record<Deporte, string> = {
  PADEL: 'Pádel',
  TENIS: 'Tenis',
  BASQUET: 'Básquet',
};

const ICONO_DEPORTE: Record<Deporte, string> = {
  PADEL: 'sports_tennis',
  TENIS: 'sports_tennis',
  BASQUET: 'sports_basketball',
};

/** Colores de barra por deporte, para que las tres vistas se lean igual. */
const COLOR_DEPORTE: Record<Deporte, string> = {
  PADEL: 'bg-secondary',
  TENIS: 'bg-secondary-container',
  BASQUET: 'bg-inverse-primary',
};

function iso(fecha: Date): string {
  // A mano y no con toISOString(): esa convierte a UTC y en husos al oeste
  // devuelve el día anterior.
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(
    fecha.getDate(),
  ).padStart(2, '0')}`;
}

function haceDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return iso(d);
}

/** Una tarjeta de indicador. Sin "variación vs mes anterior": no es ninguno de
 *  los cuatro indicadores de §3.3.5 y no hay dato con el que calcularla. */
function Metrica({
  titulo,
  valor,
  sufijo,
  detalle,
  icono,
  colorFondo,
  colorTexto,
}: {
  titulo: string;
  valor: string | number;
  sufijo?: string;
  detalle?: string;
  icono: string;
  colorFondo: string;
  colorTexto: string;
}) {
  return (
    <div className="bg-surface rounded-xl p-6 shadow-sm border border-border-subtle/50">
      <div className="flex justify-between items-start mb-3">
        <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">
          {titulo}
        </p>
        <div className={`p-2 rounded-lg ${colorFondo} ${colorTexto}`}>
          <span className="material-symbols-outlined text-[22px]">{icono}</span>
        </div>
      </div>
      <h3 className="font-display text-[32px] font-extrabold text-text-primary leading-none">
        {valor}
        {sufijo && <span className="text-xl text-text-muted ml-1">{sufijo}</span>}
      </h3>
      {detalle && <p className="font-label-sm text-label-sm text-text-muted mt-2">{detalle}</p>}
    </div>
  );
}

export default function ReportesYEstadisticas({ sesion, onLogout }: PropsDeRemote) {
  // Ninguno de los dos se usa aquí: el Layout que envuelve esta página ya
  // resuelve el sidebar (con su etiqueta de rol fija) y "Cerrar Sesión".
  void sesion;
  void onLogout;
  const [desde, setDesde] = useState(haceDias(30));
  const [hasta, setHasta] = useState(iso(new Date()));
  const [datos, setDatos] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    cargarResumen(desde, hasta)
      .then(setDatos)
      .catch((e) => {
        setDatos(null);
        // El 400 del rango invertido y el 503 del origen caído llegan con su
        // motivo: se muestran tal cual, no se sustituyen por ceros que
        // parecerían datos reales.
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los indicadores.');
      })
      .finally(() => setCargando(false));
  }, [desde, hasta]);

  useEffect(cargar, [cargar]);

  const ocupacionMedia = useMemo(() => {
    if (!datos || datos.ocupacion.length === 0) return 0;
    const suma = datos.ocupacion.reduce((acc, o) => acc + o.porcentaje, 0);
    return Math.round((suma / datos.ocupacion.length) * 10) / 10;
  }, [datos]);

  const maxReservasDeporte = useMemo(
    () => Math.max(1, ...(datos?.reservas.porDeporte.map((d) => d.reservas) ?? [1])),
    [datos],
  );

  const ocupacionOrdenada: OcupacionCancha[] = useMemo(
    () => [...(datos?.ocupacion ?? [])].sort((a, b) => b.porcentaje - a.porcentaje),
    [datos],
  );

  // FR-044: un rango sin datos no es un error, es una respuesta. Se distingue
  // de "no pude preguntar", que llega como error y se muestra aparte.
  const sinDatos =
    datos !== null && datos.reservas.total === 0 && datos.cancelaciones.total === 0;

  return (
    <div className="p-container-margin space-y-section-gap">
      <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-1">
              Reportes y Estadísticas
            </h2>
            <p className="font-body-md text-body-md text-text-muted">
              Los cuatro indicadores de uso del club, sobre el rango que elijas.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3 bg-surface p-3 rounded-xl border border-border-subtle shadow-sm">
            <label className="block">
              <span className="font-label-sm text-label-sm text-text-muted">Desde</span>
              <input
                type="date"
                value={desde}
                max={hasta}
                onChange={(e) => setDesde(e.target.value)}
                className="mt-1 block px-3 py-2 border border-border-subtle rounded-lg font-body-md text-sm"
              />
            </label>
            <label className="block">
              <span className="font-label-sm text-label-sm text-text-muted">Hasta</span>
              <input
                type="date"
                value={hasta}
                min={desde}
                onChange={(e) => setHasta(e.target.value)}
                className="mt-1 block px-3 py-2 border border-border-subtle rounded-lg font-body-md text-sm"
              />
            </label>
            <button
              type="button"
              onClick={cargar}
              className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md"
            >
              Actualizar
            </button>
          </div>
        </header>

        {error && (
          <p
            role="alert"
            className="font-label-md text-label-md text-error bg-error/10 border border-error rounded-lg px-4 py-3"
          >
            {error}
          </p>
        )}

        {cargando && (
          <p className="font-body-md text-body-md text-text-muted py-16 text-center">
            Calculando indicadores…
          </p>
        )}

        {!cargando && datos && sinDatos && (
          <section className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-border-subtle rounded-xl bg-surface-container-low/50">
            <span className="material-symbols-outlined text-[64px] text-text-muted mb-4">
              query_stats
            </span>
            <h3 className="font-headline-md text-headline-md text-primary mb-2">
              Sin actividad en este rango
            </h3>
            <p className="font-body-md text-body-md text-text-muted max-w-md">
              No hubo reservas ni cancelaciones entre el {datos.reservas.desde} y el{' '}
              {datos.reservas.hasta}. Prueba con un rango más amplio.
            </p>
          </section>
        )}

        {!cargando && datos && !sinDatos && (
          <>
            {/* --- Indicadores 1, 2 y 3 en tarjetas --- */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Metrica
                titulo="Total reservas"
                valor={datos.reservas.total}
                detalle="Confirmadas y finalizadas del rango"
                icono="event_note"
                colorFondo="bg-secondary-container/20"
                colorTexto="text-secondary"
              />
              <Metrica
                titulo="Ocupación media"
                valor={ocupacionMedia}
                sufijo="%"
                detalle="Horas reservadas sobre horario de atención"
                icono="pie_chart"
                colorFondo="bg-success/20"
                colorTexto="text-success"
              />
              <Metrica
                titulo="Cancelaciones"
                valor={datos.cancelaciones.total}
                detalle="Por fecha de cancelación"
                icono="event_busy"
                colorFondo="bg-error/20"
                colorTexto="text-error"
              />
              <Metrica
                titulo="Mayor demanda"
                valor={datos.demanda.mayorDemanda?.canchaNombre ?? '—'}
                detalle={
                  datos.demanda.mayorDemanda
                    ? `${datos.demanda.mayorDemanda.reservas} reservas en el rango`
                    : undefined
                }
                icono="trophy"
                colorFondo="bg-secondary/10"
                colorTexto="text-secondary"
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* --- Indicador 1: reservas por deporte --- */}
              <section className="bg-surface rounded-xl p-6 shadow-sm border border-border-subtle/50">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-6">
                  Reservas por deporte
                </h3>
                <div className="flex items-end justify-around h-56 gap-4">
                  {datos.reservas.porDeporte.map((d) => (
                    <div key={d.deporte} className="flex flex-col items-center flex-1 h-full justify-end">
                      <span className="font-label-md text-label-md text-text-primary mb-1">
                        {d.reservas}
                      </span>
                      <div
                        className={`w-full rounded-t-lg ${COLOR_DEPORTE[d.deporte]}`}
                        style={{ height: `${(d.reservas / maxReservasDeporte) * 100}%`, minHeight: '4px' }}
                      />
                      <span className="font-label-sm text-label-sm text-text-muted mt-2">
                        {ETIQUETA_DEPORTE[d.deporte]}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* --- Indicador 2: ocupación por cancha --- */}
              <section className="bg-surface rounded-xl p-6 shadow-sm border border-border-subtle/50">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-6">
                  Ocupación por cancha
                </h3>
                <div className="space-y-4">
                  {ocupacionOrdenada.map((o) => (
                    <div key={o.canchaId}>
                      <div className="flex justify-between font-label-md text-label-md mb-1">
                        <span className="text-text-primary">{o.canchaNombre}</span>
                        <span className="text-text-muted">
                          {o.porcentaje}% · {o.horasReservadas} de {o.horasDisponibles} h
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-high rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${COLOR_DEPORTE[o.deporte]}`}
                          style={{ width: `${Math.min(100, o.porcentaje)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* --- Indicador 4: ranking de demanda --- */}
            <section className="bg-surface rounded-xl shadow-sm border border-border-subtle/50 overflow-hidden">
              <div className="p-6 border-b border-border-subtle flex flex-wrap justify-between items-center gap-2">
                <h3 className="font-headline-sm text-headline-sm text-primary">
                  Ranking de demanda
                </h3>
                {datos.demanda.menorDemanda && (
                  <p className="font-label-sm text-label-sm text-text-muted">
                    Menor demanda: <strong>{datos.demanda.menorDemanda.canchaNombre}</strong> (
                    {datos.demanda.menorDemanda.reservas} reservas)
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-border-subtle">
                      <th className="p-4 font-label-md text-label-md text-text-muted">#</th>
                      <th className="p-4 font-label-md text-label-md text-text-muted">Cancha</th>
                      <th className="p-4 font-label-md text-label-md text-text-muted">Deporte</th>
                      <th className="p-4 font-label-md text-label-md text-text-muted text-right">
                        Reservas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {datos.demanda.ranking.map((fila) => (
                      <tr key={fila.canchaId} className="hover:bg-surface-container-low/50">
                        <td className="p-4 font-label-md text-label-md text-text-muted">
                          {fila.posicion}
                        </td>
                        <td className="p-4 font-body-md text-body-md text-text-primary flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-secondary">
                            {ICONO_DEPORTE[fila.deporte]}
                          </span>
                          {fila.canchaNombre}
                        </td>
                        <td className="p-4 font-body-md text-body-md text-text-muted">
                          {ETIQUETA_DEPORTE[fila.deporte]}
                        </td>
                        <td className="p-4 font-body-md text-body-md text-text-primary text-right">
                          {fila.reservas}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
    </div>
  );
}
