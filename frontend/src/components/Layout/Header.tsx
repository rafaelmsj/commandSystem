import React from 'react';
import { Bell, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import SearchBar from '../UI/SearchBar';

export default function Header() {
  const location = useLocation();

  // Expressão regular para rota de detalhes da comanda
  const detailRoutePattern = /^\/comandas\/\w+$/;

  // Lista de rotas onde a barra de pesquisa deve ser OCULTADA
  const hiddenOnRoutes = [
    '/',
    '/comandas',
    '/premios-cliente',
    '/lavacao',
    '/estoque/movimentacoes',
    '/caixa',
  ];

  // Verifica se a rota atual deve ocultar a barra
  const shouldShowSearchBar =
    !hiddenOnRoutes.some(route => location.pathname === route) && // Rota exata
    !detailRoutePattern.test(location.pathname) && // Detalhes de comanda
    !location.pathname.includes('rifas'); // Qualquer rota que contenha "rifas"

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Lado Esquerdo */}
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Meu Bar</h1>
          </div>

          {/* Centro (Barra de Busca) */}
          <div className="flex-1 flex justify-center px-4 lg:px-0">
            {shouldShowSearchBar && <SearchBar placeholder="Pesquisar..." />}
          </div>

          {/* Lado Direito */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700">
              <Bell className="h-6 w-6" />
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <User className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
