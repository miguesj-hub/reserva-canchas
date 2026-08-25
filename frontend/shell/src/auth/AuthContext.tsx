import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  borrarCredencial,
  guardarCredencial,
  hayCredencial,
} from '../api/client';

const SESION_KEY = 'reservasport_sesion';

/** Vocabulario canónico de §3.1 (R-001): idéntico en la base, el contrato y aquí. */
export type Role = 'USUARIO_FINAL' | 'ADMINISTRADOR';

/**
 * La identidad de quien está usando la aplicación. Es lo que el shell baja a
 * cada remote como prop, para que ninguno tenga que volver a preguntar quién
 * es el usuario ni leer localStorage por su cuenta (Principio V).
 */
export type Sesion = {
  usuarioId: number;
  username: string;
  nombre: string;
  rol: Role;
};

/** Lo que devuelve POST /api/auth/login y POST /api/auth/registro. */
type UsuarioResponse = {
  id: number;
  username: string;
  nombre: string;
  rol: Role;
  activo: boolean;
};

type AuthContextValue = {
  sesion: Sesion | null;
  isAuthenticated: boolean;
  /** Lanza ApiError si la credencial no sirve o la cuenta está inactiva. */
  login: (username: string, password: string) => Promise<Sesion>;
  /** Registra un USUARIO_FINAL y deja la sesión abierta. Lanza ApiError si el username existe. */
  registrar: (username: string, nombre: string, password: string) => Promise<Sesion>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);

  // Al recargar la página, la sesión se recupera de localStorage. Se exige que
  // estén las dos piezas —identidad y credencial—: sin la credencial, cada
  // llamada a /api daría 401 y el usuario vería una sesión que no sirve.
  useEffect(() => {
    const guardada = localStorage.getItem(SESION_KEY);
    if (guardada && hayCredencial()) {
      setSesion(JSON.parse(guardada) as Sesion);
    } else {
      borrarCredencial();
      localStorage.removeItem(SESION_KEY);
    }
  }, []);

  function abrirSesion(usuario: UsuarioResponse, username: string, password: string): Sesion {
    const nueva: Sesion = {
      usuarioId: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };
    // La credencial se guarda solo después de que el backend la aceptó: nunca
    // se conserva una que no sirve.
    guardarCredencial(username, password);
    localStorage.setItem(SESION_KEY, JSON.stringify(nueva));
    setSesion(nueva);
    return nueva;
  }

  async function login(username: string, password: string): Promise<Sesion> {
    const usuario = await api<UsuarioResponse>('/auth/login', {
      method: 'POST',
      body: { username: username.trim(), password },
      publica: true,
    });
    return abrirSesion(usuario, username.trim(), password);
  }

  async function registrar(
    username: string,
    nombre: string,
    password: string,
  ): Promise<Sesion> {
    const usuario = await api<UsuarioResponse>('/auth/registro', {
      method: 'POST',
      body: { username: username.trim(), nombre: nombre.trim(), password },
      publica: true,
    });
    return abrirSesion(usuario, username.trim(), password);
  }

  function logout() {
    borrarCredencial();
    localStorage.removeItem(SESION_KEY);
    setSesion(null);
  }

  return (
    <AuthContext.Provider
      value={{
        sesion,
        isAuthenticated: sesion !== null,
        login,
        registrar,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
