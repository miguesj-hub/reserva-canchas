import './App.css';
declare const App: ({ token, onLogout }: {
    token?: string;
    onLogout?: () => void;
}) => import("react").JSX.Element;
export default App;
