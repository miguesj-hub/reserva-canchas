import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type Role } from './AuthContext';

/** Ruta de inicio por defecto de cada rol, usada tanto para redirigir "/" como
 * para mandar a un usuario que intenta entrar a una sección que no le corresponde. */
export const HOME_BY_ROLE: Record<Role, string> = {
  admin: '/administracion',
  cliente: '/reservas',
};

/** Restringe un subárbol de rutas a los roles indicados. Si el rol actual no
 * está permitido, redirige al home de ese rol en lugar de mostrar la sección. */
export function RoleRoute({ allow }: { allow: Role[] }) {
  const { role } = useAuth();

  if (!role) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to={HOME_BY_ROLE[role]} replace />;

  return <Outlet />;
}
