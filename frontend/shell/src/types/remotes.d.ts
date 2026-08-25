// Declaraciones de los módulos federados.
//
// TypeScript no puede resolver `mfReservas/App`: ese módulo no existe en disco,
// lo entrega otro proceso en tiempo de ejecución. Sin estas declaraciones el
// editor marca error y `tsc` falla, aunque la aplicación funcione.
//
// La ruta debe coincidir con lo que cada remote declara en `exposes`:
//   exposes: { './App': './src/App.tsx' }   ->   'mfReservas/App'
//
// La prop es `sesion`, no un token: la autenticación es HTTP Basic contra el
// gateway (R-003), así que no hay token que repartir. Lo que el remote necesita
// es saber quién es el usuario y con qué rol, para pintar la pantalla; la
// credencial la adjunta el cliente HTTP desde localStorage.
//
// El tipo se importa en línea, no con un `import` de cabecera: un `.d.ts` con
// import de primer nivel deja de ser global y `declare module` pasaría a
// significar "aumentar un módulo existente", que es otra cosa.

type PropsDeRemote = {
  sesion: import('../auth/AuthContext').Sesion | null;
  onLogout: () => void;
};

declare module 'mfReservas/App' {
  const App: React.ComponentType<PropsDeRemote>;
  export default App;
}

declare module 'mfAdministracion/App' {
  const App: React.ComponentType<PropsDeRemote>;
  export default App;
}

declare module 'mfReportes/App' {
  const App: React.ComponentType<PropsDeRemote>;
  export default App;
}
