import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BuscarPremiosPage from './pages/BuscarPremiosPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/buscar-premios" element={<BuscarPremiosPage />} />
      </Routes>
    </Router>
  );
}

export default App;
