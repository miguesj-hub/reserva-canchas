import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { InactivityGuard } from './auth/InactivityGuard';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { RoleRoute, HOME_BY_ROLE } from './auth/RoleRoute';
import { Chrome } from './components/Chrome';
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

/**
 * Layout autenticado. Desde la feature 003, el shell aporta el MARCO —barra
 * lateral, cabecera y navegación— y cada remote solo el contenido, que es lo que
 * exige el Principio V y lo que propone el patrón de Module Federation.
 *
 * `Chrome` se monta como ruta padre de todo lo autenticado: así permanece montado
 * al cambiar de sección, incluso cuando la sección de destino la sirve otro
 * microfrontend. Antes cada remote traía su propio menú, y saltar de
 * /administracion a /reportes remontaba la interfaz entera.
 */
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

        {/* Todo lo de dentro se pinta dentro del marco. Chrome decide por sí
            mismo entregar el contenido desnudo en las rutas a pantalla completa
            (RUTAS_SIN_CHROME), de modo que el remote se monta una sola vez. */}
        <Route element={<Chrome />}>
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
