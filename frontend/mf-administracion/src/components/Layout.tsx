import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import type { Sesion } from '../tipos';

// Rutas absolutas a propósito: este remote siempre se monta bajo
// /administracion (lo fija el shell). Con rutas relativas como "reservas",
// al hacer clic estando ya en /administracion/reservas, React Router las
// resuelve contra la ruta actual y genera /administracion/reservas/reservas.
const navItems = [
  { to: '/administracion', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/administracion/reservas', label: 'Reservas', icon: 'event_available', end: false },
  { to: '/administracion/canchas', label: 'Canchas', icon: 'sports_tennis', end: false },
  { to: '/administracion/usuarios', label: 'Usuarios', icon: 'group', end: false },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="flex-1 space-y-1 w-full overflow-y-auto">
      {navItems.map((item) => (
        <li key={item.label}>
          <NavLink
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg font-label-md text-label-md transition-all ${
                isActive
                  ? 'bg-secondary text-on-secondary font-bold shadow-md'
                  : 'text-on-primary-container/70 hover:bg-secondary-container/20 hover:text-on-primary-container'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </NavLink>
        </li>
      ))}
      <li>
        <NavLink
          to="/reportes"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg font-label-md text-label-md transition-all ${
              isActive
                ? 'bg-secondary text-on-secondary font-bold shadow-md'
                : 'text-on-primary-container/70 hover:bg-secondary-container/20 hover:text-on-primary-container'
            }`
          }
          onClick={onNavigate}
        >
          <span className="material-symbols-outlined">assessment</span>
          Reportes
        </NavLink>
      </li>
    </ul>
  );
}

// Mismas clases que el bloque inferior de mf-reservas (vista Usuario), para
// que Perfil + Cerrar Sesión se vean idénticos en los tres microfrontends.
const bottomLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center space-x-3 px-4 py-3 rounded-lg font-label-md text-label-md transition-all duration-150 ${
    isActive
      ? 'bg-secondary text-on-secondary font-bold shadow-sm'
      : 'text-on-primary-container/70 hover:text-on-primary-container hover:bg-secondary-container/20'
  }`;

/** Perfil + Cerrar sesión: siempre debajo de un divider, al fondo del menú. */
function BottomMenu({
  onNavigate,
  onLogout,
}: {
  onNavigate?: () => void;
  onLogout?: () => void;
}) {
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
          onLogout?.();
        }}
        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-label-md text-label-md text-on-primary-container/70 hover:text-error hover:bg-error/10 transition-all"
      >
        <span className="material-symbols-outlined">logout</span>
        <span>Cerrar Sesión</span>
      </button>
    </div>
  );
}

export function Layout({
  sesion,
  onLogout,
}: {
  sesion?: Sesion | null;
  onLogout?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-background text-text-primary min-h-screen flex w-full">
      {/* SideNavBar (Desktop) */}
      <aside className="hidden md:flex flex-col p-base space-y-4 bg-primary-container fixed left-0 top-0 h-screen w-64 shadow-lg z-40">
        <div className="flex items-center space-x-3 px-4 py-6 border-b border-outline-variant/20 mb-2">
          <span className="material-symbols-outlined text-3xl text-secondary-container">sports_tennis</span>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-on-primary">ReservaSport</h1>
            <p className="font-label-sm text-label-sm text-on-primary-container/70">
              {sesion?.nombre ?? 'Administración'}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          <NavItems />
        </nav>

        <BottomMenu onLogout={onLogout} />
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-72 h-full bg-primary-container p-base space-y-4 flex flex-col shadow-lg">
            <div className="flex items-center justify-between px-4 py-6 border-b border-outline-variant/20 mb-2">
              <div className="flex items-center space-x-3">
                <span className="material-symbols-outlined text-3xl text-secondary-container">sports_tennis</span>
                <div>
                  <h1 className="font-headline-md text-headline-md font-bold text-on-primary">ReservaSport</h1>
                  <p className="font-label-sm text-label-sm text-on-primary-container/70">Administración</p>
                </div>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)} className="text-on-primary-container">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
              <NavItems onNavigate={() => setMenuOpen(false)} />
            </nav>
            <BottomMenu onNavigate={() => setMenuOpen(false)} onLogout={onLogout} />
          </div>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="flex-1 bg-primary/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Canvas */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen w-full">
        {/* TopNavBar (Mobile only) */}
        <header className="md:hidden bg-surface border-b border-border-subtle shadow-sm sticky top-0 z-30 flex justify-between items-center px-container-margin h-16 w-full">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setMenuOpen(true)}
              className="text-primary active:scale-95 duration-200"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-display text-headline-md font-extrabold text-primary">ReservaSport</span>
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
    </div>
  );
}
