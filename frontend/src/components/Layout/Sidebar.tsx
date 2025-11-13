import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  Package,
  FileText,
  BarChart3,
  Ticket,
  Gift,
  Repeat,
  Car,
  Wallet,
  Menu,
  Settings,
  X
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Fluxo de Caixa', href: '/caixa', icon: Wallet },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Produtos', href: '/produtos', icon: Package },
  { name: 'Comandas', href: '/comandas', icon: FileText },
  { name: 'Rifas', href: '/rifas', icon: Ticket },
  { name: 'Prêmios', href: '/premios-cliente', icon: Gift },
  { name: 'Movimentações', href: '/estoque/movimentacoes', icon: Repeat },
  { name: 'Lavação', href: '/lavacao', icon: Car },
  { name: 'Configurações', href: '/usuarios', icon: Settings },
  
];



export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 🔹 Botão de menu (visível apenas em mobile) */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-md bg-white shadow-md text-gray-700 hover:bg-gray-100 transition"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* 🔹 Sidebar em telas grandes */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-xl">
          <div className="flex h-16 shrink-0 items-center">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">CommandSystem</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* 🔹 Sidebar móvel (abre/fecha com o botão) */}
      <div
        className={`fixed inset-0 z-40 flex transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:hidden`}
      >
        {/* Fundo escuro quando o menu está aberto */}
        <div
          className="fixed inset-0 bg-black bg-opacity-40"
          onClick={() => setOpen(false)}
        ></div>

        <div className="relative flex w-64 flex-col bg-white px-6 pb-4 shadow-xl z-50">
          <div className="flex h-16 shrink-0 items-center">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">CommandSystem</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)} // fecha o menu ao clicar
                  className={({ isActive }) =>
                    `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
