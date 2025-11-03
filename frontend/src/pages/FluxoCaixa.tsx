import React, { useEffect, useState, useMemo } from 'react';
import { Filter } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { Input } from '../components/UI/InputRifa';
import Modal from '../components/UI/Modal';
import { useApp } from '../context/AppContext';
import { caixaService } from '../services/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FileSpreadsheet } from 'lucide-react';


interface RegistroCaixa {
  valor: string;
  forma_pagamento: string;
  tipo: string;
  data: string;
  text: string;
}

export const FluxoCaixa: React.FC = () => {
  const { dispatch } = useApp();
  const [registros, setRegistros] = useState<RegistroCaixa[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const ITEMS_PER_PAGE = 10;
  const [filters, setFilters] = useState({
    dataInicio: '',
    dataFim: '',
    tipo: '',
    forma_pagamento: '',
  });
  const [isFiltrado, setIsFiltrado] = useState(false);

  // 🗓️ Util para formatar data de hoje no padrão YYYY-MM-DD
  const getHoje = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  useEffect(() => {
    carregarCaixa(true); // carrega apenas o dia atual por padrão
  }, []);

  const carregarCaixa = async (somenteHoje = false, page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (somenteHoje) {
        const hoje = getHoje();
        params.append('dataInicio', hoje);
        params.append('dataFim', hoje);
      } else {
        if (filters.dataInicio) params.append('dataInicio', filters.dataInicio);
        if (filters.dataFim) params.append('dataFim', filters.dataFim);
        if (filters.tipo) params.append('tipo', filters.tipo);
        if (filters.forma_pagamento)
          params.append('forma_pagamento', filters.forma_pagamento);
      }

      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const response = await caixaService.getAll(params.toString());
      if (response.data.success) {
        setRegistros(response.data.result);
        setTotais(response.data.totais || {});
        const p = response.data.pagination || {};
        setPagination({
          page: Number(p.currentPage || 1),
          totalPages: Number(p.totalPages || 1),
        });
      }

    } catch (error) {
      console.error('Erro ao carregar registros do caixa:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar caixa' });
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    try {
      const params = new URLSearchParams();

      if (filters.dataInicio) params.append('dataInicio', filters.dataInicio);
      if (filters.dataFim) params.append('dataFim', filters.dataFim);
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.forma_pagamento)
        params.append('forma_pagamento', filters.forma_pagamento);

      const response = await caixaService.exportar(params.toString());

      if (!response.data.success || !response.data.result?.length) {
        alert('Nenhum registro encontrado para exportar.');
        return;
      }

      const registros = response.data.result;

      // === MAPEAMENTO PRINCIPAL ===
      const dadosParaExportar = registros.map((r) => ({
        Data: r.data,
        Tipo: r.tipo,
        Descrição: r.text,
        'Forma de Pagamento': r.forma_pagamento,
        Valor: parseFloat(r.valor),
      }));

      // === CÁLCULOS DE TOTAIS ===
      const totalGeral = registros.reduce(
        (acc, i) => acc + parseFloat(i.valor),
        0
      );

      const totalPix = registros
        .filter((i) => i.forma_pagamento.toLowerCase().includes('pix'))
        .reduce((acc, i) => acc + parseFloat(i.valor), 0);

      const totalCredito = registros
        .filter((i) => i.forma_pagamento.toLowerCase().includes('crédito'))
        .reduce((acc, i) => acc + parseFloat(i.valor), 0);

      const totalDebito = registros
        .filter((i) => i.forma_pagamento.toLowerCase().includes('débito'))
        .reduce((acc, i) => acc + parseFloat(i.valor), 0);

      const totalDinheiro = registros
        .filter((i) => i.forma_pagamento.toLowerCase().includes('dinheiro'))
        .reduce((acc, i) => acc + parseFloat(i.valor), 0);

      // === ADICIONA LINHAS DE TOTAL NO FINAL ===
      dadosParaExportar.push({});
      dadosParaExportar.push({ Descrição: '--- RESUMO DE TOTAIS ---' });
      dadosParaExportar.push({
        Descrição: 'Total em Pix',
        Valor: totalPix,
      });
      dadosParaExportar.push({
        Descrição: 'Total em Cartão de Crédito',
        Valor: totalCredito,
      });
      dadosParaExportar.push({
        Descrição: 'Total em Cartão de Débito',
        Valor: totalDebito,
      });
      dadosParaExportar.push({
        Descrição: 'Total em Dinheiro',
        Valor: totalDinheiro,
      });
      dadosParaExportar.push({
        Descrição: 'TOTAL GERAL',
        Valor: totalGeral,
      });

      // === CRIA A PLANILHA ===
      const worksheet = XLSX.utils.json_to_sheet(dadosParaExportar);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Fluxo de Caixa');

      // === FORMATAÇÃO FINAL ===
      const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      saveAs(blob, `Fluxo_Caixa_${dataAtual}.xlsx`);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      alert('Erro ao exportar registros.');
    }
  };



  const handleApplyFilters = () => {
    setIsFiltrado(true);
    setIsFilterOpen(false);
    carregarCaixa(false);
  };

  const handleClearFilters = () => {
    setFilters({ dataInicio: '', dataFim: '', tipo: '', forma_pagamento: '' });
    setIsFiltrado(false);
    carregarCaixa(true); // volta para o modo diário
  };

  const [totais, setTotais] = useState({
    totalGeral: 0,
    totalPix: 0,
    totalCredito: 0,
    totalDebito: 0,
    totalDinheiro: 0,
  });

  const graficoData = [
    { nome: 'Pix', valor: totais.totalPix },
    { nome: 'Cartão Crédito', valor: totais.totalCredito },
    { nome: 'Cartão Débito', valor: totais.totalDebito },
    { nome: 'Dinheiro', valor: totais.totalDinheiro },
  ];

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Fluxo de Caixa</h1>
          <p className="text-gray-600 mt-1">
            {isFiltrado
              ? 'Exibindo registros filtrados'
              : 'Exibindo registros do dia atual'}
          </p>
        </div>
        <div className="flex gap-2">
          {isFiltrado ? (
            <>
              <Button variant="danger" onClick={handleClearFilters}>
                Limpar Filtros
              </Button>
              <Button variant="secondary" onClick={() => setIsFilterOpen(true)}>
                <Filter className="h-4 w-4 mr-2" />
                Editar Filtros
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setIsFilterOpen(true)}>
              <Filter size={18} className="mr-2" /> Filtrar
            </Button>
          )}

          <Button onClick={exportarExcel} variant="secondary" className="flex items-center gap-2">
            <FileSpreadsheet className="text-green-600" />
            Exportar Excel
          </Button>

        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <p className="text-sm text-gray-600">Total Geral</p>
          <p className="text-2xl font-bold text-gray-800">
            R$ {totais.totalGeral}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-600">Pix</p>
          <p className="text-xl font-semibold text-emerald-600">
            R$ {totais.totalPix}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-600">Crédito</p>
          <p className="text-xl font-semibold text-blue-600">
            R$ {totais.totalCredito}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-600">Débito</p>
          <p className="text-xl font-semibold text-indigo-600">
            R$ {totais.totalDebito}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-600">Dinheiro</p>
          <p className="text-xl font-semibold text-yellow-600">
            R$ {totais.totalDinheiro}
          </p>
        </Card>
      </div>


      {/* Tabela */}
      <Card title="Registros do Caixa">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : registros.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            Nenhum registro encontrado
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Data
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Tipo
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Descrição
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Forma de Pagamento
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map((r, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600">{r.data}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">{r.tipo}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{r.text}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {r.forma_pagamento}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-semibold text-green-600">
                      R$ {parseFloat(r.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-6">
                <Button
                  disabled={pagination.page <= 1}
                  onClick={() => carregarCaixa(isFiltrado, pagination.page - 1)}
                  variant="secondary"
                >
                  ← Anterior
                </Button>
                <span className="text-gray-700 font-medium">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => carregarCaixa(isFiltrado, pagination.page + 1)}
                  variant="secondary"
                >
                  Próxima →
                </Button>
              </div>
            )}

          </div>
        )}
      </Card>

      {/* Modal de Filtros */}
      <Modal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filtrar Caixa"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data Início"
              type="date"
              value={filters.dataInicio}
              onChange={(e) =>
                setFilters({ ...filters, dataInicio: e.target.value })
              }
            />
            <Input
              label="Data Fim"
              type="date"
              value={filters.dataFim}
              onChange={(e) =>
                setFilters({ ...filters, dataFim: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo instituição
            </label>
            <select
              value={filters.tipo}
              onChange={(e) =>
                setFilters({ ...filters, tipo: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="Conveniência">Conveniência</option>
              <option value="Lavação">Lavação</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forma de Pagamento
            </label>
            <select
              value={filters.forma_pagamento}
              onChange={(e) =>
                setFilters({ ...filters, forma_pagamento: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              <option value="Pix">PIX</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão de Crédito">Cartão Crédito</option>
              <option value="Cartão de Débito">Cartão Débito</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsFilterOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyFilters}>Aplicar Filtros</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
