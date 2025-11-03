import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Users, FileText, Car, Package, AlertTriangle } from 'lucide-react';
import Card from '../components/UI/Card';
import { DashboardData, ProdutoMaisVendido, Comanda } from '../types';
import { dashboardService, lavacaoService, estoqueService } from '../services/api';

export default function Dashboard() {
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<ProdutoMaisVendido[]>([]);
  const [comandasRecentes, setComandasRecentes] = useState<Comanda[]>([]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lavacoesAbertas, setLavacoesAbertas] = useState({ total_abertas: 0, valor_aberto: 0 });
  const [produtosEstoqueBaixo, setProdutosEstoqueBaixo] = useState([]);
  const [lavacoesAntigas, setLavacoesAntigas] = useState([]);


  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [
        produtosResponse,
        comandasResponse,
        lavacoesResponse,
        estoqueResponse,
        antigasResponse,
      ] = await Promise.all([
        dashboardService.getProdutosMaisVendidos(),
        dashboardService.getComandasRecentes(),
        lavacaoService.getAbertas(),
        estoqueService.getBaixo(),
        lavacaoService.getAntigas(),
      ]);

      setProdutosMaisVendidos(produtosResponse.data);
      setComandasRecentes(comandasResponse.data);
      setLavacoesAbertas(lavacoesResponse.data.resumo || { total_abertas: 0, valor_aberto: 0 });
      setProdutosEstoqueBaixo(estoqueResponse.data || []);
      setLavacoesAntigas(antigasResponse.data.lavacoes || []);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Comandas Abertas',
      value: comandasRecentes.filter(c => c.status === 'Aberta').length.toString(),
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      name: 'Valor de Comandas Abertas',
      value: `R$ ${comandasRecentes
        .filter(c => c.status === 'Aberta')
        .reduce((acc, c) => acc + parseFloat(c.valorTotal || 0), 0)
        .toFixed(2)}`,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      name: 'Lavações em Aberto',
      value: lavacoesAbertas.total_abertas.toString(),
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Valor de Lavações em Aberto',
      value: `R$ ${parseFloat(lavacoesAbertas.valor_aberto || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];


  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Visão geral do seu bar</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Comandas com maior tempo aberta
          </h3>
          <div className="space-y-3">
            {comandasRecentes.length > 0 ? (
              comandasRecentes.slice(0, 5).map((comanda) => (
                <div key={comanda.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{comanda.clienteNome}</p>
                    <p className="text-sm text-gray-600">Total: R$ {comanda.valorTotal} -
                      Aberto: {new Date(comanda.createdAt).toLocaleDateString('pt-BR')}

                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${comanda.status === 'Aberta'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {comanda.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Nenhuma comanda recente.</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Produtos Mais Vendidos
          </h3>
          <div className="space-y-3">
            {produtosMaisVendidos.length > 0 ? (
              produtosMaisVendidos.map((produto) => (
                <div key={produto.nome} className="flex justify-between items-center">
                  <span className="text-gray-900">{produto.nome}</span>
                  <span className="text-gray-600 font-medium">{parseInt(produto.totalVendido)} unidades</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Nenhum produto vendido ainda.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
    <AlertTriangle className="h-5 w-5 text-yellow-500" />
    Produtos com Baixo Estoque
  </h3>

  {/* 🔽 Div com altura fixa e rolagem interna */}
  <div
    className="space-y-3 max-h-72 overflow-y-auto pr-2"
    style={{
      scrollbarWidth: 'thin',
      scrollbarColor: '#CBD5E1 transparent', // cor suave da barra no Firefox
    }}
  >
    {produtosEstoqueBaixo.length > 0 ? (
      produtosEstoqueBaixo.map((p) => (
        <div
          key={p.id}
          className="flex justify-between items-center p-2 bg-gray-50 rounded-md border border-gray-100 shadow-sm"
        >
          <span className="font-medium text-gray-800 truncate">{p.nome}</span>
          <span
            className={`text-sm font-semibold ${
              p.estoque_atual <= p.estoque_minimo
                ? 'text-red-600'
                : 'text-yellow-600'
            }`}
          >
            {p.estoque_atual}/{p.estoque_minimo}
          </span>
        </div>
      ))
    ) : (
      <p className="text-gray-500">Nenhum produto com estoque baixo.</p>
    )}
  </div>
</Card>


        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-500" />
            Lavações com Maior Tempo em Aberto
          </h3>
          <div className="space-y-3">
            {lavacoesAntigas.length > 0 ? (
              lavacoesAntigas.map((lav) => (
                <div key={lav.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-800">{lav.cliente || 'Cliente não informado'}</p>
                    <p className="text-sm text-gray-600">
                      {lav.carro || 'Veículo'} - Placa: {lav.placa || '-'}
                    </p>
                    <p className="text-sm text-gray-500">Desde {lav.data_lavagem}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-700">
                    R$ {parseFloat(lav.valor || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Nenhuma lavação pendente há muito tempo.</p>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}