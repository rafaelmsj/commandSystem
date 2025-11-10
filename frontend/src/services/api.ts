import axios from 'axios';
import { Cliente, Produto, Comanda, LancamentoProduto, Pagamento, DashboardData, ProdutoMaisVendido, RifaCompleta, Colocacao, Premio, PremioCliente, PremiosAEntregar } from '../types';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // ajuste se necessário
  withCredentials: false,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string | undefined = error?.config?.url;

    // Se for 401 e não for rota de auth
    if (status === 401 && url && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      // limpa storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // evita loop
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Clientes
export const clienteService = {
  getAll: (params?: { search?: string }) => api.get<Cliente[]>('/clientes', { params }),
  getById: (id: number) => api.get<Cliente>(`/cliente/${id}`),
  create: (cliente: Omit<Cliente, 'id' | 'createdAt'>) =>
    api.post<Cliente>('/cliente', cliente),
  update: (id: number, cliente: Partial<Cliente>) =>
    api.put<Cliente>(`/cliente/${id}`, cliente),
  delete: (id: number) => api.delete(`/clientes/${id}`),
};

// Produtos
export const produtoService = {
  getAll: (params?: { search?: string }) => api.get<Produto[]>('/produtos', { params }),
  getById: (id: number) => api.get<Produto>(`/produto/${id}`),
  create: (produto: Omit<Produto, 'id' | 'createdAt'>) =>
    api.post<Produto>('/produto', produto),
  update: (id: number, produto: Partial<Produto>) =>
    api.put<Produto>(`/produto/${id}`, produto),
  delete: (id: number) => api.delete(`/produtos/${id}`),
  listarEstoqueBaixo: () => api.get<Produto[]>('/produtos/estoque-baixo'),
  updateEstoque: (id: number, estoque: { estoque_atual: number; estoque_minimo: number }) =>
    api.put(`/produtos/${id}/estoque`, {
      estoque_atual: estoque.estoque_atual,
      estoque_minimo: estoque.estoque_minimo
    }),
};

// Comandas
export const comandaService = {
  getAll: (filters?: {
    clienteId?: number;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }) => api.get<{ success: boolean; message: string; result: Comanda[] }>('/comandas', { params: filters }),
  getById: (id: number) => api.get<Comanda>(`/comandas/${id}`),
  create: (comanda: { clienteId: number }) =>
    api.post<Comanda>('/comanda', comanda),
  fechar: (id: number) => api.patch<Comanda>(`/comandas/${id}/fechar`),
  delete: (id: number) => api.delete(`/comandas/${id}`),
};



// Lançamentos
export const lancamentoService = {
  getByComanda: (comandaId: number) =>
    api.get<LancamentoProduto[]>(`/comandas/${comandaId}/lancamentos`),
  create: (lancamento: {
    comandaId: number;
    produtoId: number;
    valorLancado: number;
    quantidade: number;
  }) => api.post<LancamentoProduto>('/lancamentos', lancamento),
  delete: (id: number) => api.delete(`/lancamentos/${id}`),
};

// Pagamentos
export const pagamentoService = {
  getByComanda: (comandaId: number) =>
    api.get<Pagamento[]>(`/comandas/${comandaId}/pagamentos`),
  create: (pagamento: { comandaId: number; valor: number }) =>
    api.post<Pagamento>('/pagamentos', pagamento),
  delete: (id: number) => api.delete(`/pagamentos/${id}`),
};

// Dashboard
export const dashboardService = {
  getData: () => api.get<DashboardData>('/dashboard'),

  getProdutosMaisVendidos: () => api.get<ProdutoMaisVendido[]>('/dashboard/produtos-mais-vendidos'),

  getComandasRecentes: () => api.get<Comanda[]>('/dashboard/comandas'),

  getPremiosAEntregar: () => api.get<PremiosAEntregar[]>('/premios-a-entregar'),
};

export interface SearchResult {
  id: number;
  nome: string;
  tipo: 'cliente' | 'produto' | 'comanda';
}


export default api;

// Rifas
export const rifaService = {
  async listarRifas(filtros?: { data?: string; ganhador?: string; status?: string }) {
    const { data } = await api.get<RifaCompleta[]>('/rifas', { params: filtros });

    let rifas = data.result;

    if (filtros?.ganhador && filtros.ganhador.trim()) {
      rifas = rifas.filter(rifa =>
        rifa.colocacoes.some(col =>
          col.ganhador_nome?.toLowerCase().includes(filtros.ganhador!.toLowerCase())
        )
      );
    }
    return rifas;
  },

  async obterRifa(id: string): Promise<RifaCompleta | null> {
    const { data } = await api.get<RifaCompleta>(`/rifas/${id}`);
    if (!data) return null;
    return data;
  },

  async criarRifa(dados: {
    nome: string;
    data: string;
    quantidade_ganhadores: number;
    colocacoes: {
      posicao: number;
      premios: { nome_produto: string; quantidade: number }[];
    }[];
  }) {
    const { data } = await api.post<RifaCompleta>('/rifas', dados);
    return data;
  },

  async atualizarRifa(
    id: string,
    dados: {
      nome?: string;
      data?: string;
      quantidade_ganhadores?: number;
      status?: 'em_andamento' | 'finalizada';
    }
  ) {
    const { data } = await api.put<RifaCompleta>(`/rifas/${id}`, { ...dados, id });
    return data;
  },

  atualizarPremio: async (premioId: string, body: { produto_id: string; quantidade: number }) => {
    const response = await api.put(`/premios/${premioId}`, body);
    return response.data;
  },

  deletarPremio: (premioId: string) => api.delete(`/premios/${premioId}`),

  async atualizarGanhador(colocacaoId: string, ganhadorNome: string, ganhadorId?: string) {
    const { data } = await api.put<Colocacao>(`/colocacoes/${colocacaoId}/ganhador`, { ganhador_nome: ganhadorNome, ganhador_id: ganhadorId });
    return data;
  },

  async adicionarPremio(colocacaoId: string, premio: { nome_produto: string; quantidade: number; rifa_id?: string }) {
    const { data } = await api.post<Premio>(`/colocacoes/${colocacaoId}/premios`, premio);
    return data;
  },

  async removerPremio(id: string) {
    await api.delete(`/premios/${id}`);
  },

  marcarPremioComoEntregue: async (premioId: string, body: any) => {
    const response = await api.put(`/premios/${premioId}/entregar`, body);
    return response.data;
  },

  async marcarTodosPremiosColocacaoComoEntregue(colocacaoId: string) {
    await api.patch(`/colocacoes/${colocacaoId}/premios/entregues`);
  },

  async buscarPremiosCliente(ganhadorId: string): Promise<PremioCliente[]> {
    const { data } = await api.get<PremioCliente[]>(`/clientes/${ganhadorId}/premios`);
    return data.sort((a, b) => new Date(b.rifa_data).getTime() - new Date(a.rifa_data).getTime());
  },

  buscarPremiosPorNome: async (nome: string, filtro: string) => {
    const response = await api.get(`/premios/cliente`, {
      params: { nome, filtro },
    });
    return response.data;
  },

  async deletarRifa(id: string) {
    await api.delete(`/rifas/${id}`);
  },

  async listarProdutos() {
    const response = await api.get('/produtos');
    return response.data;
  },

  async adicionarNovoPremio(colocacao_id: string, body: { produto_id: string; quantidade: number }) {
    return api.post(`/premio/${colocacao_id}/novo`, body);
  }

};

export const caixaService = {
  async getAll(query?: string) {
    const url = query ? `/caixa?${query}` : `/caixa`;
    const response = await api.get(url);
    return response;
  },
  exportar: (params?: string) => api.get(`/caixa/exportar?${params || ''}`),
};

export const lavacaoService = {
  getAbertas: () => api.get('/lavacoes/abertas'),
  getAntigas: () => api.get('/lavacoes/antigas'),
};

export const estoqueService = {
  getBaixo: () => api.get('/estoque/baixo'),
};
