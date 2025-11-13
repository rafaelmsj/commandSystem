import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Mail,
  User,
  AlertCircle,
  UserCheck,
  Search,
  Filter
} from 'lucide-react';

import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import Pagination from '../components/UI/Pagination';
import Modal from '../components/UI/Modal';
import ConfirmModal from '../components/UI/ConfirmModal';
import api from '../services/api';

interface UserType {
  id: number;
  nome: string;
  email: string;
  role: string;
  ativo: number;
}

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  pagination: PaginationInfo;
  result: UserType[];
}

export default function UsuariosListagem() {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState<UserType[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    perPage: 10
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(true);

  // === MODAL DE CONFIRMAÇÃO ===
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // === FILTROS ===
  const [filters, setFilters] = useState({
    search: '',
    ativo: '',
    role: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [tempFilters, setTempFilters] = useState(filters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  async function fetchUsuarios(page = 1, activeFilters = filters) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: activeFilters.search || '',
        ativo: activeFilters.ativo || '',
        role: activeFilters.role || ''
      });

      const { data }: { data: ApiResponse } = await api.get(`/usuarios?${params.toString()}`);

      if (data.success) {
        setUsuarios(data.result);
        setPagination(data.pagination);
      } else {
        setMessage('Erro ao carregar usuários');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Erro ao carregar usuários');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user.role !== 'administrador') {
      navigate('/usuarios/alterar-senha');
      return;
    }
    fetchUsuarios(1);
  }, []);

  // =================================================================
  //               FUNÇÕES DE ATIVAR / INATIVAR (COM MODAL)
  // =================================================================

  function inativarUsuario(id: number) {
    setConfirmMessage('Deseja realmente inativar este usuário?');
    setConfirmAction(() => async () => {
      try {
        const { data } = await api.patch(`/usuarios/${id}/ativo`, { ativo: 0 });
        setMessage(data.message);
        setMessageType('success');
        fetchUsuarios(pagination.currentPage);
      } catch (err: any) {
        setMessage(err.response?.data?.message || 'Erro ao inativar usuário');
        setMessageType('error');
      } finally {
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  }

  function reativarUsuario(id: number) {
    setConfirmMessage('Deseja realmente ativar este usuário?');
    setConfirmAction(() => async () => {
      try {
        const { data } = await api.patch(`/usuarios/${id}/ativo`, { ativo: 1 });
        setMessage(data.message);
        setMessageType('success');
        fetchUsuarios(pagination.currentPage);
      } catch (err: any) {
        setMessage(err.response?.data?.message || 'Erro ao ativar usuário');
        setMessageType('error');
      } finally {
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  }

  // =================================================================
  //                              SEARCH
  // =================================================================
  const executeSearch = () => {
    const applied = { ...filters, search: searchTerm };
    setFilters(applied);
    fetchUsuarios(1, applied);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') executeSearch();
  };

  // =================================================================
  //                          FILTROS MODAL
  // =================================================================
  const handleApplyFilters = () => {
    const applied = { ...tempFilters, search: filters.search };
    setFilters(applied);
    setIsFilterOpen(false);
    fetchUsuarios(1, applied);
  };

  const handleClearFilters = () => {
    const cleared = { search: '', ativo: '', role: '' };
    setTempFilters(cleared);
    setFilters(cleared);
    setSearchTerm('');
    fetchUsuarios(1, cleared);
  };

  const hasActiveFilters = filters.ativo || filters.role || filters.search;

  if (user.role !== 'administrador') return null;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="mt-1 text-sm text-gray-600">Gerencie os usuários do sistema</p>
        </div>

        <div className="flex space-x-3">
          {hasActiveFilters && (
            <Button variant="danger" onClick={handleClearFilters}>
              Limpar Filtros
            </Button>
          )}

          <Button variant="secondary" onClick={() => setIsFilterOpen(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>

          <Button onClick={() => navigate('/usuarios/novo')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>

            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <Button size="sm" onClick={executeSearch}>
            <Search className="h-4 w-4 mr-2" />
            Pesquisar
          </Button>
        </div>
      </div>

      {/* MENSAGEM */}
      {message && (
        <div
          className={`p-3 rounded-md border ${
            messageType === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message}
        </div>
      )}

      {/* MODAL DE FILTROS */}
      <Modal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filtros">
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Status</label>
            <select
              value={tempFilters.ativo}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, ativo: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Todos</option>
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Tipo</label>
            <select
              value={tempFilters.role}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, role: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Todos</option>
              <option value="administrador">Administrador</option>
              <option value="normal">Normal</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={handleClearFilters}>
              Limpar
            </Button>
            <Button onClick={handleApplyFilters}>Aplicar</Button>
          </div>
        </div>
      </Modal>

      {/* LISTA */}
      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="h-10 w-10 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <Card padding={false}>
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Lista de Usuários ({pagination.total})
            </h3>
          </div>

          {usuarios.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Nenhum usuário encontrado</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usuarios.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{u.nome}</p>
                            <p className="text-xs text-gray-500">ID: {u.id}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            {u.email}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {u.role === 'administrador' ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                              Administrador
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Normal
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {u.ativo ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              Ativo
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                              Inativo
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          {u.ativo ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => inativarUsuario(u.id)}
                            >
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Inativar
                            </Button>
                          ) : (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => reativarUsuario(u.id)}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Ativar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={(p) => fetchUsuarios(p)}
                    itemsPerPage={pagination.perPage}
                    totalItems={pagination.total}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* ================= CONFIRM MODAL ================= */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Confirmar ação"
        message={confirmMessage}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmAction}
      />
    </div>
  );
}
