import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Rifa, Produto, Cliente, RifaPrize, RifaWinner, RifaInsert, RifaUpdate, RifaPrizeInsert, RifaWinnerInsert } from '../../types/index';
import { rifaService, produtoService, clienteService } from '../../services/api';

interface RifaFormProps {
  rifa: Rifa | null;
  onClose: () => void;
}

interface PrizePosition {
  position: number;
  productIds: string[];
}

export function RifaForm({ rifa, onClose }: RifaFormProps) {
  const [name, setName] = useState(rifa?.name || '');
  const [description, setDescription] = useState(rifa?.description || null);
  const [numberOfWinners, setNumberOfWinners] = useState(rifa?.numberOfWinners || 1);
  const [status, setStatus] = useState(rifa?.status || 'draft');
  const [products, setProducts] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]); // Usando Cliente para clientes
  const [prizes, setPrizes] = useState<PrizePosition[]>([]);
  const [winners, setWinners] = useState<{ position: number; customerId: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    initializePositions();
  }, [numberOfWinners]);

  async function loadData() {
    try {
      const [productsResponse, clientesResponse] = await Promise.all([
        produtoService.getAll(),
        clienteService.getAll(),
      ]);

      if (productsResponse.data) setProducts(productsResponse.data);
      if (clientesResponse.data) setClientes(clientesResponse.data);

      if (rifa) {
        // Assumindo que rifaService.getById pode retornar os prêmios e ganhadores
        // ou que teremos serviços dedicados para buscar esses dados por rifaId.
        // Para este exemplo, vou assumir que rifaService.getById retorna a rifa completa com prizes e winners
        // ou que temos métodos específicos para buscar prizes e winners.

        // Se a API de rifas retornar prizes e winners diretamente na rifa:
        // setPrizes(rifa.prizes || []);
        // setWinners(rifa.winners || []);

        // Se precisar de chamadas separadas para prizes e winners:
        const [prizesResponse, winnersResponse] = await Promise.all([
          rifaService.getPrizesByRifaId(rifa.id), // Método hipotético, precisa ser adicionado ao rifaService
          rifaService.getWinnersByRifaId(rifa.id), // Método hipotético, precisa ser adicionado ao rifaService
        ]);

        if (prizesResponse.data) {
          const groupedPrizes: PrizePosition[] = [];
          prizesResponse.data.forEach((prize: RifaPrize) => {
            const existing = groupedPrizes.find((p) => p.position === prize.position);
            if (existing) {
              existing.productIds.push(prize.productId);
            } else {
              groupedPrizes.push({
                position: prize.position,
                productIds: [prize.productId],
              });
            }
          });
          setPrizes(groupedPrizes);
        }

        if (winnersResponse.data) {
          setWinners(
            winnersResponse.data.map((w: RifaWinner) => ({
              position: w.position,
              customerId: w.customerId,
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  function initializePositions() {
    setPrizes((prev) => {
      const newPrizes: PrizePosition[] = [];
      for (let i = 1; i <= numberOfWinners; i++) {
        const existing = prev.find((p) => p.position === i);
        if (existing) {
          newPrizes.push(existing);
        } else {
          newPrizes.push({ position: i, productIds: [] });
        }
      }
      return newPrizes;
    });

    setWinners((prev) => {
      const newWinners = [];
      for (let i = 1; i <= numberOfWinners; i++) {
        const existing = prev.find((w) => w.position === i);
        if (existing) {
          newWinners.push(existing);
        } else {
          newWinners.push({ position: i, customerId: '' });
        }
      }
      return newWinners;
    });
  }

  function updatePrizeProducts(position: number, productIds: string[]) {
    setPrizes((prev) =>
      prev.map((p) => (p.position === position ? { ...p, productIds } : p))
    );
  }

  function addProductToPrize(position: number) {
    setPrizes((prev) =>
      prev.map((p) =>
        p.position === position ? { ...p, productIds: [...p.productIds, ''] } : p
      )
    );
  }

  function removeProductFromPrize(position: number, index: number) {
    setPrizes((prev) =>
      prev.map((p) =>
        p.position === position
          ? { ...p, productIds: p.productIds.filter((_, i) => i !== index) }
          : p
      )
    );
  }

  function updateWinner(position: number, customerId: string) {
    setWinners((prev) =>
      prev.map((w) => (w.position === position ? { ...w, customerId } : w))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let rifaId = rifa?.id;

      const rifaData: RifaInsert | RifaUpdate = {
        name,
        description,
        numberOfWinners,
        status,
      };

      if (rifa) {
        await rifaService.update(rifa.id, rifaData as RifaUpdate);
      } else {
        const response = await rifaService.create(rifaData as RifaInsert);
        rifaId = response.data.id;
      }

      if (rifaId) {
        // Deletar prêmios existentes (assumindo um endpoint para isso)
        await rifaService.deletePrizesByRifaId(rifaId); // Método hipotético

        const prizesToInsert: RifaPrizeInsert[] = prizes.flatMap((prize) =>
          prize.productIds
            .filter((id) => id)
            .map((productId) => ({
              rifaId: rifaId,
              position: prize.position,
              productId: productId,
            }))
        );

        if (prizesToInsert.length > 0) {
          await rifaService.createPrizes(prizesToInsert); // Método hipotético
        }

        // Deletar ganhadores existentes (assumindo um endpoint para isso)
        await rifaService.deleteWinnersByRifaId(rifaId); // Método hipotético

        const winnersToInsert: RifaWinnerInsert[] = winners
          .filter((w) => w.customerId)
          .map((winner) => ({
            rifaId: rifaId,
            position: winner.position,
            customerId: winner.customerId,
          }));

        if (winnersToInsert.length > 0) {
          await rifaService.createWinners(winnersToInsert); // Método hipotético
        }
      }

      onClose();
    } catch (error) {
      console.error('Error saving rifa:', error);
      alert('Erro ao salvar rifa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {rifa ? 'Editar Rifa' : 'Nova Rifa'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Rifa *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Rifa de Natal 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Rascunho</option>
              <option value="active">Ativa</option>
              <option value="completed">Finalizada</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
          <textarea
            value={description || ''}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descreva a rifa..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Ganhadores *
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={numberOfWinners}
            onChange={(e) => setNumberOfWinners(parseInt(e.target.value) || 1)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Prêmios por Colocação
          </h3>
          <div className="space-y-6">
            {prizes.map((prize) => (
              <div key={prize.position} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  {prize.position}º Lugar
                </h4>
                <div className="space-y-2">
                  {prize.productIds.map((productId, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={productId}
                        onChange={(e) => {
                          const newProductIds = [...prize.productIds];
                          newProductIds[index] = e.target.value;
                          updatePrizeProducts(prize.position, newProductIds);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecione um produto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.nome}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeProductFromPrize(prize.position, index)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addProductToPrize(prize.position)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Plus size={16} />
                    Adicionar Produto
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ganhadores</h3>
          <div className="space-y-4">
            {winners.map((winner) => (
              <div key={winner.position}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {winner.position}º Lugar
                </label>
                <select
                  value={winner.customerId}
                  onChange={(e) => updateWinner(winner.position, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um ganhador</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
