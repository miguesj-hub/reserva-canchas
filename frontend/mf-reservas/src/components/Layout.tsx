import { NavLink, Outlet } from 'react-router-dom';
import type { Sesion } from '../tipos';

// Rutas absolutas a propósito: este remote siempre se monta bajo /reservas
// (lo fija el shell). Con rutas relativas como "disponibilidad", al hacer
// clic estando ya en /reservas/disponibilidad, React Router las resuelve
// contra la ruta actual y genera /reservas/disponibilidad/disponibilidad.
const navItems = [
  { to: '/reservas', label: 'Mis Reservas', icon: 'event_available', end: true },
  { to: '/reservas/disponibilidad', label: 'Disponibilidad', icon: 'dashboard', end: false },
];

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center space-x-3 px-4 py-3 rounded-lg font-label-md text-label-md transition-all duration-150 ${
    isActive
      ? 'bg-secondary text-on-secondary font-bold shadow-sm'
      : 'text-on-primary-container/70 hover:text-on-primary-container hover:bg-secondary-container/20'
  }`;

export function Layout({
  sesion,
  onLogout,
}: {
  sesion?: Sesion | null;
  onLogout?: () => void;
}) {
  return (
    <div className="bg-background text-text-primary min-h-screen flex">
      {/* TopNavBar (solo mobile) */}
      <nav className="md:hidden sticky top-0 z-50 flex justify-between items-center px-container-margin h-16 w-full bg-surface shadow-sm border-b border-border-subtle">
        <div className="font-display text-headline-md font-extrabold text-primary">ReservaSport</div>
        <NavLink to="/perfil" className="flex items-center">
          <span className="material-symbols-outlined text-text-primary">person</span>
        </NavLink>
      </nav>

      {/* SideNavBar (solo desktop) */}
      <nav className="hidden md:flex flex-col p-base space-y-4 fixed left-0 top-0 h-screen w-64 bg-primary-container text-on-primary-container shadow-md z-40">
        <div className="flex items-center space-x-3 px-4 py-6 border-b border-outline-variant/20 mb-2">
          <span className="material-symbols-outlined text-3xl text-secondary-container">sports_tennis</span>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-on-primary">ReservaSport</h1>
            <p className="font-label-sm text-label-sm text-on-primary-container/70">
              {sesion?.nombre ?? 'Usuario'}
            </p>
          </div>
        </div>

        <NavLink
          to="/reservas/nueva"
          className="mx-2 my-2 py-3 bg-secondary text-on-secondary rounded-lg font-bold font-label-md text-center hover:bg-secondary/90 transition-colors shadow-sm"
        >
          Nueva Reserva
        </NavLink>

        <div className="flex-grow space-y-1 px-2 mt-2">
          {navItems.map((item) => (
            <NavLink key={item.label} to={item.to} end={item.end} className={linkClasses}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Perfil + Cerrar sesión: siempre debajo de un divider, al fondo del menú. */}
        <div className="px-2 pt-2 border-t border-outline-variant/20 space-y-1">
          <NavLink to="/perfil" className={linkClasses}>
            <span className="material-symbols-outlined">person</span>
            <span>Perfil</span>
          </NavLink>
          <button
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-label-md text-label-md text-on-primary-container/70 hover:text-error hover:bg-error/10 transition-all"
            onClick={onLogout}
            type="button"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </nav>

      {/* Bottom TabBar (solo mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex bg-surface border-t border-border-subtle shadow-[0_-2px_10px_rgba(15,23,42,0.05)]">
        {navItems.map((item) => (
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
          to="/reservas/nueva"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 font-label-sm text-label-sm ${
              isActive ? 'text-secondary' : 'text-text-muted'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px]">add_circle</span>
          Nueva
        </NavLink>
      </nav>

      {/* Contenido */}
      <main className="flex-1 md:ml-64 overflow-y-auto p-container-margin pb-24 md:pb-container-margin w-full">
        <Outlet />
      </main>
    </div>
  );
}
