// Declaraciones de los módulos federados.
//
// TypeScript no puede resolver `mfReservas/App`: ese módulo no existe en disco,
// lo entrega otro proceso en tiempo de ejecución. Sin estas declaraciones el
// editor marca error y `tsc` falla, aunque la aplicación funcione.
//
// La ruta debe coincidir con lo que cada remote declara en `exposes`:
//   exposes: { './App': './src/App.tsx' }   ->   'mfReservas/App'

declare module 'mfReservas/App' {
  const App: React.ComponentType<{ token: string; onLogout: () => void }>;
  export default App;
}

declare module 'mfAdministracion/App' {
  const App: React.ComponentType<{ token: string; onLogout: () => void }>;
  export default App;
}

declare module 'mfReportes/App' {
  const App: React.ComponentType<{ token: string; onLogout: () => void }>;
  export default App;
}
