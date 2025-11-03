import { supabase, Rifa, Colocacao, Premio, RifaCompleta, PremioCliente } from '../lib/supabase';

export const rifaService = {
  async listarRifas(filtros?: { data?: string; ganhador?: string; status?: string }) {
    let query = supabase
      .from('rifas')
      .select(`
        *,
        colocacoes (
          id,
          posicao,
          ganhador_nome,
          ganhador_id,
          premios (*)
        )
      `)
      .order('data', { ascending: false });

    if (filtros?.data) {
      query = query.eq('data', filtros.data);
    }

    if (filtros?.status) {
      query = query.eq('status', filtros.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    let rifas = data as RifaCompleta[];

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
    const { data, error } = await supabase
      .from('rifas')
      .select(`
        *,
        colocacoes (
          *,
          premios (*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    const rifaCompleta = data as RifaCompleta;
    rifaCompleta.colocacoes.sort((a, b) => a.posicao - b.posicao);

    return rifaCompleta;
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
    const { data: rifa, error: rifaError } = await supabase
      .from('rifas')
      .insert({
        nome: dados.nome,
        data: dados.data,
        quantidade_ganhadores: dados.quantidade_ganhadores,
        status: 'em_andamento'
      })
      .select()
      .single();

    if (rifaError) throw rifaError;

    for (const col of dados.colocacoes) {
      const { data: colocacao, error: colocacaoError } = await supabase
        .from('colocacoes')
        .insert({
          rifa_id: rifa.id,
          posicao: col.posicao
        })
        .select()
        .single();

      if (colocacaoError) throw colocacaoError;

      if (col.premios.length > 0) {
        const premios = col.premios.map(p => ({
          colocacao_id: colocacao.id,
          nome_produto: p.nome_produto,
          quantidade: p.quantidade,
          status_entrega: 'pendente' as const
        }));

        const { error: premiosError } = await supabase
          .from('premios')
          .insert(premios);

        if (premiosError) throw premiosError;
      }
    }

    return rifa;
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
    const { data, error } = await supabase
      .from('rifas')
      .update(dados)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async atualizarGanhador(colocacaoId: string, ganhadorNome: string, ganhadorId?: string) {
    const { data, error } = await supabase
      .from('colocacoes')
      .update({
        ganhador_nome: ganhadorNome,
        ganhador_id: ganhadorId || null
      })
      .eq('id', colocacaoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async adicionarPremio(colocacaoId: string, premio: { nome_produto: string; quantidade: number }) {
    const { data, error } = await supabase
      .from('premios')
      .insert({
        colocacao_id: colocacaoId,
        nome_produto: premio.nome_produto,
        quantidade: premio.quantidade,
        status_entrega: 'pendente'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async atualizarPremio(
    id: string,
    dados: {
      nome_produto?: string;
      quantidade?: number;
      status_entrega?: 'pendente' | 'entregue';
    }
  ) {
    const { data, error } = await supabase
      .from('premios')
      .update(dados)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removerPremio(id: string) {
    const { error } = await supabase
      .from('premios')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async marcarPremioComoEntregue(premioId: string) {
    return this.atualizarPremio(premioId, { status_entrega: 'entregue' });
  },

  async marcarTodosPremiosColocacaoComoEntregue(colocacaoId: string) {
    const { error } = await supabase
      .from('premios')
      .update({ status_entrega: 'entregue' })
      .eq('colocacao_id', colocacaoId);

    if (error) throw error;
  },

  async buscarPremiosCliente(ganhadorId: string): Promise<PremioCliente[]> {
    const { data, error } = await supabase
      .from('colocacoes')
      .select(`
        id,
        posicao,
        ganhador_nome,
        ganhador_id,
        premios (*),
        rifas:rifa_id (
          nome,
          data
        )
      `)
      .eq('ganhador_id', ganhadorId);

    if (error) throw error;

    const premiosCliente: PremioCliente[] = [];

    data.forEach((colocacao: any) => {
      colocacao.premios.forEach((premio: Premio) => {
        premiosCliente.push({
          premio_id: premio.id,
          rifa_nome: colocacao.rifas.nome,
          rifa_data: colocacao.rifas.data,
          posicao: colocacao.posicao,
          nome_produto: premio.nome_produto,
          quantidade: premio.quantidade,
          status_entrega: premio.status_entrega,
          ganhador_nome: colocacao.ganhador_nome
        });
      });
    });

    return premiosCliente.sort((a, b) =>
      new Date(b.rifa_data).getTime() - new Date(a.rifa_data).getTime()
    );
  },

  async buscarPremiosPorNome(ganhadorNome: string): Promise<PremioCliente[]> {
    const { data, error } = await supabase
      .from('colocacoes')
      .select(`
        id,
        posicao,
        ganhador_nome,
        ganhador_id,
        premios (*),
        rifas:rifa_id (
          nome,
          data
        )
      `)
      .ilike('ganhador_nome', `%${ganhadorNome}%`);

    if (error) throw error;

    const premiosCliente: PremioCliente[] = [];

    data.forEach((colocacao: any) => {
      if (colocacao.premios && colocacao.premios.length > 0) {
        colocacao.premios.forEach((premio: Premio) => {
          premiosCliente.push({
            premio_id: premio.id,
            rifa_nome: colocacao.rifas.nome,
            rifa_data: colocacao.rifas.data,
            posicao: colocacao.posicao,
            nome_produto: premio.nome_produto,
            quantidade: premio.quantidade,
            status_entrega: premio.status_entrega,
            ganhador_nome: colocacao.ganhador_nome
          });
        });
      }
    });

    return premiosCliente.sort((a, b) =>
      new Date(b.rifa_data).getTime() - new Date(a.rifa_data).getTime()
    );
  },

  async deletarRifa(id: string) {
    const { error } = await supabase
      .from('rifas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
