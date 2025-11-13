export interface Premio {
  id: number;
  nome: string;
  produto: string;
  quantidade: number;
  posicao: string;
  nomeRifa: string;
  data: string;
  status: 'pendente' | 'entregue';
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function buscarPremios(celular: string): Promise<Premio[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/premios/cliente?nome=${encodeURIComponent(celular)}&filtro=pendente`);

    if (!response.ok) {
      throw new Error('Erro ao buscar prêmios');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
}
