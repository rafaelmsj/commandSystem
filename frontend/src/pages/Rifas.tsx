import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Trophy } from 'lucide-react';
import { Rifa } from '../types';  // Supondo que Rifa seja um tipo que você tem em types/index.ts
import { RifaForm } from '../components/UI/RifaForm';  // Componente de formulário para criar ou editar rifas
import { rifaService } from '../services/api';  // Serviço que interage com a API

export function RifasPage() {
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRifa, setEditingRifa] = useState<Rifa | null>(null);

  useEffect(() => {
    loadRifas();
  }, []);

  async function loadRifas() {
    try {
      setLoading(true);
      const response = await rifaService.getAll();  // Chama o serviço para pegar todas as rifas
      setRifas(response.data);
    } catch (error) {
      console.error('Erro ao carregar rifas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta rifa?')) return;

    try {
      await rifaService.delete(id);  // Chama o serviço para deletar a rifa
      loadRifas();
    } catch (error) {
      console.error('Erro ao excluir a rifa:', error);
    }
  }

  function handleEdit(rifa: Rifa) {
    setEditingRifa(rifa);  // Define a rifa a ser editada
    setShowForm(true);  // Abre o formulário de edição
  }

  function handleCloseForm() {
    setShowForm(false);  // Fecha o formulário
    setEditingRifa(null);  // Limpa a rifa em edição
    loadRifas();  // Recarrega as rifas
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho';
      case 'active':
        return 'Ativa';
      case 'completed':
        return 'Finalizada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (showForm) {
    return <RifaForm rifa={editingRifa} onClose={handleCloseForm} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rifas</h1>
          <p className="text-gray-600 mt-1">Gerencie suas rifas e sorteios</p>
        </div>
        <button
          onClick={() => setShowForm(true)}  // Abre o formulário para criar nova rifa
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nova Rifa
        </button>
      </div>

      {rifas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma rifa cadastrada</h3>
          <p className="text-gray-600 mb-6">Comece criando sua primeira rifa</p>
          <button
            onClick={() => setShowForm(true)}  // Abre o formulário para criar nova rifa
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Criar Rifa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rifas.map((rifa) => (
            <div
              key={rifa.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{rifa.name}</h3>
                  {rifa.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{rifa.description}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rifa.status)}`}>
                  {getStatusLabel(rifa.status)}
                </span>
              </div>

              <div className="mb-4 py-3 px-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Número de Ganhadores</span>
                  <span className="text-lg font-bold text-blue-600">{rifa.numberOfWinners}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(rifa)}  // Abre o formulário de edição com os dados da rifa
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Edit2 size={16} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(rifa.id)}  // Deleta a rifa
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
