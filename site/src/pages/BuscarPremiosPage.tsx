import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Gift, Package, Trophy, Calendar, Award } from 'lucide-react';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';
import { buscarPremios, Premio } from '../services/api';

export default function BuscarPremiosPage() {
  const navigate = useNavigate();
  const [celular, setCelular] = useState('');
  const [premios, setPremios] = useState<Premio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // 🔹 Formatação automática de celular
  const formatarCelular = (valor: string) => {
    const somenteNumeros = valor.replace(/\D/g, '');

    if (somenteNumeros.length <= 2) return somenteNumeros;
    if (somenteNumeros.length <= 7)
      return `(${somenteNumeros.slice(0, 2)}) ${somenteNumeros.slice(2)}`;
    return `(${somenteNumeros.slice(0, 2)}) ${somenteNumeros.slice(2, 7)}-${somenteNumeros.slice(7, 11)}`;
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCelular(formatarCelular(e.target.value));
  };

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  const celularNumerico = celular.replace(/\D/g, '');

  // 🔥 Validar quantidade de dígitos (10 ou 11)
  if (celularNumerico.length !== 10 && celularNumerico.length !== 11) {
    setError('Digite um número válido com 10 ou 11 dígitos.');
    return;
  }

  setLoading(true);
  setError('');
  setSearched(true);

  try {
    const resultado = await buscarPremios(celularNumerico);
    setPremios(resultado);
  } catch (err) {
    setError('Erro ao buscar prêmios. Verifique sua conexão e tente novamente.');
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  const formatarData = (data: string) => {
    try {
      return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return data;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'entregue'
      ? 'bg-green-100 text-green-800 border-green-300'
      : 'bg-yellow-100 text-yellow-800 border-yellow-300';
  };

  const getStatusText = (status: string) => {
    return status === 'entregue' ? 'Entregue' : 'Pendente';
  };

  // 🔹 Agrupar prêmios por rifa
  const agruparPorRifa = () => {
    const grupos: Record<string, Premio[]> = {};

    premios.forEach((premio) => {
      const chave = `${premio.rifa_nome}_${premio.rifa_data}_${premio.posicao}`;
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(premio);
    });

    return Object.values(grupos);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <Header title="🎁 Buscar Prêmios" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>

        <Card className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="celular" className="block text-sm font-medium text-gray-700 mb-2">
                Digite seu celular
              </label>

              <input
                id="celular"
                type="tel"
                value={celular}
                onChange={handleCelularChange}
                maxLength={15}
                placeholder="(99) 99999-9999"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-500 focus:outline-none transition-colors text-lg"
              />

              {/* 🔹 Lembrete solicitado */}
              <p className="text-xs text-gray-600 mt-2">
                Os prêmios não são atualizados aos finais de semana, e podem demorar até 12h para serem atualizados.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <Button type="submit" variant="primary" fullWidth>
              <div className="flex items-center justify-center gap-2">
                <Search size={20} />
                <span>{loading ? 'Buscando...' : 'Buscar'}</span>
              </div>
            </Button>
          </form>
        </Card>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        )}

        {!loading && searched && premios.length === 0 && (
          <Card className="text-center py-12">
            <Gift size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum prêmio encontrado</h3>
            <p className="text-gray-500">
              Não encontramos prêmios para este número de celular.
            </p>
          </Card>
        )}

        {!loading && premios.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Seus Prêmios ({premios.length})
            </h2>

            {agruparPorRifa().map((grupo, index) => {
              const primeiro = grupo[0];

              return (
                <Card key={index} className="hover:shadow-2xl transition-all">
                  <div className="flex flex-col gap-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Trophy className="text-green-600" />
                      {primeiro.rifa_nome}
                    </h3>

                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Calendar size={16} />
                      <span>{formatarData(primeiro.rifa_data)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Award size={16} />
                      <span><strong>Posição:</strong> {primeiro.posicao}º</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    {grupo.map((premio) => (
                      <div
                        key={premio.id}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Package size={18} className="text-green-600" />
                            <span className="text-sm">
                              <strong>Produto:</strong> {premio.nome_produto}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-700 text-sm">
                            <Award size={16} className="text-green-600" />
                            <span>
                              <strong>Quantidade:</strong> {premio.quantidade}
                            </span>
                          </div>
                        </div>

                        <span className={`px-4 py-2 rounded-full font-semibold text-sm border-2 ${getStatusColor(premio.status)}`}>
                          {getStatusText(premio.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
