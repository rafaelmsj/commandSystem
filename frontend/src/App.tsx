import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom';
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
import ConfiguracoesUsuarios from './pages/ConfiguracoesUsuarios';
import UsuariosListagem from './pages/UsuariosListagem';
import UsuariosCriar from './pages/UsuariosCriar';
import UsuariosAlterarSenha from './pages/UsuariosAlterarSenha';

// === Protected & Public Route wrappers ===
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      // Aqui você pode validar o token com o backend se quiser
      const payload = JSON.parse(atob(token.split('.')[1] || '{}'));
      const exp = payload.exp;
      const now = Date.now() / 1000;
      if (exp && exp > now) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// === Wrappers auxiliares ===
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
  return <EdicaoRifa rifaId={id || ''} onVoltar={() => navigate('/rifas')} />;
};

// === Router principal ===
export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Rota pública */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Rotas protegidas */}
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
            <Route path="usuarios/configuracoes" element={<ConfiguracoesUsuarios />} />
            <Route path="usuarios" element={<UsuariosListagem />} />
            <Route path="usuarios/novo" element={<UsuariosCriar />} />
            <Route path="usuarios/alterar-senha" element={<UsuariosAlterarSenha />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}
