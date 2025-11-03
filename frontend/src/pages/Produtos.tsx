import React, { useEffect, useState } from 'react';
import { Plus, Edit, DollarSign, Filter, ChevronLeft, ChevronRight, Package, AlertTriangle } from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import Modal from '../components/UI/Modal';
import { Produto } from '../types';
import { produtoService } from '../services/api';
import { useApp } from '../context/AppContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePagination } from '../hooks/usePagination';

// Componente para input de moeda com lógica intuitiva
const CurrencyInput = ({ value, onChange, ...props }) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    // Sempre formata o valor para exibição, mesmo que seja 0
    setDisplayValue(value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }));
  }, [value]);

  const handleChange = (e) => {
    const inputValue = e.target.value;

    // Remove tudo que não é número
    const numbersOnly = inputValue.replace(/\D/g, '');

    // Se não há números, limpa tudo
    if (!numbersOnly) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    // Converte para número decimal (divide por 100 para ter centavos)
    const numberValue = parseFloat(numbersOnly) / 100;

    // Formata para exibição
    const formatted = numberValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    setDisplayValue(formatted);
    onChange(numberValue);
  };

  const handleKeyDown = (e) => {
    // Permite: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
      // Permite: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }

    // Permite apenas números
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  return (
    <input
      {...props}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="R$ 0,00"
    />
  );
};

export default function Produtos() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEstoqueModalOpen, setIsEstoqueModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [editingEstoque, setEditingEstoque] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    valorPadrao: 0,
    estoque_atual: 0,
    estoque_minimo: 0,
  });
  const [estoqueForm, setEstoqueForm] = useState({
    estoque_atual: 0,
    estoque_minimo: 0,
  });
  const [errorMessage, setErrorMessage] = useState(null);
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
  } = usePagination({
    data: state.produtos,
    itemsPerPage: 9,
  });

  useEffect(() => {
    loadProdutos();
  }, [searchTerm]);

  const loadProdutos = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await produtoService.getAll({ search: searchTerm || '' });
      dispatch({ type: 'SET_PRODUTOS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar produtos' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingProduto) {
        response = await produtoService.update(editingProduto.id, formData);
        dispatch({ type: 'UPDATE_PRODUTO', payload: response.data });
      } else {
        response = await produtoService.create(formData);
        dispatch({ type: 'ADD_PRODUTO', payload: response.data });
      }
      loadProdutos();
      handleCloseModal();
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao salvar produto';
      setErrorMessage(message);
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  const handleEstoqueSubmit = async (e) => {
    e.preventDefault();
    try {
      await produtoService.updateEstoque(editingEstoque.id, estoqueForm);
      loadProdutos();
      handleCloseEstoqueModal();
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao atualizar estoque';
      setErrorMessage(message);
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  const handleOpenModal = (produto) => {
    if (produto) {
      setEditingProduto(produto);
      setFormData({
        nome: produto.nome,
        valorPadrao: produto.valorPadrao,
        estoque_atual: produto.estoque_atual || 0,
        estoque_minimo: produto.estoque_minimo || 0,
      });
    } else {
      setEditingProduto(null);
      setFormData({ nome: '', valorPadrao: 0, estoque_atual: 0, estoque_minimo: 0 });
    }
    setIsModalOpen(true);
  };

  const handleOpenEstoqueModal = (produto) => {
    setEditingEstoque(produto);
    setEstoqueForm({
      estoque_atual: produto.estoque_atual || 0,
      estoque_minimo: produto.estoque_minimo || 0,
    });
    setIsEstoqueModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduto(null);
    setFormData({ nome: '', valorPadrao: 0, estoque_atual: 0, estoque_minimo: 0 });
    setErrorMessage(null);
  };

  const handleCloseEstoqueModal = () => {
    setIsEstoqueModalOpen(false);
    setEditingEstoque(null);
    setEstoqueForm({ estoque_atual: 0, estoque_minimo: 0 });
    setErrorMessage(null);
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
          <p className="text-gray-600 mt-2">Gerencie os produtos e estoque do seu bar</p>
        </div>
        <div className="flex space-x-3">
          {hasActiveFilters && (
            <Button variant="danger" onClick={() => navigate('/produtos')}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
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
            {paginatedData.map((produto) => (
              <Card key={produto.id}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {produto.nome}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenEstoqueModal(produto)}
                      className="text-green-600 hover:text-green-800 transition-colors"
                      title="Gerenciar Estoque"
                    >
                      <Package className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(produto)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Editar Produto"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-green-600">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span className="text-lg font-semibold">
                      R$ {produto.valorPadrao.replace('.', ',')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Estoque:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${(produto.estoque_atual || 0) <= (produto.estoque_minimo || 0)
                            ? 'text-red-600'
                            : 'text-green-600'
                          }`}>
                          {produto.estoque_atual || 0}
                        </span>
                        {(produto.estoque_atual || 0) <= (produto.estoque_minimo || 0) && (
                          <AlertTriangle className="h-4 w-4 text-red-500" title="Estoque baixo" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Mínimo:</span>
                      <span className="text-sm text-gray-500">
                        {produto.estoque_minimo || 0}
                      </span>
                    </div>

                    {(produto.estoque_atual || 0) <= (produto.estoque_minimo || 0) && (
                      <div className="mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full text-center">
                        Estoque Baixo
                      </div>
                    )}
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

      {/* Modal de Produto */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduto ? 'Editar Produto' : 'Novo Produto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="text-red-600 text-sm mb-2">
              {errorMessage}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Produto
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Padrão
            </label>
            <CurrencyInput
              value={formData.valorPadrao}
              onChange={(value) => setFormData({ ...formData, valorPadrao: value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estoque Atual
              </label>
              <input
                type="number"
                min="0"
                value={formData.estoque_atual}
                onChange={(e) => setFormData({ ...formData, estoque_atual: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estoque Mínimo
              </label>
              <input
                type="number"
                min="0"
                value={formData.estoque_minimo}
                onChange={(e) => setFormData({ ...formData, estoque_minimo: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingProduto ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Estoque */}
      <Modal
        isOpen={isEstoqueModalOpen}
        onClose={handleCloseEstoqueModal}
        title={`Gerenciar Estoque - ${editingEstoque?.nome}`}
      >
        <form onSubmit={handleEstoqueSubmit} className="space-y-4">
          {errorMessage && (
            <div className="text-red-600 text-sm mb-2">
              {errorMessage}
            </div>
          )}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Estoque atual:</p>
            <p className="text-2xl font-bold text-gray-900">
              {editingEstoque?.estoque_atual || 0} unidades
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Novo Estoque Atual
            </label>
            <input
              type="number"
              min="0"
              value={estoqueForm.estoque_atual}
              onChange={(e) => setEstoqueForm({ ...estoqueForm, estoque_atual: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estoque Mínimo
            </label>
            <input
              type="number"
              min="0"
              value={estoqueForm.estoque_minimo}
              onChange={(e) => setEstoqueForm({ ...estoqueForm, estoque_minimo: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Alerta quando o estoque atingir este valor
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" type="button" onClick={handleCloseEstoqueModal}>
              Cancelar
            </Button>
            <Button type="submit">
              Atualizar Estoque
            </Button>
          </div>
        </form>
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