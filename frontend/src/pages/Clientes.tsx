import React, { useEffect, useState } from 'react';
import { Plus, Edit, Phone, MapPin, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import Modal from '../components/UI/Modal';
import { Cliente } from '../types';
import { clienteService } from '../services/api';
import { useApp } from '../context/AppContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePagination } from '../hooks/usePagination';
import { 
  formatPhoneNumber, 
  cleanPhoneNumber, 
  displayPhoneNumber, 
  isValidPhoneNumber,
  handlePhoneInputChange 
} from '../utils/phoneUtils.ts'; // Importa as funções utilitárias

export default function Clientes() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    endereco: '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('search');

  const hasActiveFilters = Array.from(searchParams.keys()).length > 0;

  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
  } = usePagination<Cliente>({
    data: state.clientes,
    itemsPerPage: 9,
  });

  useEffect(() => {
    loadClientes();
  }, [searchTerm]);

  const loadClientes = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await clienteService.getAll({ search: searchTerm || '' });
      dispatch({ type: 'SET_CLIENTES', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar clientes' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação do telefone antes de enviar
    if (!isValidPhoneNumber(formData.number)) {
      setErrorMessage('Por favor, insira um número de telefone válido');
      return;
    }

    try {
      let response;
      // Limpa o número antes de enviar para o backend
      const dataToSend = {
        ...formData,
        number: cleanPhoneNumber(formData.number)
      };

      if (editingCliente) {
        response = await clienteService.update(editingCliente.id, dataToSend);
        dispatch({ type: 'UPDATE_CLIENTE', payload: response.data });
      } else {
        response = await clienteService.create(dataToSend);
        dispatch({ type: 'ADD_CLIENTE', payload: response.data });
      }
      loadClientes();
      handleCloseModal();
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao salvar cliente';
      setErrorMessage(message);
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        name: cliente.name,
        number: formatPhoneNumber(cliente.number), // Formata o número ao abrir para edição
        endereco: cliente.endereco,
      });
    } else {
      setEditingCliente(null);
      setFormData({ name: '', number: '', endereco: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
    setFormData({ name: '', number: '', endereco: '' });
    setErrorMessage(null);
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-600 mt-2">Gerencie os clientes do seu bar</p>
        </div>
        <div className="flex space-x-3">
          {hasActiveFilters && (
            <Button variant="danger" onClick={() => navigate('/clientes')}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {state.loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedData.map((cliente) => (
              <Card key={cliente.id}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {cliente.name}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenModal(cliente)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span className="text-sm">{displayPhoneNumber(cliente.number)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{cliente.endereco}</span>
                  </div>
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
        title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="text-red-600 text-sm mb-2">
              {errorMessage}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número
            </label>
            <input
              type="tel"
              value={formData.number}
              onChange={(e) => handlePhoneInputChange(e, (value) => 
                setFormData({ ...formData, number: value })
              )}
              placeholder="(11)99999-9999"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {formData.number && !isValidPhoneNumber(formData.number) && (
              <p className="text-xs text-gray-500 mt-1">
                Digite um número completo (10 ou 11 dígitos)
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço
            </label>
            <textarea
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingCliente ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const PaginationControls = ({ currentPage, totalPages, goToPage, nextPage, prevPage }) => {
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="mt-8 flex justify-center items-center space-x-2">
      <Button size="sm" onClick={prevPage} disabled={currentPage === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => goToPage(number)}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            currentPage === number
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