import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Calendar, Trophy, Package, Filter, Trash2, Edit, Eye } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { Input } from '../components/UI/InputRifa';
import { Select } from '../components/UI/Select';
import { rifaService } from '../services/api';
import { RifaCompleta } from '../types/index';
import Modal from '../components/UI/Modal';


interface ListagemRifasProps {
  onNovaRifa: () => void;
  onEditarRifa: (id: string) => void;
}
type Filtros = { data: string; ganhador: string; status: string };


export const ListagemRifas: React.FC<ListagemRifasProps> = ({ onNovaRifa, onEditarRifa }) => {
  const navigate = useNavigate();
  const [rifas, setRifas] = useState<RifaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [rifaParaExcluir, setRifaParaExcluir] = useState<{ id: string; nome: string } | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const hasActiveFilters = Array.from(searchParams.keys()).length > 0;

  const [filtros, setFiltros] = useState({
    data: '',
    ganhador: '',
    status: 'em_andamento'
  });

  const solicitarExclusao = (id: string, nome: string) => {
    setRifaParaExcluir({ id, nome });
    setIsConfirmDeleteOpen(true);
  };



  useEffect(() => {
    carregarRifas();
  }, []);

  const carregarRifas = async (override?: Filtros) => {
    try {
      setLoading(true);
      const filtrosToUse = override ?? filtros; // usa os novos se vierem, senão o estado atual
      const data = await rifaService.listarRifas(filtrosToUse);
      setRifas(data);
    } catch (error) {
      console.error('Erro ao carregar rifas:', error);
      alert('Erro ao carregar rifas');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
  const newParams = new URLSearchParams();
  if (filtros.data) newParams.set('data', filtros.data);
  if (filtros.status) newParams.set('status', filtros.status);
  if (filtros.ganhador) newParams.set('ganhador', filtros.ganhador);
  
  setSearchParams(newParams);

  // 👇 PASSAR OS FILTROS ATUAIS AQUI
  carregarRifas(filtros);

  setIsFilterOpen(false);
};



  const limparFiltros = () => {
    const novos: Filtros = { data: '', ganhador: '', status: 'em_andamento' };
    setFiltros(novos);
    setSearchParams({});
    carregarRifas(novos);
  };


  const deletarRifa = async (id: string) => {
    try {
      await rifaService.deletarRifa(id);
      carregarRifas();
    } catch (error) {
      console.error('Erro ao deletar rifa:', error);
      // Se quiser, pode abrir um modal de erro aqui usando seu <Modal>
    }
  };


  const contarTotalPremios = (rifa: RifaCompleta) => {
    return rifa.colocacoes.reduce((total, col) => total + col.premios.length, 0);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando rifas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Rifas</h1>
          <p className="text-gray-600 mt-2">Gerencie suas rifas</p>
        </div>

        <div className="flex space-x-3">
          {hasActiveFilters ? (
            <>
              <Button variant="danger" onClick={limparFiltros}>
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

          <Button onClick={() => navigate('/rifas/nova')} className="flex items-center gap-2">
            <Plus size={20} />
            Nova Rifa
          </Button>
        </div>
      </div>




      {rifas.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">Nenhuma rifa encontrada</p>
            <p className="text-gray-500 mt-2">
              Clique em "Nova Rifa" para criar sua primeira rifa
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rifas.map((rifa) => (
            <Card key={rifa.id} className="hover:shadow-lg transition">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-gray-800">{rifa.nome}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${rifa.status === 'finalizada'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                      }`}
                  >
                    {rifa.status === 'finalizada' ? 'Finalizada' : 'Em Andamento'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{formatarData(rifa.data)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-gray-400" />
                    <span>{rifa.quantidade_ganhadores} ganhador(es)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-gray-400" />
                    <span>{contarTotalPremios(rifa)} prêmio(s)</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex gap-2">
                  {rifa.status === 'finalizada' ? (
                    // Caso a rifa esteja finalizada
                    <Button
                      size="sm"
                      variant="success" // ou className="bg-green-600 text-white"
                      onClick={() => onEditarRifa(rifa.id)} // função de visualização
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      Visualizar
                    </Button>
                  ) : (
                    // Caso contrário (não finalizada)
                    <>
                      <Button
                        size="sm"
                        onClick={() => onEditarRifa(rifa.id)}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Edit size={16} />
                        Editar
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => solicitarExclusao(rifa.id, rifa.nome)}
                        className="flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </Button>

                    </>
                  )}
                </div>

              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filtros de Rifas"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Data da Rifa</label>
              <Input
                type="date"
                value={filtros.data}
                onChange={(e) => setFiltros({ ...filtros, data: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Status</label>
              <Select
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'em_andamento', label: 'Em Andamento' },
                  { value: 'finalizada', label: 'Finalizada' }
                ]}
              />
            </div>
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setIsFilterOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={aplicarFiltros}>
            <Filter className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p>
            Tem certeza que deseja excluir a rifa
            {!!rifaParaExcluir?.nome && <strong> “{rifaParaExcluir.nome}”</strong>}?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsConfirmDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (rifaParaExcluir) {
                  await deletarRifa(rifaParaExcluir.id);
                  setIsConfirmDeleteOpen(false);
                  setRifaParaExcluir(null);
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
};