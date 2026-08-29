/**
 * El marco de la aplicación: barra lateral, cabecera y, en móvil, la navegación
 * que corresponda al rol. Vive en el shell y se monta UNA sola vez.
 *
 * Antes de la feature 003 esto estaba duplicado en el layout de cada
 * microfrontend, con dos consecuencias: el menú de administración había que
 * mantenerlo en dos archivos —y se desincronizó—, y cambiar de sección entre
 * remotes remontaba la interfaz entera (2 592 ms medidos, frente a 155–232 ms
 * dentro del mismo remote). La cortina de transición existía para encubrir ese
 * remontado; al desaparecer el remontado, desapareció la cortina.
 *
 * Ahora el shell aporta el marco y cada remote solo el contenido, que es lo que
 * el Principio V exige y lo que el patrón de Module Federation propone.
 *
 * Hay DOS variantes, elegidas por el rol de la sesión y no por el remote activo:
 * el administrador ve su mismo menú tanto en /administracion como en /reportes,
 * que son microfrontends distintos. En móvil, el administrador lleva cabecera con
 * menú desplegable y el socio una barra inferior de pestañas con su acción
 * «Nueva»; ambas se trasladaron tal cual desde los layouts que se borraron.
 */
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  ACCION_MOVIL_SOCIO,
  MENU_ADMINISTRADOR,
  MENU_USUARIO_FINAL,
  sinChrome,
  type EntradaMenu,
} from '../navegacion';

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg font-label-md text-label-md transition-all ${
    isActive
      ? 'bg-secondary text-on-secondary font-bold shadow-md'
      : 'text-on-primary-container/70 hover:bg-secondary-container/20 hover:text-on-primary-container'
  }`;

const bottomLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center space-x-3 px-4 py-3 rounded-lg font-label-md text-label-md transition-all duration-150 ${
    isActive
      ? 'bg-secondary text-on-secondary font-bold shadow-sm'
      : 'text-on-primary-container/70 hover:text-on-primary-container hover:bg-secondary-container/20'
  }`;

function Entradas({ menu, onNavigate }: { menu: EntradaMenu[]; onNavigate?: () => void }) {
  return (
    <ul className="flex-1 space-y-1 w-full overflow-y-auto">
      {menu.map((item) => (
        <li key={item.label}>
          <NavLink to={item.to} end={item.end} className={linkClasses} onClick={onNavigate}>
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

/** Perfil + Cerrar sesión: siempre debajo de un divider, al fondo del menú. */
function PieDelMenu({ onNavigate, onLogout }: { onNavigate?: () => void; onLogout: () => void }) {
  return (
    <div className="px-2 pt-2 border-t border-outline-variant/20 space-y-1">
      <NavLink to="/perfil" onClick={onNavigate} className={bottomLinkClasses}>
        <span className="material-symbols-outlined">person</span>
        <span>Perfil</span>
      </NavLink>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          onLogout();
        }}
        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-label-md text-label-md text-on-primary-container/70 hover:text-error hover:bg-error/10 transition-all"
      >
        <span className="material-symbols-outlined">logout</span>
        <span>Cerrar Sesión</span>
      </button>
    </div>
  );
}

function CabeceraDelMenu({ rotulo }: { rotulo: string }) {
  return (
    <div className="flex items-center space-x-3 px-4 py-6 border-b border-outline-variant/20 mb-2">
      <span className="material-symbols-outlined text-3xl text-secondary-container">
        sports_tennis
      </span>
      <div>
        <h1 className="font-headline-md text-headline-md font-bold text-on-primary">ReservaSport</h1>
        <p className="font-label-sm text-label-sm text-on-primary-container/70">{rotulo}</p>
      </div>
    </div>
  );
}

export function Chrome() {
  const { sesion, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Rutas a pantalla completa: se entrega el contenido desnudo. Ver R-013.
  if (sinChrome(pathname)) return <Outlet />;

  // Sin sesión no hay menú que pintar; el guardia de rol ya está redirigiendo.
  if (!sesion) return <Outlet />;

  const esAdmin = sesion.rol === 'ADMINISTRADOR';
  const menu = esAdmin ? MENU_ADMINISTRADOR : MENU_USUARIO_FINAL;
  const rotulo = esAdmin ? 'Administración' : (sesion.nombre ?? 'Usuario');

  return (
    <div className="bg-background text-text-primary min-h-screen flex w-full">
      {/* Barra lateral — solo escritorio, idéntica para los dos roles */}
      <nav className="chrome-escritorio flex-col p-base space-y-4 fixed left-0 top-0 h-screen w-64 bg-primary-container text-on-primary-container shadow-lg z-40">
        <CabeceraDelMenu rotulo={rotulo} />
        <Entradas menu={menu} />
        <PieDelMenu onLogout={logout} />
      </nav>

      {/* Cajón lateral — solo administrador en móvil */}
      {esAdmin && menuOpen && (
        <div className="chrome-movil fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="relative flex flex-col p-base space-y-4 w-64 h-full bg-primary-container text-on-primary-container shadow-lg">
            <CabeceraDelMenu rotulo={rotulo} />
            <Entradas menu={menu} onNavigate={() => setMenuOpen(false)} />
            <PieDelMenu onNavigate={() => setMenuOpen(false)} onLogout={logout} />
          </nav>
        </div>
      )}

      {/* Barra inferior — solo socio en móvil, con su acción propia */}
      {!esAdmin && (
        <nav className="chrome-movil fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border-subtle shadow-[0_-2px_10px_rgba(15,23,42,0.05)]">
          {menu.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 font-label-sm text-label-sm ${
                  isActive ? 'text-secondary' : 'text-text-muted'
                }`
              }
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to={ACCION_MOVIL_SOCIO.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 font-label-sm text-label-sm ${
                isActive ? 'text-secondary' : 'text-text-muted'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px]">{ACCION_MOVIL_SOCIO.icon}</span>
            {ACCION_MOVIL_SOCIO.label}
          </NavLink>
        </nav>
      )}

      {/*
        El envoltorio del contenido reproduce el que ponía cada layout borrado:
        `.chrome-contenido` deja hueco a la barra lateral en las dos variantes, y
        el relleno solo se aplica en la del socio, porque las páginas de
        administración ya traen el suyo (`p-container-margin` en su <main>).
      */}
      {esAdmin ? (
        <div className="chrome-contenido flex flex-col min-h-screen">
          <header className="chrome-movil bg-surface border-b border-border-subtle shadow-sm sticky top-0 z-30 justify-between items-center px-container-margin h-16 w-full">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Abrir menú"
                onClick={() => setMenuOpen(true)}
                className="text-primary active:scale-95 duration-200"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <span className="font-display text-headline-md font-extrabold text-primary">
                ReservaSport
              </span>
            </div>
            <div className="flex items-center gap-4 text-primary">
              <span className="material-symbols-outlined">notifications</span>
              <div className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center font-bold text-sm text-on-primary-fixed">
                A
              </div>
            </div>
          </header>
          <Outlet />
        </div>
      ) : (
        <main className="chrome-contenido chrome-contenido-socio overflow-y-auto p-container-margin">
          <Outlet />
        </main>
      )}
    </div>
  );
}
