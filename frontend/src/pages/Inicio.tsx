import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Package, ClipboardList, Trophy, DollarSign } from 'lucide-react';
import { Card } from '../components/UI/CardRifa';
import { Button } from '../components/UI/ButtonRifa';

export default function Dashboard() {
  const navigate = useNavigate();

  const atalhos = [
    { titulo: 'Clientes', icone: <Users className="h-6 w-6 text-blue-600" />, rota: '/clientes' },
    { titulo: 'Produtos', icone: <Package className="h-6 w-6 text-green-600" />, rota: '/produtos' },
    { titulo: 'Comandas', icone: <ClipboardList className="h-6 w-6 text-purple-600" />, rota: '/comandas' },
    { titulo: 'Rifas', icone: <Trophy className="h-6 w-6 text-yellow-600" />, rota: '/rifas' },
    { titulo: 'Fluxo de Caixa', icone: <DollarSign className="h-6 w-6 text-emerald-600" />, rota: '/caixa' }, // ✅ novo atalho
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Painel de Controle</h1>
        <p className="text-gray-600 mt-2">
          Bem-vindo! Escolha abaixo o módulo que deseja acessar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {atalhos.map((item) => (
          <Card key={item.titulo} className="hover:shadow-lg transition cursor-pointer">
            <div
              className="flex flex-col items-center justify-center text-center space-y-4"
              onClick={() => navigate(item.rota)}
            >
              {item.icone}
              <h3 className="text-lg font-semibold text-gray-800">{item.titulo}</h3>
              <Button onClick={() => navigate(item.rota)}>Acessar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
