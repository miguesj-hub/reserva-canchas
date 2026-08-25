import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NuevaReserva() {
  const navigate = useNavigate();
  const [notas, setNotas] = useState('');
  const [mostrarToast, setMostrarToast] = useState(false);

  const confirmar = () => {
    setMostrarToast(true);
    setTimeout(() => setMostrarToast(false), 5000);
  };

  return (
    <div className="bg-background text-text-primary min-h-screen flex">
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-gutter md:px-container-margin py-section-gap flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl mb-8 flex items-center">
          <button
            type="button"
            onClick={() => navigate('..')}
            className="flex items-center text-secondary hover:text-secondary-container transition-colors duration-200"
          >
            <span className="material-symbols-outlined mr-2">arrow_back</span>
            <span className="font-label-md text-label-md">Volver a Canchas</span>
          </button>
        </div>

        <div className="w-full max-w-3xl bg-surface rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-border-subtle p-6 md:p-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-secondary" />
          <div className="mb-8 text-center">
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">
              Confirmar Reserva
            </h1>
            <p className="font-body-md text-body-md text-text-muted">
              Por favor, revisa los detalles antes de confirmar tu reserva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-surface-container-low rounded-lg p-6 border border-border-subtle hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed mr-4 shrink-0">
                  <span className="material-symbols-outlined">sports_tennis</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-1">Cancha de Padel 1</h3>
                  <span className="inline-block px-3 py-1 bg-surface rounded-full text-text-muted font-label-sm text-label-sm border border-border-subtle">
                    Padel Pro
                  </span>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-border-subtle">
                <div className="flex items-center text-text-muted">
                  <span className="material-symbols-outlined mr-3 text-secondary">calendar_today</span>
                  <span className="font-body-md text-body-md">14 de Octubre, 2023</span>
                </div>
                <div className="flex items-center text-text-muted">
                  <span className="material-symbols-outlined mr-3 text-secondary">schedule</span>
                  <span className="font-body-md text-body-md">18:00 - 19:00 (1 hora)</span>
                </div>
                <div className="flex items-center text-text-muted">
                  <span className="material-symbols-outlined mr-3 text-secondary">location_on</span>
                  <span className="font-body-md text-body-md">Sede Norte</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  confirmar();
                }}
              >
                <div>
                  <label className="block font-label-md text-label-md text-primary mb-1" htmlFor="player-name">
                    Nombre del Jugador
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                      person
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-surface border border-border-subtle rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all text-primary font-body-md"
                      id="player-name"
                      readOnly
                      type="text"
                      value="Juan Pérez"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-primary mb-1" htmlFor="notes">
                    Notas Adicionales (Opcional)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all text-primary font-body-md resize-none"
                    id="notes"
                    placeholder="Ej: Necesito alquilar raquetas..."
                    rows={3}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                  />
                </div>
                <div className="bg-surface-bright rounded-lg p-4 border border-border-subtle flex justify-between items-center mt-auto">
                  <span className="font-body-md text-body-md text-text-muted">Total a pagar en club</span>
                  <span className="font-headline-md text-headline-md text-primary font-bold">$25.00</span>
                </div>
              </form>
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-end gap-4 border-t border-border-subtle pt-6 mt-6">
            <button
              type="button"
              onClick={() => navigate('..')}
              className="px-6 py-3 rounded-lg border border-secondary text-secondary font-label-md text-label-md hover:bg-surface-container-low transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmar}
              className="px-8 py-3 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container/90 active:scale-95 transition-all duration-200 shadow-sm flex items-center justify-center"
            >
              <span className="material-symbols-outlined mr-2">check_circle</span>
              Confirmar Reserva
            </button>
          </div>
        </div>
      </main>

      <div
        className={`fixed bottom-6 right-6 left-6 md:left-auto transition-all duration-300 ease-out z-50 flex items-center bg-surface p-4 rounded-lg shadow-lg border-l-4 border-success md:min-w-[300px] ${
          mostrarToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <span className="material-symbols-outlined text-success mr-3">check_circle</span>
        <div>
          <h4 className="font-label-md text-label-md text-primary">Reserva Confirmada</h4>
          <p className="font-label-sm text-label-sm text-text-muted">Tu cancha de padel ha sido reservada con éxito.</p>
        </div>
        <button
          type="button"
          className="ml-auto text-text-muted hover:text-primary transition-colors"
          onClick={() => setMostrarToast(false)}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
}
