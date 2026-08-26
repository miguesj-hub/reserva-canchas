import './App.css';
import ReportesYEstadisticas from './pages/ReportesYEstadisticas';
import type { PropsDeRemote } from './tipos';

const App = ({ sesion, onLogout }: PropsDeRemote) => (
  <ReportesYEstadisticas sesion={sesion} onLogout={onLogout} />
);

export default App;
