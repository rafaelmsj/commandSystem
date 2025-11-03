import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Produtos from './pages/Produtos';
import Comandas from './pages/Comandas';
import ComandaDetalhes from './pages/ComandaDetalhes';
import { ListagemRifas } from './pages/ListagemRifas';
import { CadastroRifa } from './pages/CadastroRifa';
import { EdicaoRifa } from './pages/EdicaoRifa';
import { PremiosCliente } from './pages/PremiosCliente';
import { MovimentacoesEstoque } from './pages/MovimentacoesEstoque';
import { FluxoCaixa } from './pages/FluxoCaixa';
import { LavacaoPage } from './pages/LavacaoPage';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

const ListagemRifasWrapper = () => {
  const navigate = useNavigate();
  return (
    <ListagemRifas
      onNovaRifa={() => navigate('/rifas/nova')}
      onEditarRifa={(id) => navigate(`/rifas/editar/${id}`)}
    />
  );
};

const EdicaoRifaWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <EdicaoRifa
      rifaId={id || ''}
      onVoltar={() => navigate('/rifas')}
    />
  );
};



export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="comandas" element={<Comandas />} />
            <Route path="comandas/:id" element={<ComandaDetalhes />} />
            <Route path="rifas" element={<ListagemRifasWrapper />} />
            <Route path="rifas/nova" element={<CadastroRifa />} />
            <Route path="rifas/editar/:id" element={<EdicaoRifaWrapper />} />
            <Route path="premios-cliente" element={<PremiosCliente />} />
            <Route path="estoque/movimentacoes" element={<MovimentacoesEstoque />} />
            <Route path="caixa" element={<FluxoCaixa />} />
            <Route path="lavacao" element={<LavacaoPage />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}
