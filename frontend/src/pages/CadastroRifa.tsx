import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Card } from '../components/UI/CardRifa';
import Button from '../components/UI/Button';
import { Input } from '../components/UI/InputRifa';
import { rifaService } from '../services/api';
import ReactSelect from 'react-select';

interface Premio {
  id: string;
  produto_id: string;
  quantidade: number;
}

interface Colocacao {
  posicao: number;
  premios: Premio[];
}

interface CadastroRifaProps {
  onVoltar: () => void;
}

export const CadastroRifa: React.FC<CadastroRifaProps> = ({ onVoltar }) => {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [quantidadeGanhadores, setQuantidadeGanhadores] = useState(1);
  const [colocacoes, setColocacoes] = useState<Colocacao[]>([
    { posicao: 1, premios: [{ id: crypto.randomUUID(), produto_id: '', quantidade: 1 }] }
  ]);
  const [salvando, setSalvando] = useState(false);

  const [produtos, setProdutos] = useState<{ id: string | number; nome: string }[]>([]);

  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        const data = await rifaService.listarProdutos();
        setProdutos(data);
      } catch (err) {
        console.error(err);
      }
    };
    carregarProdutos();
  }, []);

  const atualizarQuantidadeGanhadores = (qtd: number) => {
    const novaQtd = Math.max(1, qtd);
    setQuantidadeGanhadores(novaQtd);

    const novasColocacoes: Colocacao[] = [];
    for (let i = 1; i <= novaQtd; i++) {
      const colocacaoExistente = colocacoes.find(c => c.posicao === i);
      if (colocacaoExistente) {
        novasColocacoes.push(colocacaoExistente);
      } else {
        novasColocacoes.push({
          posicao: i,
          premios: [{ id: crypto.randomUUID(), produto_id: '', quantidade: 1 }]
        });
      }
    }
    setColocacoes(novasColocacoes);
  };

  const adicionarPremio = (posicao: number) => {
    setColocacoes(colocacoes.map(col => {
      if (col.posicao === posicao) {
        return {
          ...col,
          premios: [...col.premios, { id: crypto.randomUUID(), produto_id: '', quantidade: 1 }]
        };
      }
      return col;
    }));
  };

  const removerPremio = (posicao: number, premioId: string) => {
    setColocacoes(colocacoes.map(col => {
      if (col.posicao === posicao) {
        return {
          ...col,
          premios: col.premios.filter(p => p.id !== premioId)
        };
      }
      return col;
    }));
  };

  const atualizarPremio = (posicao: number, premioId: string, campo: 'produto_id' | 'quantidade', valor: string | number) => {
    setColocacoes(colocacoes.map(col => {
      if (col.posicao === posicao) {
        return {
          ...col,
          premios: col.premios.map(p => {
            if (p.id === premioId) {
              return { ...p, [campo]: valor };
            }
            return p;
          })
        };
      }
      return col;
    }));
  };

  const validarFormulario = () => {
    if (!nome.trim()) {
      alert('Por favor, preencha o nome da rifa');
      return false;
    }
    if (!data) {
      alert('Por favor, selecione a data da rifa');
      return false;
    }
    if (quantidadeGanhadores < 1) {
      alert('A quantidade de ganhadores deve ser pelo menos 1');
      return false;
    }

    for (const col of colocacoes) {
      const premiosValidos = col.premios.filter(p => p.produto_id !== '');
      if (premiosValidos.length === 0) {
        alert(`Por favor, adicione pelo menos um prêmio para o ${col.posicao}º lugar`);
        return false;
      }
    }

    return true;
  };

  const salvarRifa = async () => {
    if (!validarFormulario()) return;

    try {
      setSalvando(true);

      const colocacoesParaSalvar = colocacoes.map(col => ({
        posicao: col.posicao,
        premios: col.premios
          .filter(p => p.produto_id !== '')
          .map(p => ({
            produto_id: p.produto_id,
            quantidade: p.quantidade
          }))
      }));

      await rifaService.criarRifa({
        nome: nome.trim(),
        data,
        quantidade_ganhadores: quantidadeGanhadores,
        colocacoes: colocacoesParaSalvar
      });

      navigate('/rifas');
    } catch (error) {
      console.error('Erro ao salvar rifa:', error);
      alert('Erro ao salvar rifa. Por favor, tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const obterSufixoPosicao = (pos: number) => 'º';

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate(`/rifas`)} className="flex items-center gap-2">
          <ArrowLeft size={20} />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-gray-800">Nova Rifa</h1>
      </div>

      <Card title="Informações Básicas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Nome da Rifa"
              placeholder="Ex: Rifa de Natal 2024"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <Input
            label="Data da Rifa"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />
        </div>

        <div className="mt-4">
          <Input
            label="Quantidade de Ganhadores"
            type="number"
            min="1"
            value={quantidadeGanhadores}
            onChange={(e) => atualizarQuantidadeGanhadores(parseInt(e.target.value) || 1)}
            required
          />
        </div>
      </Card>

      {colocacoes.map((colocacao) => (
        <Card
          key={colocacao.posicao}
          title={`${colocacao.posicao}${obterSufixoPosicao(colocacao.posicao)} Lugar`}
        >
          <div className="space-y-4">
            {colocacao.premios.map((premio, index) => (
              <div key={premio.id} className="">
                <ol className="flex gap-2 items-end" key={premio.id}>
                  <div className="flex-1">
                    {index === 0 && (
                      <label className="text-sm font-semibold mb-1">Produto</label>
                    )}
                    <ReactSelect
                      options={produtos.map((p) => ({
                        value: p.id,
                        label: p.nome,
                      }))}
                      value={
                        premio.produto_id
                          ? produtos
                              .filter(
                                (p) =>
                                  p.id.toString() === premio.produto_id.toString()
                              )
                              .map((p) => ({
                                value: p.id,
                                label: p.nome,
                              }))[0] || null
                          : null
                      }
                      onChange={(opt) => {
                        const val = opt?.value || '';
                        atualizarPremio(
                          colocacao.posicao,
                          premio.id,
                          'produto_id',
                          val
                        );
                      }}
                      placeholder="Selecione um produto"
                      noOptionsMessage={() => 'Nenhum produto encontrado'}
                      menuPortalTarget={
                        typeof document !== 'undefined'
                          ? document.body
                          : undefined
                      }
                    />
                  </div>

                  <div className="w-32">
                    <Input
                      label={index === 0 ? 'Quantidade' : ''}
                      type="number"
                      min="1"
                      value={premio.quantidade}
                      onChange={(e) =>
                        atualizarPremio(
                          colocacao.posicao,
                          premio.id,
                          'quantidade',
                          parseInt(e.target.value) || 1
                        )
                      }
                    />
                  </div>

                  {colocacao.premios.length > 1 && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        removerPremio(colocacao.posicao, premio.id)
                      }
                      className="mb-0"
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                </ol>
              </div>
            ))}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => adicionarPremio(colocacao.posicao)}
              className="flex items-center gap-2"
            >
              <Plus size={18} />
              Adicionar Prêmio
            </Button>
          </div>
        </Card>
      ))}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onVoltar}>
          Cancelar
        </Button>
        <Button
          onClick={salvarRifa}
          disabled={salvando}
          className="flex items-center gap-2"
        >
          <Save size={20} />
          {salvando ? 'Salvando...' : 'Salvar Rifa'}
        </Button>
      </div>
    </div>
  );
};
