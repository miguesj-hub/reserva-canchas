import { Routes, Route } from 'react-router-dom';
import MisReservas from './pages/MisReservas';
import NuevaReserva from './pages/NuevaReserva';
import Disponibilidad from './pages/Disponibilidad';
import type { PropsDeRemote } from './tipos';
import './App.css';

/**
 * Este remote expone SOLO sus páginas. El marco lo pinta el shell desde la
 * feature 003.
 *
 * `nueva` sigue siendo una ruta de este remote: lo que cambia es que quien decide
 * mostrarla a pantalla completa, sin marco, es el shell, a través de su lista
 * RUTAS_SIN_CHROME. El diseño de ese flujo transaccional no cambia.
 */
const App = ({ sesion }: PropsDeRemote) => (
  <Routes>
    <Route index element={<MisReservas />} />
    <Route path="disponibilidad" element={<Disponibilidad />} />
    <Route path="nueva" element={<NuevaReserva sesion={sesion} />} />
  </Routes>
);

export default App;
