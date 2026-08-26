import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type Role } from './AuthContext';

/** Ruta de inicio por defecto de cada rol, usada tanto para redirigir "/" como
 * para mandar a un usuario que intenta entrar a una sección que no le corresponde.
 *
 * Las rutas del navegador no cambian con R-001: lo que cambia son los nombres
 * de los roles, que ahora son los mismos en la base, el contrato y la pantalla. */
export const HOME_BY_ROLE: Record<Role, string> = {
  ADMINISTRADOR: '/administracion',
  USUARIO_FINAL: '/reservas',
};

/** Restringe un subárbol de rutas a los roles indicados. Si el rol actual no
 * está permitido, redirige al home de ese rol en lugar de mostrar la sección.
 *
 * Es una comodidad de navegación, no la autorización: quien la aplica de verdad
 * es el backend a partir de X-User-Role (FR-006). Un usuario que llame a la API
 * a mano recibe 403 aunque se salte esta pantalla. */
export function RoleRoute({ allow }: { allow: Role[] }) {
  const { sesion } = useAuth();

  if (!sesion) return <Navigate to="/login" replace />;
  if (!allow.includes(sesion.rol)) return <Navigate to={HOME_BY_ROLE[sesion.rol]} replace />;

  return <Outlet />;
}
