import React, { useEffect, useState } from 'react';
import ReactSelect from 'react-select';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, FileSpreadsheet } from 'lucide-react';
import api from '../services/api';
import Button from '../components/UI/Button';
import { Input } from '../components/UI/InputRifa';
import Card from '../components/UI/Card';
import Modal from '../components/UI/Modal'
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Movimentacao {
  id: number;
  produto_id: number;
  produto_nome: string;
  cliente_id: number | null;
  cliente_nome: string | null;
  origem: 'rifa' | 'conveniencia';
  tipo: 'entrada' | 'saida';
  quantidade: number;
  descricao: string;
  created_at: string;
}

export const MovimentacoesEstoque: React.FC = () => {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [relatorio, setRelatorio] = useState<{ produto_nome: string; total_movimentado: number; tipo: string }[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    produto_id: '',
    cliente_id: '',
    origem: '',
    tipo: '',
    dataInicio: '',
    dataFim: '',
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const hasActiveFilters = Array.from(searchParams.keys()).length > 0;

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
  });

  const ITEMS_PER_PAGE = 10;

  const fetchMovimentacoes = async (page = 1, filtrosAtuais = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filtrosAtuais,
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      const res = await api.get(`/estoque/movimentacoes?${params.toString()}`);
      if (res.data.success) {
        setMovimentacoes(res.data.movimentacoes);
        const p = res.data.pagination || {};
        setPagination({
          page: Number(p.currentPage || p.page || 1),
          totalPages: Number(p.totalPages || 1),
        });
      }
    } catch (err) {
      console.error('Erro ao buscar movimentações:', err);
    } finally {
      setLoading(false);
    }
  };


  // 📊 Buscar relatório
  const fetchRelatorio = async () => {
    try {
      const params = new URLSearchParams({
        dataInicio: filters.dataInicio,
        dataFim: filters.dataFim,
        origem: filters.origem,
        tipo: filters.tipo,
        cliente_id: filters.cliente_id,
        produto_id: filters.produto_id
      });
      const res = await api.get(`/estoque/relatorio?${params.toString()}`);
      if (res.data.success) setRelatorio(res.data.relatorio);
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
    }
  };

  // 🔁 Buscar produtos e clientes
  useEffect(() => {
    fetchMovimentacoes();
    fetchProdutos();
    fetchClientes();
  }, []);

  const fetchProdutos = async () => {
    try {
      const res = await api.get('/produtos');
      if (res.data) setProdutos(res.data);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await api.get('/clientes');
      if (res.data) setClientes(res.data);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    }
  };

  // 🔍 Busca e filtros
  const handleSearch = () => {
    fetchMovimentacoes(1)
    const newParams = new URLSearchParams();
    if (filters.cliente_id) newParams.set('cliente_id', filters.cliente_id);
    if (filters.produto_id) newParams.set('produto_id', filters.produto_id);
    if (filters.origem && filters.origem !== 'Todos') newParams.set('origem', filters.origem);
    if (filters.tipo && filters.tipo !== 'Todos') newParams.set('tipo', filters.tipo);
    if (filters.dataInicio) newParams.set('dataInicio', filters.dataInicio);
    if (filters.dataFim) newParams.set('dataFim', filters.dataFim);
    setSearchParams(newParams);
    setIsFilterOpen(false);
  }


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters({ ...filters, [e.target.name]: e.target.value })


  const handleResetFilters = () => {
    const filtrosLimpos = {
      produto_id: '',
      cliente_id: '',
      origem: '',
      tipo: '',
      dataInicio: '',
      dataFim: ''
    };

    setFilters(filtrosLimpos);
    setSearchParams({});
    setRelatorio([]);

    // Chama a busca já com os filtros limpos
    fetchMovimentacoes(1, filtrosLimpos);
  };


  // 📤 Exportar Excel
  const exportarRelatorio = () => {
    if (relatorio.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(
      relatorio.map((r) => ({
        Produto: r.produto_nome,
        Tipo: r.tipo.toUpperCase(),
        "Total Movimentado": r.total_movimentado,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório Estoque");
    const dataAtual = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
    const nomeArquivo = `Relatorio_Estoque_${dataAtual}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, nomeArquivo);
  };

  // 🖼️ UI
  return (
    <div className="space-y-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Movimentações de Estoque</h1>
          <p className="text-gray-600 mt-2">Consulte e gerencie as movimentações de estoque</p>
        </div>

        <div className="flex space-x-3">
          {hasActiveFilters ? (
            <>
              <Button variant="danger" onClick={handleResetFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
              <Button variant="secondary" onClick={() => setIsFilterOpen(true)}>
                <Filter className="h-4 w-4 mr-2" />
                Editar Filtros
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setIsFilterOpen(true)}>
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          )}
          <Button onClick={fetchRelatorio}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>

        </div>
      </div>

      {/* 📋 Tabela de Movimentações */}
      <Card className="p-6 shadow-md border border-gray-200 rounded-2xl bg-white">
        {loading ? (
          <p className="text-center text-gray-500 py-6">Carregando...</p>
        ) : movimentacoes.length === 0 ? (
          <p className="text-center text-gray-500 py-6">Nenhuma movimentação encontrada.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 font-semibold">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Produto</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Origem</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3 text-center">Qtd</th>
                  <th className="p-3">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map((m, i) => (
                  <tr key={m.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition`}>
                    <td className="p-3 text-gray-600">{new Date(m.created_at).toLocaleString()}</td>
                    <td className="p-3 font-medium text-gray-800">{m.produto_nome}</td>
                    <td className="p-3 text-gray-700">{m.cliente_nome || '-'}</td>
                    <td className="p-3 capitalize">{m.origem}</td>
                    <td className={`p-3 font-semibold ${m.tipo === 'saida' ? 'text-red-500' : 'text-green-600'}`}>{m.tipo}</td>
                    <td className="p-3 text-center">{m.quantidade}</td>
                    <td className="p-3 text-gray-600">{m.descricao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-6">
            <Button
              disabled={pagination.page <= 1}
              onClick={() => fetchMovimentacoes(pagination.page - 1)}
              variant="secondary"
            >
              ← Anterior
            </Button>
            <span className="text-gray-700 font-medium">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchMovimentacoes(pagination.page + 1)}
              variant="secondary"
            >
              Próxima →
            </Button>
          </div>
        )}


        {/* 📊 Relatório */}
        {relatorio.length > 0 && (
          <div className="mt-10 border-t pt-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileSpreadsheet className="text-green-600" /> Relatório de Produtos no Período
              </h2>
              <Button onClick={exportarRelatorio} variant="secondary" className="flex items-center gap-2">
                <FileSpreadsheet className="text-green-600" />
                Exportar Excel
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2">Produto</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2 text-center">Total Movimentado</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.map((item, idx) => (
                    <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="p-2 font-medium text-gray-800">{item.produto_nome}</td>
                      <td className={`p-2 capitalize ${item.tipo === 'saida' ? 'text-red-500' : 'text-green-600'}`}>
                        {item.tipo}
                      </td>
                      <td className="p-2 text-center font-semibold">{item.total_movimentado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filtros de Movimentações"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Datas */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Data Início</label>
              <Input type="date" name="dataInicio" value={filters.dataInicio} onChange={handleChange} icon={<Calendar />} />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Data Fim</label>
              <Input type="date" name="dataFim" value={filters.dataFim} onChange={handleChange} icon={<Calendar />} />
            </div>
          </div>
          {/* Produto */}
          <div className="">
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Produto</label>
            <ReactSelect
              placeholder="Pesquisar produto..."
              isSearchable
              value={produtos.map(p => ({ value: p.id, label: p.nome }))
                .find(opt => opt.value === Number(filters.produto_id)) || null}
              onChange={(opt) => setFilters({ ...filters, produto_id: opt ? opt.value.toString() : '' })}
              options={produtos.map(p => ({ value: p.id, label: `${p.nome} - R$ ${p.valorPadrao || '0,00'}` }))}
            />
          </div>

          {/* Cliente */}
          <div className="">
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Cliente</label>
            <ReactSelect
              placeholder="Pesquisar cliente..."
              isSearchable
              value={clientes.map(c => ({ value: c.id, label: c.name }))
                .find(opt => opt.value === Number(filters.cliente_id)) || null}
              onChange={(opt) => setFilters({ ...filters, cliente_id: opt ? opt.value.toString() : '' })}
              options={clientes.map(c => ({ value: c.id, label: c.name }))}
            />
          </div>

          {/* Origem */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Origem</label>
            <select name="origem" value={filters.origem} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos</option>
              <option value="rifa">Rifa</option>
              <option value="conveniencia">Conveniência</option>
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Tipo</label>
            <select name="tipo" value={filters.tipo} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos</option>
              <option value="saida">Saída</option>
              <option value="entrada">Entrada</option>
            </select>
          </div>

        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => setIsFilterOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              handleSearch();
            }}
          >
            <Search className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </Button>
        </div>
      </Modal>

    </div>
  );
};

export default MovimentacoesEstoque;
