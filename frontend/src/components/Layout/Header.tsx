import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, LogOut, KeyRound, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import SearchBar from '../UI/SearchBar';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Dropdown state
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora do dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Expressão regular para rota de detalhes da comanda
  const detailRoutePattern = /^\/comandas\/\w+$/;

  // Rotas onde a barra de busca é OCULTADA
  const hiddenOnRoutes = [
    '/',
    '/comandas',
    '/premios-cliente',
    '/lavacao',
    '/estoque/movimentacoes',
    '/caixa',
    '/usuarios',
    '/usuarios/alterar-senha',
    '/usuarios/novo'
  ];

  const shouldShowSearchBar =
    !hiddenOnRoutes.some(route => location.pathname === route) &&
    !detailRoutePattern.test(location.pathname) &&
    !location.pathname.includes('rifas');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const goToChangePassword = () => {
    navigate('/usuarios/alterar-senha');
    setOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left */}
          <h1 className="text-xl font-semibold text-gray-800">Meu Bar</h1>

          {/* Center */}
          <div className="flex-1 flex justify-center px-4 lg:px-0">
            {shouldShowSearchBar && <SearchBar placeholder="Pesquisar..." />}
          </div>

          {/* Right */}
          <div className="flex items-center space-x-6">

           {/* User Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
              >
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>

                <div className="hidden md:flex flex-col text-left leading-tight">
                  <span className="text-sm font-medium">{user?.nome || user?.name}</span>
                  <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                </div>

                <ChevronDown className={`h-4 w-4 transition-transform ${
                  open ? "rotate-180" : ""
                }`} />
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg border border-gray-200 rounded-md py-1 z-50">
                  
                  <button
                    onClick={goToChangePassword}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <KeyRound className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </button>

                  <button
                    onClick={logout}
                    className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
