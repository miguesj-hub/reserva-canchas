import { Routes, Route } from 'react-router-dom';
import ReportesYEstadisticas from './pages/ReportesYEstadisticas';
import type { PropsDeRemote } from './tipos';
import './App.css';

/**
 * Este remote expone SOLO su página. El marco lo pinta el shell desde la feature
 * 003; hasta entonces traía su propia copia del menú de administración, que se
 * desincronizó con la de mf-administracion al añadir las pantallas de la 002.
 */
const App = (_props: PropsDeRemote) => (
  <Routes>
    <Route index element={<ReportesYEstadisticas />} />
  </Routes>
);

export default App;
