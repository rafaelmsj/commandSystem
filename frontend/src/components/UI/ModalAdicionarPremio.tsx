import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from './ModalRifa';
import { Button } from './ButtonRifa';
import { Input } from './InputRifa';
import { Autocomplete } from './AutoComplete';
import { produtoService } from '../../services/api';

interface Produto {
  id: number;
  nome: string;
}

interface ModalAdicionarPremioProps {
  isOpen: boolean;
  onClose: () => void;
  onAdicionar: (nomeProduto: string, quantidade: number) => void;
}

export const ModalAdicionarPremio: React.FC<ModalAdicionarPremioProps> = ({
  isOpen,
  onClose,
  onAdicionar
}) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      carregarProdutos();
    }
  }, [isOpen]);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const response = await produtoService.getAll();
      setProdutos(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      alert('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionar = () => {
    if (!produtoSelecionado.trim()) {
      alert('Por favor, selecione um produto');
      return;
    }

    if (quantidade < 1) {
      alert('A quantidade deve ser pelo menos 1');
      return;
    }

    onAdicionar(produtoSelecionado, quantidade);
    setProdutoSelecionado('');
    setQuantidade(1);
    onClose();
  };

  const handleClose = () => {
    setProdutoSelecionado('');
    setQuantidade(1);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar Prêmio" size="md">
      <div className="space-y-4">
        <Autocomplete
          label="Produto"
          placeholder="Digite para buscar um produto..."
          value={produtoSelecionado}
          onChange={(value) => setProdutoSelecionado(value)}
          options={produtos.map(p => ({ id: p.id, label: p.nome }))}
          loading={loading}
        />

        <Input
          label="Quantidade"
          type="number"
          min="1"
          value={quantidade}
          onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleAdicionar} className="flex items-center gap-2">
            <Plus size={18} />
            Adicionar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
