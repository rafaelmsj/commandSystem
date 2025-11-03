import React, { useEffect, useState } from 'react';
import ReactSelect from 'react-select';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Edit
} from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import Modal from '../components/UI/Modal';
import { Comanda, LancamentoProduto, Pagamento, Produto } from '../types';
import {
  comandaService,
  lancamentoService,
  pagamentoService,
  produtoService
} from '../services/api';
import { useApp } from '../context/AppContext';
import { usePagination } from '../hooks/usePagination';

// Componente para input de moeda com formatação automática
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

export default function ComandaDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [lancamentos, setLancamentos] = useState<LancamentoProduto[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);
  const [isPagamentoModalOpen, setIsPagamentoModalOpen] = useState(false);
  const [isEditingLancamento, setIsEditingLancamento] = useState<LancamentoProduto | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('Erro');
  const [comandaToClose, setComandaToClose] = useState<number | null>(null);

  const [itemToDelete, setItemToDelete] = useState<{ type: 'lancamento' | 'pagamento'; id: number } | null>(null);


  const [lancamentoForm, setLancamentoForm] = useState({

    produtoId: 0,
    valorLancado: 0,
    quantidade: 1,
  });

  const [pagamentoForm, setPagamentoForm] = useState({
    valor: 0,
    metodoPagamento: '',
  });

  // Opções de métodos de pagamento
  const metodosPagemento = [
    { value: '', label: 'Selecione o método de pagamento' },
    { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
    { value: 'Cartão de Débito', label: 'Cartão de Débito' },
    { value: 'Dinheiro', label: 'Dinheiro' },
    { value: 'Pix', label: 'Pix' }
  ];

  const lancamentosPaginados = usePagination<LancamentoProduto>({
    data: lancamentos,
    itemsPerPage: 5,
  });

  const pagamentosPaginados = usePagination<Pagamento>({
    data: pagamentos,
    itemsPerPage: 5,
  });

  useEffect(() => {
    if (id) {
      loadComandaDetalhes();
      loadProdutos();
    }
  }, [id]);

  const loadComandaDetalhes = async () => {
    try {
      setLoading(true);
      const comandaId = parseInt(id!);

      const [comandaResponse, lancamentosResponse, pagamentosResponse] = await Promise.all([
        comandaService.getById(comandaId),
        lancamentoService.getByComanda(comandaId),
        pagamentoService.getByComanda(comandaId),
      ]);

      setComanda(comandaResponse.data);
      setLancamentos(lancamentosResponse.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setPagamentos(pagamentosResponse.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar detalhes da comanda' });
    } finally {
      setLoading(false);
    }
  };

  const loadProdutos = async () => {
    try {
      const response = await produtoService.getAll();
      setProdutos(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  // ComandaDetalhes.tsx
  const handleLancamentoProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingLancamento) {
        await lancamentoService.update(isEditingLancamento.id, lancamentoForm);
      } else {
        await lancamentoService.create({
          comandaId: parseInt(id!),
          clienteId: comanda.clienteId,
          ...lancamentoForm,
        });
      }

      setIsLancamentoModalOpen(false);
      setIsEditingLancamento(null);
      setLancamentoForm({ produtoId: 0, valorLancado: 0, quantidade: 1 });
      loadComandaDetalhes();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao lançar produto';
      setErrorTitle('Erro ao Lançar Produto');
      setErrorMessage(message);
    }
  };



  const handleRegistrarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pagamentoService.create({
        comandaId: parseInt(id!),
        ...pagamentoForm,
      });
      setIsPagamentoModalOpen(false);
      setPagamentoForm({ valor: 0, metodoPagamento: 'Dinheiro' });
      loadComandaDetalhes();
    } catch (error: any) {
      setErrorTitle('Erro ao Registrar Pagamento');
      setErrorMessage(error.response?.data?.message || 'Erro ao registrar pagamento');
    }
  };


  const handleEditarLancamento = (lancamento: LancamentoProduto) => {
    setIsEditingLancamento(lancamento);
    setLancamentoForm({
      produtoId: lancamento.produtoId,
      valorLancado: lancamento.valorLancado,
      quantidade: lancamento.quantidade,
    });
    setIsLancamentoModalOpen(true);
  };

  const handleRemoverLancamento = (lancamentoId: number) => {
    setItemToDelete({ type: 'lancamento', id: lancamentoId });
  };

  const handleRemoverPagamento = (pagamentoId: number) => {
    setItemToDelete({ type: 'pagamento', id: pagamentoId });
  };

  const handleFecharComanda = (id: number) => {
    setComandaToClose(id);  // Armazena a comanda que será fechada
    setIsConfirmModalOpen(true);  // Abre o modal de confirmação
  };

  const handleCloseModal = () => {
    setIsLancamentoModalOpen(false);
    setIsEditingLancamento(null);
    setLancamentoForm({ produtoId: 0, valorLancado: 0, quantidade: 1 });
  };

  const getProdutoNome = (produtoId: number) => {
    return produtos.find(p => p.id === produtoId)?.nome || 'Produto não encontrado';
  };

  const getClienteNome = (clienteId: number) => {
    const cliente = state.clientes.find(c => c.id === clienteId);
    return cliente?.name || 'Cliente não encontrado';
  };

  const handleProdutoChange = (produtoId: number) => {
    const produto = produtos.find(p => p.id === produtoId);
    setLancamentoForm({
      ...lancamentoForm,
      produtoId,
      valorLancado: produto?.valorPadrao || 0,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!comanda) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Comanda não encontrada</p>
        <Button onClick={() => navigate('/comandas')} className="mt-4">
          Voltar para Comandas
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="secondary" onClick={() => navigate('/comandas')} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{comanda.cliente}</h1>
            <p className="text-sm text-gray-600">Aberto: {new Date(comanda.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${comanda.status === 'Aberta' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {comanda.status}
          </span>
          {comanda.status === 'Aberta' && (
            <Button variant="success" onClick={() => handleFecharComanda(comanda.id)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Fechar Comanda
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-blue-50"><DollarSign className="h-6 w-6 text-blue-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">R$ {comanda.valorTotal.replace('.', ',')}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-green-50"><CreditCard className="h-6 w-6 text-green-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pago</p>
              <p className="text-2xl font-semibold text-gray-900">R$ {comanda.valorPago.replace('.', ',')}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-orange-50"><XCircle className="h-6 w-6 text-orange-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Saldo</p>
              <p className={`text-2xl font-semibold ${comanda.saldoRestante > 0 ? 'text-red-600' : 'text-green-600'}`}>R$ {comanda.saldoRestante.replace('.', ',')}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Produtos Lançados</h3>
            {comanda.status === 'Aberta' && (
              <Button size="sm" onClick={() => setIsLancamentoModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Lançar Produto
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {lancamentosPaginados.paginatedData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum produto lançado ainda</p>
            ) : (
              lancamentosPaginados.paginatedData.map((lancamento) => (
                <div key={lancamento.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{getProdutoNome(lancamento.produtoId)}</p>
                    <p className="text-sm text-gray-600">Qtd: {lancamento.quantidade} × R$ {lancamento.valorLancado}</p>
                    <p className="text-sm text-gray-600">Data: {new Date(lancamento.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-green-600">R$ {(lancamento.quantidade * lancamento.valorLancado).toFixed(2).replace('.', ',')}</span>
                    {comanda.status === 'Aberta' && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleRemoverLancamento(lancamento.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Remover produto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {lancamentosPaginados.totalPages > 1 && <PaginationControls {...lancamentosPaginados} />}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Pagamentos</h3>
            {comanda.status === 'Aberta' && (
              <Button size="sm" variant="success" onClick={() => setIsPagamentoModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Pagamento
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {pagamentosPaginados.paginatedData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum pagamento registrado ainda</p>
            ) : (
              pagamentosPaginados.paginatedData.map((pagamento) => (
                <div key={pagamento.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{pagamento.metodoPagamento || 'Pagamento'}</p>
                    <p className="text-sm text-gray-600">{new Date(pagamento.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-blue-600">R$ {pagamento.valor.replace('.', ',')}</span>
                    {comanda.status === 'Aberta' && (
                      <button onClick={() => handleRemoverPagamento(pagamento.id)} className="text-red-600 hover:text-red-800 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {pagamentosPaginados.totalPages > 1 && <PaginationControls {...pagamentosPaginados} />}
        </Card>
      </div>

      {/* Modal de Lançamento/Edição de Produto */}
      <Modal
        isOpen={isLancamentoModalOpen}
        onClose={handleCloseModal}
        title={isEditingLancamento ? 'Editar Produto' : 'Lançar Produto'}
      >
        <form onSubmit={handleLancamentoProduto} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
            <ReactSelect
              placeholder="Pesquise o produto"
              isSearchable
              value={produtos.map(p => ({ value: p.id, label: `${p.nome}` })).find(p => p.value === lancamentoForm.produtoId) || null}
              onChange={(selectedOption) => {
                if (selectedOption) {
                  handleProdutoChange(selectedOption.value);
                } else {
                  setLancamentoForm({ ...lancamentoForm, produtoId: 0, valorLancado: 0 });
                }
              }}
              options={produtos.map(produto => ({ value: produto.id, label: `${produto.nome} - R$ ${produto.valorPadrao.replace('.', ',')}` }))}
              className="w-full"
              classNamePrefix="react-select"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
            <input
              type="number"
              min="1"
              value={lancamentoForm.quantidade}
              onChange={(e) => setLancamentoForm({ ...lancamentoForm, quantidade: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Unitário</label>
            <CurrencyInput
              value={lancamentoForm.valorLancado}
              onChange={(value) => setLancamentoForm({ ...lancamentoForm, valorLancado: value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Total do lançamento: <span className="font-semibold text-gray-900">R$ {(lancamentoForm.quantidade * lancamentoForm.valorLancado).toFixed(2).replace('.', ',')}</span></p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>Cancelar</Button>
            <Button type="submit">{isEditingLancamento ? 'Atualizar Produto' : 'Lançar Produto'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Pagamento */}
      <Modal isOpen={isPagamentoModalOpen} onClose={() => setIsPagamentoModalOpen(false)} title="Registrar Pagamento">
        <form onSubmit={handleRegistrarPagamento} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
            <ReactSelect
              placeholder="Selecione o método de pagamento"
              value={metodosPagemento.find(m => m.value === pagamentoForm.metodoPagamento)}
              onChange={(selectedOption) => {
                if (selectedOption) {
                  setPagamentoForm({ ...pagamentoForm, metodoPagamento: selectedOption.value });
                }
              }}
              options={metodosPagemento}
              className="w-full"
              classNamePrefix="react-select"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Pagamento</label>
            <CurrencyInput
              value={pagamentoForm.valor}
              type="number"
              step="0.01"
              min="0.01"
              max={comanda.saldoRestante}
              onChange={(value) => setPagamentoForm({ ...pagamentoForm, valor: value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Saldo restante: <span className="font-semibold text-red-600">R$ {comanda.saldoRestante.replace('.', ',')}</span></p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsPagamentoModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="success">Registrar Pagamento</Button>
          </div>
        </form>
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
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Não
            </Button>
            <Button
              onClick={async () => {
                if (comandaToClose) {
                  try {
                    await comandaService.fechar(comandaToClose);
                    await loadComandaDetalhes();
                    setIsConfirmModalOpen(false);
                  } catch (error: any) {
                    setErrorTitle('Erro ao Fechar Comanda');
                    setErrorMessage(error.response?.data?.message || 'Erro desconhecido');
                    setIsConfirmModalOpen(false);
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
        onClose={() => {
          setErrorMessage('');
          setErrorTitle('Erro');
        }}
        title={errorTitle}
      >
        <div className="space-y-4">
          <p>{errorMessage}</p>
          <div className="flex justify-end pt-4">
            <Button variant="secondary" onClick={() => setErrorMessage('')}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>


      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p>Tem certeza que deseja excluir este {itemToDelete?.type === 'lancamento' ? 'Produto' : 'pagamento'}?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setItemToDelete(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!itemToDelete) return;
                try {
                  if (itemToDelete.type === 'lancamento') {
                    await lancamentoService.delete(itemToDelete.id);
                  } else if (itemToDelete.type === 'pagamento') {
                    await pagamentoService.delete(itemToDelete.id);
                  }
                  await loadComandaDetalhes();
                } catch (error) {
                  dispatch({ type: 'SET_ERROR', payload: 'Erro ao excluir item' });
                } finally {
                  setItemToDelete(null);
                }
              }}
            >
              Excluir
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
    <div className="mt-6 flex justify-center items-center space-x-2">
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
