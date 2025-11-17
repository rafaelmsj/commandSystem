import db from '../database/database.js';

class RifaService {

  async CreateRifa(quantidade_ganhadores, nome, data, status) {

    const sql = 'INSERT INTO rifas(quantidade_ganhadores, nome, data, status) VALUES(?,?,?,?);';
    const dataRifa = [quantidade_ganhadores, nome, data, 'em_andamento'];
    try {
      const [rows] = await db.query(sql, dataRifa);
      return { success: true, result: rows };
    } catch (error) {
      console.error('Erro ao criar rifa:', error);
      return { success: false, message: 'Erro ao criar rifa no banco de dados.' };
    }
  }

  async CreateColocacao(rifaId, posicao) {

    const sql = 'INSERT INTO colocacoes (rifa_id, posicao) VALUES(?,?);';
    const dataColocacao = [rifaId, posicao];
    try {
      const [rows] = await db.query(sql, dataColocacao);
      return { success: true, result: rows };
    } catch (error) {
      console.error('Erro ao criar colocação:', error);
      return { success: false, message: 'Erro ao criar colocação no banco de dados.' };
    }
  }

  async CreatePremio(colocacaoId, produto_id, quantidade) {

    const sql = 'INSERT INTO premios(colocacao_id, produto_id, quantidade) VALUES(?,?,?);';
    const dataPremio = [colocacaoId, produto_id, quantidade];
    try {
      const [rows] = await db.query(sql, dataPremio);
      return { success: true, result: rows };
    } catch (error) {
      console.error('Erro ao criar prêmio:', error);
      return { success: false, message: 'Erro ao criar prêmio no banco de dados.' };
    }
  }


	async GetAll({ filters = {}, page = 1, limit = 9 }) {
  try {
    const conditions = [];
    const params = [];

    if (filters.status) {
      conditions.push("LOWER(TRIM(r.status)) = LOWER(TRIM(?))");
      params.push(filters.status);
    }

    if (filters.data) {
      conditions.push("DATE(r.data) = ?");
      params.push(filters.data);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // 1️⃣ TOTAL DE RIFAS (SEM LIMITAR)
    const [countResult] = await db.query(`
      SELECT COUNT(DISTINCT r.id) AS total
      FROM rifas r
      LEFT JOIN colocacoes c ON c.rifa_id = r.id
      LEFT JOIN premios p ON p.colocacao_id = c.id
      ${whereClause};
    `, params);

    const total = countResult[0]?.total || 0;

    // 2️⃣ BUSCAR APENAS OS IDs DAS RIFAS DA PÁGINA (PAGINAÇÃO REAL)
    const [rifaIdsRows] = await db.query(`
      SELECT r.id
      FROM rifas r
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?;
    `, [...params, limit, (page - 1) * limit]);

    const rifaIds = rifaIdsRows.map(r => r.id);

    if (rifaIds.length === 0) {
      return {
        success: true,
        rifas: [],
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          page: Number(page)
        }
      };
    }

    // 3️⃣ BUSCA COMPLETA DAS RIFAS (SEM LIMIT DE LINHA)
    const [rows] = await db.query(`
      SELECT
        r.id AS rifa_id,
        r.nome AS rifa_nome,
        r.data AS rifa_data,
        r.status AS rifa_status,
        r.quantidade_ganhadores,
        r.created_at AS rifa_createdAt,

        c.id AS colocacao_id,
        c.posicao,
        c.ganhador_nome,
        c.created_at AS colocacao_createdAt,

        p.id AS premio_id,
        p.produto_id,
        p.quantidade,
        p.status_entrega,
        p.created_at AS premio_createdAt

      FROM rifas r
      LEFT JOIN colocacoes c ON c.rifa_id = r.id
      LEFT JOIN premios p ON p.colocacao_id = c.id
      WHERE r.id IN (?)
      ORDER BY r.created_at DESC, c.posicao ASC;
    `, [rifaIds]);

    // 4️⃣ MONTAR ESTRUTURA FINAL
    const rifasMap = new Map();

    for (const row of rows) {
      const rifaId = row.rifa_id;

      if (!rifasMap.has(rifaId)) {
        rifasMap.set(rifaId, {
          id: rifaId,
          nome: row.rifa_nome,
          data: row.rifa_data,
          status: row.rifa_status,
          quantidade_ganhadores: row.quantidade_ganhadores,
          createdAt: row.rifa_createdAt,
          colocacoes: []
        });
      }

      const rifa = rifasMap.get(rifaId);

      if (row.colocacao_id) {
        let colocacao = rifa.colocacoes.find(c => c.id === row.colocacao_id);

        if (!colocacao) {
          colocacao = {
            id: row.colocacao_id,
            rifa_id: rifaId,
            posicao: row.posicao,
            ganhador_nome: row.ganhador_nome,
            createdAt: row.colocacao_createdAt,
            premios: []
          };
          rifa.colocacoes.push(colocacao);
        }

        if (row.premio_id) {
          colocacao.premios.push({
            id: row.premio_id,
            colocacao_id: row.colocacao_id,
            nome_produto: row.nome_produto,
            quantidade: row.quantidade,
            status_entrega: row.status_entrega,
            createdAt: row.premio_createdAt
          });
        }
      }
    }

    return {
      success: true,
      rifas: Array.from(rifasMap.values()),
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        page: Number(page)
      }
    };

  } catch (error) {
    console.error('Erro em RifaService.GetAll:', error);
    throw error;
  }
}


  async GetById(id) {
    try {
      const sql = `
      SELECT
        r.id AS rifa_id,
        r.nome AS rifa_nome,
        r.quantidade_ganhadores,
        r.data AS rifa_data,
        r.status AS rifa_status,
        r.created_at AS rifa_created_at,

        c.id AS colocacao_id,
        c.posicao,
        c.ganhador_nome,
        c.ganhador_id,
        c.created_at AS colocacao_created_at,

        p.id AS premio_id,
        pro.nome,
        p.quantidade,
        p.status_entrega,
        p.created_at AS premio_created_at,
        p.updated_at AS premio_updated_at

      FROM rifas r
      LEFT JOIN colocacoes c ON r.id = c.rifa_id
      LEFT JOIN premios p ON c.id = p.colocacao_id
      LEFT JOIN produto pro ON p.produto_id = pro.id
      WHERE r.id = ?
    `;

      const [rows] = await db.query(sql, [id]);

      if (rows.length === 0) {
        return { success: false, message: 'Rifa não encontrada.' };
      }

      const rifaMap = new Map();

      for (const row of rows) {
        if (!rifaMap.has(row.rifa_id)) {
          rifaMap.set(row.rifa_id, {
            id: row.rifa_id,
            nome: row.rifa_nome,
            data: row.rifa_data,
            quantidade_ganhadores: row.quantidade_ganhadores,
            status: row.rifa_status,
            created_at: row.rifa_created_at,
            colocacoes: []
          });
        }

        const rifa = rifaMap.get(row.rifa_id);

        if (row.colocacao_id && !rifa.colocacoes.some(c => c.id === row.colocacao_id)) {
          rifa.colocacoes.push({
            id: row.colocacao_id,
            posicao: row.posicao,
            ganhador_nome: row.ganhador_nome,
            ganhador_id: row.ganhador_id,
            created_at: row.colocacao_created_at,
            premios: []
          });
        }

        if (row.premio_id) {
          const colocacao = rifa.colocacoes.find(c => c.id === row.colocacao_id);
          if (colocacao && !colocacao.premios.some(p => p.id === row.premio_id)) {
            colocacao.premios.push({
              id: row.premio_id,
              nome_produto: row.nome,
              quantidade: row.quantidade,
              status_entrega: row.status_entrega,
              created_at: row.premio_created_at,
              updated_at: row.premio_updated_at
            });
          }
        }
      }

      return { success: true, rifa: rifaMap.values().next().value };

    } catch (error) {
      console.error('Erro ao buscar rifa por ID:', error);
      return { success: false, message: 'Erro ao buscar rifa no banco de dados.' };
    }
  }

  async DefinirGanhador(id_colocacao, ganhadorNome, ganhadorId) {
    const sql = 'UPDATE colocacoes SET ganhador_nome = ?, ganhador_id = ? WHERE id = ?;';
    const dataRifa = [ganhadorNome, ganhadorId, id_colocacao];
    try {
      await db.query(sql, dataRifa);

      return { success: true };

    } catch (error) {
      console.error('Erro ao criar rifa:', error);
      return { success: false, message: 'Erro ao definir ganhadores no banco de dados.' };
    }
  }

  async MudarStatusRifa(status, rifa_id) {

    const sql = 'UPDATE rifas SET status = ? WHERE id = ?;';
    const dataRifa = [status, rifa_id];
    try {
      const [rows] = await db.query(sql, dataRifa);
      return { success: true };
    } catch (error) {
      console.error('Erro ao criar rifa:', error);
      return { success: false, message: 'Erro ao criar rifa no banco de dados.' };
    }
  }

  async MudarStatusPremio(status, premio_id) {

    const sql = 'UPDATE premios SET status_entrega = ? WHERE id = ?;';
    const dataRifa = [status, premio_id];
    try {
      const [rows] = await db.query(sql, dataRifa);
      return { success: true };
    } catch (error) {
      console.error('Erro ao marcar como entregue:', error);
      return { success: false, message: 'Erro ao marcar como entregue.' };
    }
  }

  async AlterarPremio(produto_id, quantidade, premio_id) {

    const sql = 'UPDATE premios SET produto_id = ?, quantidade = ? WHERE id = ?;';
    const dataRifa = [produto_id, quantidade, premio_id];
    try {
      const [rows] = await db.query(sql, dataRifa);
      return { success: true };
    } catch (error) {
      console.error('Erro ao alterar produto do prêmio:', error);
      return { success: false, message: 'Erro ao alterar produto do prêmio.' };
    }
  }

  async CriarPremio(produto_id, quantidade, colocacao_id) {

    const sql = 'INSERT INTO premios(colocacao_id, produto_id, quantidade, status_entrega) VALUES(?,?,?,?);';
    const dataRifa = [colocacao_id, produto_id, quantidade, 'pendente'];
    try {
      const [rows] = await db.query(sql, dataRifa);
      return { success: true };
    } catch (error) {
      console.error('Erro ao criar novo produto do prêmio:', error);
      return { success: false, message: 'Erro ao criar novo produto do prêmio.' };
    }
  }

  async DeletarRifa(rifa_id) {

    const sql = 'DELETE FROM rifas WHERE id = ?;';
    const dataRifa = [rifa_id];
    try {
      const [rows] = await db.query(sql, dataRifa);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar rifa:', error);
      return { success: false, message: 'Erro ao deletar rifa no banco de dados.' };
    }
  }

  async DeletarPremio(premio_id) {

    const sql = 'DELETE FROM premios WHERE id = ?;';
    const dataRifa = [premio_id];
    try {
      const [rows] = await db.query(sql, dataRifa);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar premio:', error);
      return { success: false, message: 'Erro ao deletar premio no banco de dados.' };
    }
  }

  async BuscaPremiosGanhador(nome, filtro) {
    try {
      const sql = `
      SELECT
        pre.id AS premio_id,
        pre.produto_id,
        pre.quantidade,
        pre.status_entrega,
        rif.nome AS rifa_nome,
        rif.data AS rifa_data,
        col.posicao,
        col.ganhador_nome,
        col.ganhador_id,
        col.id AS colocacao_id,
        pro.nome AS nome_produto
      FROM premios pre
      LEFT JOIN colocacoes col ON col.id = pre.colocacao_id
      LEFT JOIN rifas rif ON rif.id = col.rifa_id
      LEFT JOIN produto pro ON pro.id = pre.produto_id
      LEFT JOIN client cli ON col.ganhador_id = cli.id
      WHERE 
  (col.ganhador_nome LIKE ? OR cli.number LIKE ?)
  AND rif.status = 'finalizada'
  AND pre.status_entrega LIKE ?
    `;

      const search = `%${nome}%`;
      const dataRifa = [search, search, filtro];

      const [rows] = await db.query(sql, dataRifa);

      return { success: true, message: 'Exibindo lista de prêmios.', result: rows };
    } catch (err) {
      console.error({ success: false, message: 'Erro ao buscar prêmios.', method: 'RifaService / BuscaPremiosGanhador()', error: err });
      return { success: false, message: 'Erro ao buscar prêmios.', error: err.message };
    }
  }

}


export default new RifaService();
