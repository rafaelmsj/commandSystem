export interface Cliente {
  id: number;
  name: string;
  number: string;
  endereco: string;
  createdAt: string;
}

export interface Produto {
  id: number;
  nome: string;
  valorPadrao: number;
  estoque_atual: number;
  estoque_minimo: number;
  createdAt: string;
}

export interface Comanda {
  id: number;
  clienteId: number;
  cliente: string;
  status: 'Aberta' | 'Fechada';
  valorTotal: number;
  valorPago: number;
  saldoRestante: number;
  createdAt: string;
  updatedAt: string;
}

export interface LancamentoProduto {
  id: number;
  comandaId: number;
  produtoId: number;
  produto?: Produto;
  valorLancado: number;
  quantidade: number;
  createdAt: string;
  clienteId: number
}

export interface Pagamento {
  id: number;
  comandaId: number;
  valor: number;
  metodoPagamento: string;
  createdAt: string;
}

export interface ProdutoMaisVendido {
  nome: string;
  totalVendido: string;
}

export interface PremiosAEntregar {
  nome_produto: string;
  quantidade: number;
  estoque_atual: number;
}

export interface DashboardData {
  produtosMaisVendidos: ProdutoMaisVendido[];
  comandasRecentes: Comanda[];
  PremiosAEntregar: PremiosAEntregar[];
  totalAberto: number;
  totalPago: number;
  quantidadeComandas: number;
  comandasAbertas: number;
  comandasFechadas: number;
}

export interface Rifa {
  id: string;
  name: string;
  description: string | null;
  numberOfWinners: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RifaInsert {
  id?: string;
  name: string;
  description?: string | null;
  numberOfWinners?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RifaUpdate {
  id?: string;
  name?: string;
  description?: string | null;
  numberOfWinners?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RifaPrize {
  id: string;
  rifaId: string;
  position: number;
  productId: string; // Referencia o ID do Produto
  createdAt: string;
}

export interface RifaPrizeInsert {
  id?: string;
  rifaId: string;
  position: number;
  productId: string;
  createdAt?: string;
}

export interface RifaPrizeUpdate {
  id?: string;
  rifaId?: string;
  position?: number;
  productId?: string;
  createdAt?: string;
}

export interface RifaWinner {
  id: string;
  rifaId: string;
  position: number;
  customerId: string; // Referencia o ID do Cliente
  createdAt: string;
}

export interface RifaWinnerInsert {
  id?: string;
  rifaId: string;
  position: number;
  customerId: string;
  createdAt?: string;
}

export interface RifaWinnerUpdate {
  id?: string;
  rifaId?: string;
  position?: number;
  customerId?: string;
  createdAt?: string;
}

export interface Premio {
  id: string;
  colocacao_id: string;
  nome_produto: string;
  quantidade: number;
  status_entrega: 'pendente' | 'entregue';
  createdAt: string;
}

export interface Colocacao {
  id: string;
  rifa_id: string;
  posicao: number;
  ganhador_nome: string | null;
  ganhador_id: string | null;
  premios: Premio[];
  createdAt: string;
}

export interface RifaCompleta {
  id: string;
  nome: string;
  data: string;
  quantidade_ganhadores: number;
  status: 'em_andamento' | 'finalizada';
  created_at: string;
  colocacoes: Colocacao[];
}

export interface PremioCliente {
  premio_id: string;
  rifa_nome: string;
  rifa_data: string;
  posicao: number;
  nome_produto: string;
  produto_id: number;
  quantidade: number;
  colocacao_id: number;
  status_entrega: 'pendente' | 'entregue';
  ganhador_nome: string | null;
  ganhador_id: number;
}
