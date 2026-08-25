import './App.css';
import ReportesYEstadisticas from './pages/ReportesYEstadisticas';

const App = ({ token, onLogout }: { token?: string; onLogout?: () => void }) => {
  void token;
  return <ReportesYEstadisticas onLogout={onLogout} />;
};

export default App;
