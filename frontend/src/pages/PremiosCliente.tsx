import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Search, Gift, CheckCircle, Calendar, Trophy, Package, Edit3, Save, Trash2 } from 'lucide-react';
import Card from '../components/UI/Card';
import Modal from '../components/UI/Modal';
import Button from '../components/UI/Button';
import { Input } from '../components/UI/InputRifa';
import { rifaService } from '../services/api';
import { PremioCliente } from '../types';

export const PremiosCliente: React.FC = () => {
  const [nomeCliente, setNomeCliente] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('Erro');
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [isConfirmEntregarOpen, setIsConfirmEntregarOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [premioParaExcluir, setPremioParaExcluir] = useState<PremioCliente | null>(null);
  const [premioSelecionado, setPremioSelecionado] = useState<PremioCliente | null>(null);
  const [premios, setPremios] = useState<PremioCliente[]>([]);
  const [produtos, setProdutos] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [pesquisaRealizada, setPesquisaRealizada] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<'pendente' | 'entregue' | 'todos'>('pendente');
  const [editando, setEditando] = useState<string | null>(null);
  const [edicao, setEdicao] = useState<{ produto_id: string; quantidade: number }>({
    produto_id: '',
    quantidade: 1,
  });
  const [isNovoProdutoOpen, setIsNovoProdutoOpen] = useState(false);
  const [novoProduto, setNovoProduto] = useState<{ produto_id: string; quantidade: number }>({
    produto_id: '',
    quantidade: 1,
  });
  const [colocacaoSelecionada, setColocacaoSelecionada] = useState<string | null>(null);

  // Adicione no topo do arquivo, antes do export
  const gerarUUID = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);


  // 🔹 Busca os produtos disponíveis ao carregar
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const data = await rifaService.listarProdutos();
        setProdutos(data);
      } catch (err) {
        console.error('Erro ao buscar produtos', err);
      }
    };
    fetchProdutos();
  }, []);

  // 🔍 Buscar prêmios (agora envia o filtro ao backend)
  const buscarPremios = async () => {
    if (!nomeCliente.trim()) {
      alert('Por favor, digite o nome do cliente');
      return;
    }

    try {
      setLoading(true);
      const data = await rifaService.buscarPremiosPorNome(nomeCliente.trim(), filtroStatus);
      setPremios(data);
      setPesquisaRealizada(true);
    } catch (error) {
      console.error('Erro ao buscar prêmios:', error);
      setErrorTitle('Erro ao Buscar Prêmios');
      setErrorMessage('Não foi possível buscar os prêmios deste cliente.');
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Deletar prêmio
  const deletarPremio = async (premioId: string) => {
    try {
      await rifaService.deletarPremio(premioId);

      setPremios((prev) => prev.filter((p) => p.premio_id !== premioId));
    } catch (error: any) {
      setErrorTitle('Erro ao Deletar Prêmio');
      setErrorMessage(error.response?.data?.message || 'Erro ao deletar prêmio.');
    }
  };


  // 🎁 Marcar prêmio como entregue (envia produto_id e quantidade)
  const marcarComoRetirado = async (premioId: string) => {
    try {
      const premio = premios.find((p) => p.premio_id === premioId);
      if (!premio) return;

      const body = {
        produto_id: premio.produto_id,
        quantidade: premio.quantidade,
        status_entrega: 'entregue',
        cliente_id: premio.ganhador_id
      };

      await rifaService.marcarPremioComoEntregue(premioId, body);

      setPremios((prev) =>
        prev.map((p) =>
          p.premio_id === premioId ? { ...p, status_entrega: 'entregue' } : p
        )
      );
    } catch (error: any) {
      setErrorTitle('Erro ao Marcar Prêmio como Entregue');
      setErrorMessage(error.response?.data?.message || 'Erro ao marcar prêmio como entregue');
    }
  };

  // ✏️ Atualizar prêmio existente
  const salvarEdicao = async (premioId: string) => {
    try {
      await rifaService.atualizarPremio(premioId, edicao);

      const produtoAtualizado = produtos.find(
        (p) => p.id.toString() === edicao.produto_id.toString()
      );

      setPremios((prev) =>
        prev.map((p) =>
          p.premio_id === premioId
            ? {
              ...p,
              produto_id: edicao.produto_id,
              quantidade: edicao.quantidade,
              nome_produto: produtoAtualizado ? produtoAtualizado.nome : p.nome_produto,
            }
            : p
        )
      );

      setEditando(null);
    } catch (error: any) {
      setErrorTitle('Erro ao Atualizar Prêmio');
      setErrorMessage(error.response?.data?.message || 'Erro ao atualizar prêmio');
    }
  };

  // 🔎 Filtros
  const premiosFiltrados =
    filtroStatus === 'todos'
      ? premios
      : premios.filter((p) => p.status_entrega === filtroStatus);

  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR');

  const agruparPorRifa = () => {
    const grupos: { [key: string]: PremioCliente[] } = {};
    premios.forEach((premio) => {
      const chave = `${premio.rifa_nome}_${premio.rifa_data}_${premio.posicao}`;
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(premio);
    });
    return Object.values(grupos);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Prêmios do Cliente</h1>
        <p className="text-gray-600 mt-2">Consulte e gerencie os prêmios ganhos pelos clientes</p>
      </div>

      <Card title="Buscar Cliente">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Digite o nome do cliente..."
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && buscarPremios()}
          />
          <Button onClick={buscarPremios} disabled={loading} className="flex items-center gap-2">
            <Search size={20} />
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as any)}
            className="border rounded-md px-3 py-2 text-gray-700 bg-white"
          >
            <option value="pendente">Pendentes</option>
            <option value="entregue">Entregues</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </Card>

      {pesquisaRealizada && (
        <>
          {premiosFiltrados.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Gift size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">Nenhum prêmio encontrado</p>
                <p className="text-gray-500 mt-2">
                  Este cliente não possui prêmios nesse filtro
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {agruparPorRifa().map((grupo, index) => {
                const grupoFiltrado = grupo.filter((p) =>
                  filtroStatus === 'todos' ? true : p.status_entrega === filtroStatus
                );
                if (grupoFiltrado.length === 0) return null;

                const primeiroItem = grupoFiltrado[0];
                const todosPendentes = grupoFiltrado.every((p) => p.status_entrega === 'pendente');
                const todosEntregues = grupoFiltrado.every((p) => p.status_entrega === 'entregue');

                return (
                  <Card key={index}>
                    <div className="space-y-4">
                      {/* Cabeçalho */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            {primeiroItem.ganhador_nome} ({primeiroItem.rifa_nome})
                          </h3>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              <span>{formatarData(primeiroItem.rifa_data)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Trophy size={16} />
                              <span>{primeiroItem.posicao}º Lugar</span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${todosEntregues
                            ? 'bg-green-100 text-green-800'
                            : todosPendentes
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                            }`}
                        >
                          {todosEntregues ? 'Todos Entregues' : todosPendentes ? 'Pendentes' : 'Parcial'}
                        </span>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-700 mb-3">Prêmios:</h4>

                        {!todosEntregues && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const colocacaoId =
                                primeiroItem.colocacao_id ||
                                primeiroItem.colocacaoId ||
                                (primeiroItem.colocacao && primeiroItem.colocacao.id);

                              if (!colocacaoId) {
                                console.error('❌ Colocação ID não encontrado:', primeiroItem);
                                setErrorTitle('Erro ao Adicionar Produto');
                                setErrorMessage('Não foi possível identificar o ID da colocação deste prêmio.');
                                return;
                              }

                              console.log('✅ Colocação ID selecionada:', colocacaoId);
                              setColocacaoSelecionada(String(colocacaoId));
                              setIsNovoProdutoOpen(true);
                            }}
                            className="flex items-center gap-2 mb-2"
                          >
                            <Package size={16} />
                            Adicionar Produto
                          </Button>
                        )}



                        <div className="space-y-2">
                          {grupoFiltrado.map((premio) => (
                            <div
                              key={premio.premio_id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${premio.status_entrega === 'entregue'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                                }`}
                            >
                              {/* Editando */}
                              {editando === premio.premio_id ? (
                                <div className="flex flex-col md:flex-row gap-2 w-full md:items-center">
                                  <div className="flex-1 min-w-[300px]">
                                    <Select
                                      options={produtos.map((p) => ({
                                        value: p.id,
                                        label: p.nome,
                                      }))}
                                      value={
                                        produtos
                                          .filter(
                                            (p) =>
                                              p.id.toString() === edicao.produto_id.toString()
                                          )
                                          .map((p) => ({
                                            value: p.id,
                                            label: p.nome,
                                          }))[0] || null
                                      }
                                      onChange={(opt) =>
                                        setEdicao({
                                          ...edicao,
                                          produto_id: opt?.value?.toString() || '',
                                        })
                                      }
                                      placeholder="Selecione um produto"
                                      noOptionsMessage={() => 'Nenhum produto encontrado'}
                                      menuPortalTarget={
                                        typeof document !== 'undefined'
                                          ? document.body
                                          : undefined
                                      }
                                      styles={{
                                        menuPortal: (base) => ({
                                          ...base,
                                          zIndex: 99999,
                                        }),
                                      }}
                                    />
                                  </div>

                                  <Input
                                    type="number"
                                    min="1"
                                    value={edicao.quantidade}
                                    onChange={(e) =>
                                      setEdicao({
                                        ...edicao,
                                        quantidade: Number(e.target.value),
                                      })
                                    }
                                    className="w-24"
                                  />

                                  <div className="flex gap-2 mr-2">
                                    <Button
                                      size="sm"
                                      variant="success"
                                      onClick={() => {
                                        setPremioSelecionado(premio);
                                        setIsConfirmSaveOpen(true);
                                      }}
                                      className="flex items-center gap-1"
                                    >
                                      <Save size={16} />
                                      Salvar
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditando(null);
                                        setEdicao({ produto_id: '', quantidade: 1 });
                                      }}
                                      className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`font-medium ${premio.status_entrega === 'entregue'
                                      ? 'text-green-700 line-through'
                                      : 'text-gray-800'
                                      }`}
                                  >
                                    {premio.quantidade}x {premio.nome_produto}
                                  </span>
                                  {premio.status_entrega === 'pendente' && (
                                    <div className="flex items-center gap-2">



                                    </div>
                                  )}

                                </div>
                              )}

                              {premio.status_entrega === 'pendente' && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditando(premio.premio_id);
                                      setEdicao({
                                        produto_id: premio.produto_id || '',
                                        quantidade: premio.quantidade,
                                      });
                                    }}
                                    className="flex items-center gap-1"
                                  >
                                    <Edit3 size={16} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => {
                                      setPremioParaExcluir(premio);
                                      setIsConfirmDeleteOpen(true);
                                    }}
                                    className="flex items-center gap-1"
                                  >
                                    <Trash2 size={16} />
                                  </Button>

                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => {
                                      setPremioSelecionado(premio);
                                      setIsConfirmEntregarOpen(true);
                                    }}
                                    className="flex items-center gap-1"
                                  >
                                    <CheckCircle size={16} />
                                    Marcar como Retirado
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modais */}
      <Modal
        isOpen={isConfirmSaveOpen}
        onClose={() => setIsConfirmSaveOpen(false)}
        title="Confirmar Alteração"
      >
        <div className="space-y-4">
          <p>Tem certeza que deseja salvar as alterações deste prêmio?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsConfirmSaveOpen(false)}>
              Não
            </Button>
            <Button
              onClick={async () => {
                if (premioSelecionado) {
                  await salvarEdicao(premioSelecionado.premio_id);
                  setIsConfirmSaveOpen(false);
                  setPremioSelecionado(null);
                }
              }}
            >
              Sim
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isConfirmEntregarOpen}
        onClose={() => setIsConfirmEntregarOpen(false)}
        title="Confirmar Entrega"
      >
        <div className="space-y-4">
          <p>Tem certeza que deseja marcar este prêmio como entregue?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsConfirmEntregarOpen(false)}>
              Não
            </Button>
            <Button
              onClick={async () => {
                if (premioSelecionado) {
                  await marcarComoRetirado(premioSelecionado.premio_id);
                  setIsConfirmEntregarOpen(false);
                  setPremioSelecionado(null);
                }
              }}
            >
              Sim
            </Button>
          </div>
        </div>
      </Modal>

      {/* 🧱 Modal de erro */}
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

      {/* ➕ Modal para adicionar novo produto */}
      <Modal
        isOpen={isNovoProdutoOpen}
        onClose={() => {
          setIsNovoProdutoOpen(false);
          setNovoProduto({ produto_id: '', quantidade: 1 });
        }}
        title="Adicionar Novo Produto ao Prêmio"
      >
        <div className="space-y-4">
          <Select
            options={produtos.map((p) => ({
              value: p.id,
              label: p.nome,
            }))}
            value={
              produtos
                .filter((p) => p.id.toString() === novoProduto.produto_id.toString())
                .map((p) => ({
                  value: p.id,
                  label: p.nome,
                }))[0] || null
            }
            onChange={(opt) =>
              setNovoProduto({
                ...novoProduto,
                produto_id: opt?.value?.toString() || '',
              })
            }
            placeholder="Selecione um produto"
            noOptionsMessage={() => 'Nenhum produto encontrado'}
            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 99999 }),
            }}
          />

          <Input
            label="Quantidade"
            type="number"
            min="1"
            value={novoProduto.quantidade}
            onChange={(e) =>
              setNovoProduto({
                ...novoProduto,
                quantidade: Number(e.target.value),
              })
            }
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsNovoProdutoOpen(false);
                setNovoProduto({ produto_id: '', quantidade: 1 });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                try {
                  await rifaService.adicionarNovoPremio(colocacaoSelecionada, novoProduto);

                  const grupoReferencia = premios.find(
                    (p) => p.colocacao_id?.toString() === colocacaoSelecionada?.toString()
                  );

                  const produtoNome =
                    produtos.find((p) => p.id.toString() === novoProduto.produto_id.toString())
                      ?.nome || 'Produto';

                  const novoPremioObj: PremioCliente = {
                    premio_id: gerarUUID(),
                    colocacao_id: colocacaoSelecionada,
                    produto_id: novoProduto.produto_id,
                    nome_produto: produtoNome,
                    quantidade: novoProduto.quantidade,
                    status_entrega: 'pendente',
                    rifa_nome: grupoReferencia?.rifa_nome || '',
                    rifa_data: grupoReferencia?.rifa_data || '',
                    posicao: grupoReferencia?.posicao || '',
                    ganhador_nome: grupoReferencia?.ganhador_nome || '',
                    ganhador_id: grupoReferencia?.ganhador_id || '',
                  };

                  setPremios((prev) => [...prev, novoPremioObj]);

                  setIsNovoProdutoOpen(false);
                  setNovoProduto({ produto_id: '', quantidade: 1 });

                } catch (error: any) {
                  setErrorTitle('Erro ao Adicionar Produto');
                  setErrorMessage(
                    error.response?.data?.message || 'Erro ao adicionar novo produto.'
                  );
                }
              }}
            >
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p>Tem certeza que deseja excluir este prêmio?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              Não
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (premioParaExcluir) {
                  await deletarPremio(premioParaExcluir.premio_id);
                  setPremioParaExcluir(null);
                  setIsConfirmDeleteOpen(false);
                }
              }}
            >
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
