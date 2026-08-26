import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { InactivityGuard } from './auth/InactivityGuard';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { RoleRoute, HOME_BY_ROLE } from './auth/RoleRoute';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import './App.css';

// Cada remote se descarga solo cuando el usuario entra a su ruta. Hasta
// entonces no se pide su remoteEntry.js: es lo que hace que el shell arranque
// rápido aunque haya muchos microfrontends.
const Reservas = lazy(() => import('mfReservas/App'));
const Administracion = lazy(() => import('mfAdministracion/App'));
const Reportes = lazy(() => import('mfReportes/App'));

/** Envuelve un remote con su red de seguridad: aislamiento de fallos + espera. */
function Remoto({
  nombre,
  children,
}: {
  nombre: string;
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary nombre={nombre}>
      <Suspense fallback={<p className="p-4">Cargando {nombre}…</p>}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/** Layout autenticado: la navegación entre secciones vive solo en el menú
 * lateral de cada remote (mf-reservas / mf-administracion), no aquí. El shell
 * solo enruta y aísla fallos. */
function AppLayout() {
  const { sesion, logout } = useAuth();

  return (
    <main>
      <InactivityGuard />
      <Routes>
        <Route
          path="/"
          element={<Navigate to={sesion ? HOME_BY_ROLE[sesion.rol] : '/login'} replace />}
        />

        <Route path="/perfil" element={<Perfil />} />

        {/* Cada sección queda restringida a su rol: si un cliente entra a
            /administracion (o viceversa) RoleRoute lo redirige a su home. */}
        <Route element={<RoleRoute allow={['USUARIO_FINAL']} />}>
          <Route
            path="/reservas/*"
            element={
              <Remoto nombre="Reservas">
                <Reservas sesion={sesion} onLogout={logout} />
              </Remoto>
            }
          />
        </Route>

        <Route element={<RoleRoute allow={['ADMINISTRADOR']} />}>
          <Route
            path="/administracion/*"
            element={
              <Remoto nombre="Administración">
                <Administracion sesion={sesion} onLogout={logout} />
              </Remoto>
            }
          />
          <Route
            path="/reportes/*"
            element={
              <Remoto nombre="Reportes">
                <Reportes sesion={sesion} onLogout={logout} />
              </Remoto>
            }
          />
        </Route>
      </Routes>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<AppLayout />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
