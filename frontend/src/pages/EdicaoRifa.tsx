import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { Card } from '../components/UI/CardRifa';
import { Button } from '../components/UI/ButtonRifa';
import ReactSelect from 'react-select';
import Modal from '../components/UI/Modal';
import { rifaService, clienteService } from '../services/api';
import { RifaCompleta } from '../types';

interface Cliente {
  id: number;
  name: string;
}

interface Ganhador {
  colocacaoId: string;
  ganhadorId: number;
  ganhadorNome: string;
}

interface EdicaoRifaProps {
  rifaId: string;
  onVoltar: () => void;
}

export const EdicaoRifa: React.FC<EdicaoRifaProps> = ({ rifaId, onVoltar }) => {
  const [rifa, setRifa] = useState<RifaCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizando, setFinalizando] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [ganhadores, setGanhadores] = useState<Record<string, { id: number; nome: string }>>({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // ✅ novo estado

  useEffect(() => {
    carregarRifa();
    carregarClientes();
  }, [rifaId]);

  const carregarRifa = async () => {
    try {
      setLoading(true);
      if (!rifaId || rifaId === 'undefined') {
        alert('ID da rifa inválido');
        onVoltar();
        return;
      }

      const data = await rifaService.obterRifa(rifaId);
      setRifa(data);

      const ganhadoresIniciais: Record<string, { id: number; nome: string }> = {};
      data.colocacoes.forEach(colocacao => {
        if (colocacao.ganhador_nome && colocacao.ganhador_id) {
          ganhadoresIniciais[colocacao.id] = {
            id: colocacao.ganhador_id,
            nome: colocacao.ganhador_nome
          };
        }
      });
      setGanhadores(ganhadoresIniciais);
    } catch (error) {
      console.error('Erro ao carregar rifa:', error);
      alert('Erro ao carregar rifa');
      onVoltar();
    } finally {
      setLoading(false);
    }
  };

  const carregarClientes = async () => {
    try {
      setLoadingClientes(true);
      const response = await clienteService.getAll();
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoadingClientes(false);
    }
  };

  const atualizarGanhadorLocal = (colocacaoId: string, ganhadorNome: string, ganhadorId?: number) => {
    if (ganhadorId && ganhadorNome) {
      setGanhadores(prev => ({
        ...prev,
        [colocacaoId]: { id: ganhadorId, nome: ganhadorNome }
      }));
    } else {
      setGanhadores(prev => {
        const novosGanhadores = { ...prev };
        delete novosGanhadores[colocacaoId];
        return novosGanhadores;
      });
    }
  };

  const todosGanhadoresDefinidos = () => {
    if (!rifa) return false;
    return rifa.colocacoes.every(colocacao => ganhadores[colocacao.id]);
  };

  const finalizarRifa = async () => {
    if (!todosGanhadoresDefinidos()) {
      alert('Você precisa definir o ganhador de todas as posições antes de finalizar a rifa.');
      return;
    }

    try {
      setFinalizando(true);

      const ganhadoresArray: Ganhador[] = Object.entries(ganhadores).map(([colocacaoId, ganhador]) => ({
        colocacaoId,
        ganhadorId: ganhador.id,
        ganhadorNome: ganhador.nome
      }));

      await rifaService.atualizarRifa(rifaId, {
        status: 'finalizada',
        ganhadores: ganhadoresArray
      });

      onVoltar();
    } catch (error) {
      console.error('Erro ao finalizar rifa:', error);
      alert('Erro ao finalizar rifa');
    } finally {
      setFinalizando(false);
      setIsConfirmModalOpen(false); // fecha o modal após concluir
    }
  };

  const obterSufixoPosicao = (pos: number) => 'º';
  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando rifa...</div>
      </div>
    );
  }

  if (!rifa) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Rifa não encontrada</p>
        <Button onClick={onVoltar} className="mt-4">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={onVoltar} className="flex items-center gap-2">
          <ArrowLeft size={20} />
          Voltar
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800">{rifa.nome}</h1>
          <p className="text-gray-600">Data: {formatarData(rifa.data)}</p>
        </div>

        <Button
          variant="success"
          onClick={() => setIsConfirmModalOpen(true)} // ✅ abre o modal
          disabled={
            finalizando ||
            !todosGanhadoresDefinidos() ||
            rifa.status === 'finalizada'
          }
          className="flex items-center gap-2"
        >
          {rifa.status === 'finalizada'
            ? 'Rifa Finalizada'
            : finalizando
              ? 'Salvando...'
              : 'Finalizar Rifa'}
        </Button>
      </div>

      {rifa.colocacoes.map((colocacao) => (
        <Card key={colocacao.id} title={`${colocacao.posicao}${obterSufixoPosicao(colocacao.posicao)} Lugar`}>
          <div className="space-y-4">
            <ReactSelect
              value={
                clientes
                  .map(c => ({ value: c.id, label: `${c.name} - ${c.number}`}))
                  .find(o => o.value === ganhadores[colocacao.id]?.id) || null
              }
              onChange={(option) => {
                if (rifa.status === 'finalizada') return;
                if (option) {
                  atualizarGanhadorLocal(colocacao.id, option.label, Number(option.value));
                } else {
                  atualizarGanhadorLocal(colocacao.id, '', null);
                }
              }}
              options={clientes.map(c => ({ value: c.id.toString(), label: `${c.name} - ${c.number}` }))}
              isClearable={rifa.status !== 'finalizada'}
              isSearchable={rifa.status !== 'finalizada'}
              isDisabled={rifa.status === 'finalizada'}
              isLoading={loadingClientes}
              placeholder={
                rifa.status === 'finalizada'
                  ? 'Ganhador definido'
                  : 'Digite para buscar um cliente...'
              }
              className="w-full"
            />

            {colocacao.premios.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Package size={18} />
                  Prêmios
                </h4>
                <div className="space-y-2">
                  {colocacao.premios.map((premio) => (
                    <div
                      key={premio.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 border-gray-200"
                    >
                      <span className="font-medium text-gray-800">
                        {premio.quantidade}x {premio.nome_produto}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}

      {/* ✅ Modal de Confirmação */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmar Finalização da Rifa"
      >
        <div className="space-y-4">
          <p>Tem certeza que deseja finalizar esta rifa? Após finalizar, não será mais possível editar os ganhadores.</p>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Não
            </Button>

            <Button
              onClick={finalizarRifa}
              disabled={finalizando}
            >
              {finalizando ? 'Finalizando...' : 'Sim, Finalizar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
