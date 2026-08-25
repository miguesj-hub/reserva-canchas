import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import MisReservas from './pages/MisReservas';
import NuevaReserva from './pages/NuevaReserva';
import Disponibilidad from './pages/Disponibilidad';
import './App.css';

const App = ({ token, onLogout }: { token?: string; onLogout?: () => void }) => {
  void token;

  return (
    <Routes>
      {/* La pantalla de nueva reserva es un flujo transaccional a pantalla completa,
          sin la barra de navegación del Layout (así lo define el diseño Stitch). */}
      <Route path="nueva" element={<NuevaReserva />} />
      <Route element={<Layout onLogout={onLogout} />}>
        <Route index element={<MisReservas />} />
        <Route path="disponibilidad" element={<Disponibilidad />} />
      </Route>
    </Routes>
  );
};

export default App;
