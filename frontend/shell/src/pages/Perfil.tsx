import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Perfil() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

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
              Gestiona tu información personal y preferencias.
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter md:gap-[24px]">
          {/* Columna izquierda: tarjeta de identidad */}
          <div className="lg:col-span-4 flex flex-col gap-gutter">
            <div className="bg-surface rounded-xl shadow-[0_4px_20px_rgba(15,23,42,0.05)] p-[24px] flex flex-col items-center text-center">
              <div className="relative mb-6 group cursor-pointer">
                <img
                  alt="Avatar del usuario"
                  className="w-32 h-32 rounded-full object-cover border-4 border-surface shadow-sm group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTI8mF1Ks8alT0_BwAnNDFejKUZOeV4nnDXHy9AeSu1hESi-ZSH4zp5Ef8YathOUp0LbvZZTYBxLHy1FP_9-x4C7Eu5f6WSKQ_wuX3qxydcxRyFCOdqGs_XyMl2gM4bGGHqquM0GfmXVDPEQ5uz9iuq0o_KSEPcNGWKm5l00IkFVNRGXUCqNmQs2ZWtoSZ2Y31b-JKyujaCPxEUiwcsC_JsPCHe4XpYuS1kTzkWJsjK_DXx72exr6h"
                />
                <div className="absolute bottom-0 right-0 bg-secondary text-on-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-md border-2 border-surface hover:bg-secondary/90 transition-colors">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </div>
              </div>
              <h3 className="font-headline-md text-headline-md text-text-primary mb-1">
                Carlos Mendoza
              </h3>
              <p className="font-body-md text-body-md text-text-muted mb-4">
                Usuario Final
              </p>
              <div className="w-full border-t border-border-subtle pt-4 mt-2">
                <div className="flex items-center gap-3 py-3 text-left">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-label-sm text-label-sm text-text-muted">
                      Correo Electrónico
                    </p>
                    <p className="font-body-md text-body-md text-text-primary truncate">
                      carlos.mendoza@email.com
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3 text-left">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined">phone</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-label-sm text-label-sm text-text-muted">
                      Teléfono
                    </p>
                    <p className="font-body-md text-body-md text-text-primary">
                      +593 99 123 4567
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha: actividad y ajustes */}
          <div className="lg:col-span-8 flex flex-col gap-gutter md:gap-[24px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter md:gap-[24px]">
              <div className="bg-surface rounded-xl shadow-[0_4px_20px_rgba(15,23,42,0.05)] p-[24px] flex items-center justify-between hover:shadow-md transition-shadow duration-300">
                <div>
                  <p className="font-label-md text-label-md text-text-muted mb-1">
                    Reservas Totales
                  </p>
                  <p className="font-display text-display text-text-primary">24</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-3xl">
                    event_available
                  </span>
                </div>
              </div>
              <div className="bg-surface rounded-xl shadow-[0_4px_20px_rgba(15,23,42,0.05)] p-[24px] flex items-center justify-between hover:shadow-md transition-shadow duration-300">
                <div>
                  <p className="font-label-md text-label-md text-text-muted mb-1">
                    Deporte Favorito
                  </p>
                  <p className="font-headline-sm text-headline-sm text-text-primary font-bold mt-2">
                    Pádel
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center text-success">
                  <span className="material-symbols-outlined text-3xl">
                    sports_tennis
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-[0_4px_20px_rgba(15,23,42,0.05)] overflow-hidden">
              <div className="p-[24px] border-b border-border-subtle">
                <h3 className="font-headline-sm text-headline-sm text-text-primary">
                  Ajustes de Cuenta
                </h3>
              </div>
              <div className="divide-y divide-border-subtle">
                <div className="p-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-bright transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-text-muted group-hover:text-secondary group-hover:bg-secondary-container/20 transition-colors">
                      <span className="material-symbols-outlined">lock</span>
                    </div>
                    <div>
                      <p className="font-body-md text-body-md font-semibold text-text-primary">
                        Contraseña
                      </p>
                      <p className="font-label-sm text-label-sm text-text-muted">
                        Actualizada hace 2 meses
                      </p>
                    </div>
                  </div>
                  <button
                    className="px-4 py-2 bg-surface border border-border-subtle rounded-lg font-label-md text-label-md text-text-primary hover:border-secondary hover:text-secondary transition-colors"
                    type="button"
                  >
                    Cambiar
                  </button>
                </div>

                <div className="p-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-bright transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-text-muted group-hover:text-secondary group-hover:bg-secondary-container/20 transition-colors">
                      <span className="material-symbols-outlined">
                        notifications_active
                      </span>
                    </div>
                    <div>
                      <p className="font-body-md text-body-md font-semibold text-text-primary">
                        Notificaciones
                      </p>
                      <p className="font-label-sm text-label-sm text-text-muted">
                        Alertas de reservas y promociones
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      className="sr-only peer"
                      defaultChecked
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
                  </label>
                </div>

                <div className="p-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-bright transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-text-muted group-hover:text-secondary group-hover:bg-secondary-container/20 transition-colors">
                      <span className="material-symbols-outlined">credit_card</span>
                    </div>
                    <div>
                      <p className="font-body-md text-body-md font-semibold text-text-primary">
                        Métodos de Pago
                      </p>
                      <p className="font-label-sm text-label-sm text-text-muted">
                        Gestiona tus tarjetas guardadas
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-text-muted group-hover:text-secondary transition-colors">
                    chevron_right
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
