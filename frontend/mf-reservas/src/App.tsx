import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import MisReservas from './pages/MisReservas';
import NuevaReserva from './pages/NuevaReserva';
import Disponibilidad from './pages/Disponibilidad';
import type { PropsDeRemote } from './tipos';
import './App.css';

const App = ({ sesion, onLogout }: PropsDeRemote) => (
  <Routes>
    {/* La pantalla de nueva reserva es un flujo transaccional a pantalla completa,
        sin la barra de navegación del Layout (así lo define el diseño Stitch). */}
    <Route path="nueva" element={<NuevaReserva sesion={sesion} />} />
    <Route element={<Layout sesion={sesion} onLogout={onLogout} />}>
      <Route index element={<MisReservas />} />
      <Route path="disponibilidad" element={<Disponibilidad />} />
    </Route>
  </Routes>
);

export default App;
