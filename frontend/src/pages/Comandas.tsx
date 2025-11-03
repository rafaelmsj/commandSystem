import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Eye, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import Modal from '../components/UI/Modal';
import { Comanda, Cliente } from '../types';
import { comandaService, clienteService } from '../services/api';
import { useApp } from '../context/AppContext';
import ReactSelect from 'react-select';
import { usePagination } from '../hooks/usePagination';

export default function Comandas() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [comandaToClose, setComandaToClose] = useState<number | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    clienteId: 0,
  });

  const [filters, setFilters] = useState({
    clienteId: searchParams.get('clienteId') || '',
    status: searchParams.get('status') || 'Aberta',
    dataInicio: searchParams.get('dataInicio') || '',
    dataFim: searchParams.get('dataFim') || '',
  });

  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
  } = usePagination<Comanda>({
    data: state.comandas,
    itemsPerPage: 6,
  });

  const hasActiveFilters = Array.from(searchParams.keys()).length > 0;

  useEffect(() => {
    loadComandas();
    loadClientes();
  }, [searchParams]);

  const loadComandas = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const currentFilters: any = Object.fromEntries(searchParams.entries());
      if (currentFilters.clienteId) {
        currentFilters.clienteId = parseInt(currentFilters.clienteId, 10);
      }
      const response = await comandaService.getAll(currentFilters);
      dispatch({ type: 'SET_COMANDAS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar comandas' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadClientes = async () => {
    try {
      const response = await clienteService.getAll();
      dispatch({ type: 'SET_CLIENTES', payload: response.data });
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await comandaService.create(formData);
      dispatch({ type: 'ADD_COMANDA', payload: response.data });
      loadComandas();
      handleCloseModal();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao criar comanda' });
    }
  };

  const handleFecharComanda = (id: number) => {
    setComandaToClose(id);  // Armazena a comanda que será fechada
    setIsConfirmModalOpen(true);  // Abre o modal de confirmação
  };


  const handleApplyFilters = () => {
    const newParams = new URLSearchParams();
    if (filters.clienteId) newParams.set('clienteId', filters.clienteId);
    if (filters.status && filters.status !== 'Todos') newParams.set('status', filters.status);
    if (filters.dataInicio) newParams.set('dataInicio', filters.dataInicio);
    if (filters.dataFim) newParams.set('dataFim', filters.dataFim);
    setSearchParams(newParams);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setSearchParams({});
    setFilters({
      clienteId: '',
      status: 'Aberta',
      dataInicio: '',
      dataFim: '',
    });
    setIsFilterOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ clienteId: 0 });
  };

  const getStatusColor = (status: string) => {
    return status === 'Aberta'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getClienteNome = (clienteId: number) => {
    const cliente = state.clientes.find(c => c.id === clienteId);
    return cliente?.name || 'Cliente não encontrado';
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Comandas</h1>
          <p className="text-gray-600 mt-2">Gerencie as comandas do seu bar</p>
        </div>
        <div className="flex space-x-3">
          {hasActiveFilters ? (
            <>
              <Button variant="danger" onClick={handleClearFilters}>
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
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Comanda
          </Button>
        </div>
      </div>

      {state.loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedData.map((comanda) => (
              <Card key={comanda.id}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {comanda.clienteNome || getClienteNome(comanda.clienteId)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Aberto: {new Date(comanda.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(comanda.status)}`}>
                    {comanda.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold text-green-600">
                      R$ {comanda.valorTotal.replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pago:</span>
                    <span className="font-semibold text-blue-600">
                      R$ {comanda.valorPago.replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saldo:</span>
                    <span className={`font-semibold ${comanda.saldoRestante > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      R$ {comanda.saldoRestante.replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/comandas/${comanda.id}`)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  {comanda.status === 'Aberta' && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleFecharComanda(comanda.id)}
                    >
                      Fechar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              goToPage={goToPage}
              nextPage={nextPage}
              prevPage={prevPage}
            />
          )}
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Nova Comanda"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <ReactSelect
              value={
                state.clientes
                  .map(cliente => ({ value: cliente.id, label: cliente.name }))
                  .find(option => option.value === formData.clienteId) || null
              }
              onChange={(selectedOption) => {
                setFormData({ ...formData, clienteId: selectedOption ? selectedOption.value : 0 });
              }}
              options={state.clientes.map(cliente => ({
                value: cliente.id,
                label: cliente.name,
              }))}
              isSearchable
              placeholder="Pesquise o cliente"
              className="w-full"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Comanda
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filtrar Comandas"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <ReactSelect
              value={
                state.clientes
                  .map(c => ({ value: c.id.toString(), label: c.name }))
                  .find(o => o.value === filters.clienteId) || null
              }
              onChange={(option) => setFilters({ ...filters, clienteId: option ? option.value : '' })}
              options={state.clientes.map(c => ({ value: c.id.toString(), label: c.name }))}
              isClearable
              isSearchable
              placeholder="Todos os clientes"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status || 'Todos'}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os status</option>
              <option value="Aberta">Aberta</option>
              <option value="Fechada">Fechada</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsFilterOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyFilters}>
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmar Fechamento"
      >
        <div className="space-y-4">
          <p>Tem certeza que deseja fechar esta comanda?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsConfirmModalOpen(false)} // Fecha o modal sem fazer nada
            >
              Não
            </Button>
            <Button
              onClick={async () => {
                if (comandaToClose) {
                  try {
                    const response = await comandaService.fechar(comandaToClose);
                    dispatch({ type: 'UPDATE_COMANDA', payload: response.data.comandas });
                    loadComandas();
                    setIsConfirmModalOpen(false); // Fecha o modal de confirmação
                  } catch (error) {
                    console.error('Erro ao fechar comanda:', error);
                    setErrorMessage(error.response?.data?.message || 'Erro desconhecido');
                    setIsConfirmModalOpen(false);  // Fecha o modal de confirmação
                  }
                }
              }}
            >
              Sim
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!errorMessage}
        onClose={() => setErrorMessage('')}
        title="Erro ao Fechar Comanda"
      >
        <div className="space-y-4">
          <p>{errorMessage}</p>
          <div className="flex justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => setErrorMessage('')}
            >
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

const PaginationControls = ({ currentPage, totalPages, goToPage, nextPage, prevPage }) => {
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-8 flex justify-center items-center space-x-2">
      <Button size="sm" onClick={prevPage} disabled={currentPage === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => goToPage(number)}
          className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === number
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
        >
          {number}
        </button>
      ))}
      <Button size="sm" onClick={nextPage} disabled={currentPage === totalPages}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
