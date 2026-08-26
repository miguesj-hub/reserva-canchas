/**
 * La sesión que baja el shell como prop (R-002). Misma forma que declara
 * `shell/src/auth/AuthContext.tsx`; se redeclara aquí en vez de importarla
 * porque los remotes no comparten código entre paquetes (Principio V).
 */
export type Sesion = {
  usuarioId: number;
  username: string;
  nombre: string;
  rol: 'USUARIO_FINAL' | 'ADMINISTRADOR';
};

export type PropsDeRemote = {
  sesion?: Sesion | null;
  onLogout?: () => void;
};
