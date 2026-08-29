/**
 * Configuración de la política de reservas — feature 002, Historia 2.
 *
 * RN-06 dice que el tope de reservas activas es "configurable", pero §3.2 no
 * le da pantalla. La enmienda 1.3.0 de la constitución lo declaró en alcance
 * por traza a la regla: sin un sitio donde cambiarlo, "configurable" solo
 * significaba "se puede hacer un UPDATE a mano".
 *
 * El cambio rige para la siguiente reserva que se intente crear, sin reiniciar
 * nada: ms-reservas lee la clave en cada creación (R-010). No es retroactivo:
 * las reservas ya confirmadas se conservan (FR-055).
 */
import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, cambiarTope, consultarConfiguracion } from '../api/client';

export default function Configuracion() {
  const [tope, setTope] = useState<number | null>(null);
  const [valor, setValor] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    consultarConfiguracion()
      .then((c) => {
        if (!vigente) return;
        setTope(c.maxReservasActivas);
        setValor(String(c.maxReservasActivas));
      })
      .catch((e) => {
        if (!vigente) return;
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar la configuración.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  async function guardar(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setAviso(null);
    setGuardando(true);
    try {
      // Se manda tal cual y se deja que el backend valide: la regla del valor
      // admitido vive en ConfigurationService (FR-054), no duplicada aquí.
      const actualizada = await cambiarTope(Number(valor));
      setTope(actualizada.maxReservasActivas);
      setValor(String(actualizada.maxReservasActivas));
      setAviso(
        `Tope actualizado a ${actualizada.maxReservasActivas}. Rige para las reservas que se creen a partir de ahora.`,
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cambiar el tope.');
    } finally {
      setGuardando(false);
    }
  }

  const sinCambios = valor === String(tope ?? '');

  return (
    <main className="p-container-margin w-full">
      <header className="mb-section-gap">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-1">
          Configuración
        </h2>
        <p className="font-body-md text-body-md text-text-muted">
          Parámetros de la política de reservas del club.
        </p>
      </header>

      <section className="max-w-[720px]">
        <div className="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-6 border border-border-subtle/50">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-1">
            Reservas activas por usuario
          </h3>
          <p className="font-body-md text-body-md text-text-muted mb-6">
            Número máximo de reservas confirmadas y futuras que puede acumular un mismo usuario
            final. Evita que una persona acapare horarios.
          </p>

          {cargando ? (
            <p className="font-body-md text-body-md text-text-muted">Cargando configuración…</p>
          ) : (
            <form onSubmit={guardar} className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <label
                  htmlFor="tope"
                  className="block font-label-md text-label-md text-text-primary mb-2"
                >
                  Tope actual: <strong>{tope}</strong>
                </label>
                <input
                  id="tope"
                  name="tope"
                  type="number"
                  min={1}
                  step={1}
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border-subtle bg-surface text-text-primary font-body-md focus:outline-none focus:border-secondary"
                />
              </div>
              <button
                type="submit"
                disabled={guardando || sinCambios || valor.trim() === ''}
                className={`py-3 px-6 rounded-lg font-bold font-label-md transition-colors shadow-sm ${
                  guardando || sinCambios || valor.trim() === ''
                    ? 'bg-surface-container text-text-muted cursor-not-allowed'
                    : 'bg-secondary text-on-secondary hover:bg-secondary/90'
                }`}
              >
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </form>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 font-label-md text-label-md text-error bg-error/10 border border-error rounded-lg px-4 py-3"
            >
              {error}
            </p>
          )}

          {aviso && (
            <p
              role="status"
              className="mt-4 font-label-md text-label-md text-success bg-success/10 border border-success rounded-lg px-4 py-3"
            >
              {aviso}
            </p>
          )}

          <p className="mt-6 font-label-sm text-label-sm text-text-muted border-t border-border-subtle pt-4">
            Bajar el tope no cancela nada: las reservas ya confirmadas se conservan y siguen
            ocupando su bloque. El tope se comprueba al crear una reserva, no sobre las existentes.
          </p>
        </div>
      </section>
    </main>
  );
}
