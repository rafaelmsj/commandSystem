import db from '../database/database.js'

class DashboardService {
  async getData() {
    try {
      // Total em aberto (comandas abertas)
      const [totalAberto] = await db.execute(`
        SELECT COALESCE(SUM(SaldoRestante), 0) as total 
        FROM comanda
        WHERE status = 'Aberta'
      `);

      // Total pago (todas as comandas)
      const [totalPago] = await db.execute(`
        SELECT COALESCE(SUM(valorPago), 0) as total 
        FROM comanda
      `);

      // Quantidade total de comandas
      const [quantidadeComandas] = await db.execute(`
        SELECT COUNT(*) as total 
        FROM comanda
      `);

      // Comandas abertas
      const [comandasAbertas] = await db.execute(`
        SELECT COUNT(*) as total 
        FROM comanda 
        WHERE status = 'Aberta'
      `);

      // Comandas fechadas
      const [comandasFechadas] = await db.execute(`
        SELECT COUNT(*) as total 
        FROM comanda 
        WHERE status = 'Fechada'
      `);

      return {
        totalAberto: parseFloat(totalAberto[0].total) || 0,
        totalPago: parseFloat(totalPago[0].total) || 0,
        quantidadeComandas: parseInt(quantidadeComandas[0].total) || 0,
        comandasAbertas: parseInt(comandasAbertas[0].total) || 0,
        comandasFechadas: parseInt(comandasFechadas[0].total) || 0
      };
    } catch (error) {
      throw new Error(`Erro ao buscar dados do dashboard: ${error.message}`);
    }
  }

  async getComandas() {
    try {
      const [rows] = await db.execute(`
        SELECT 
          c.id,
          cl.name as clienteNome,
          c.saldoRestante as valorTotal,
          c.status,
          c.createdAt as createdAt
        FROM comanda c
        LEFT JOIN client cl ON c.clienteId = cl.id
        WHERE status = 'Aberta'
        ORDER BY c.createdAt ASC
      `);

      return rows;
    } catch (error) {
      throw new Error(`Erro ao buscar comandas recentes: ${error.message}`);
    }
  }

  async getProdutosMaisVendidos() {
    try {
      const [rows] = await db.execute(`
        SELECT 
          p.nome,
          SUM(lp.quantidade) as totalVendido
        FROM lancamentos_produtos lp
        LEFT JOIN produto p ON lp.produto_id = p.id
        GROUP BY p.id, p.nome
        ORDER BY totalVendido DESC
        LIMIT 10
      `);

      return rows;
    } catch (error) {
      throw new Error(`Erro ao buscar produtos mais vendidos: ${error.message}`);
    }
  }

  async BuscaRegistrosCaixa(dataInicio, dataFim, tipo, forma_pagamento, page = 1, limit = 10) {
    try {
      let whereLavacao = 'WHERE pago = 1';
      let whereConveniencia = 'WHERE 1=1';
      const params = [];

      // ====== FILTROS OPCIONAIS ======
      if (dataInicio) {
        whereLavacao += ' AND DATE(modified) >= ?';
        whereConveniencia += ' AND DATE(created_at) >= ?';
        params.push(dataInicio, dataInicio);
      }

      if (dataFim) {
        whereLavacao += ' AND DATE(modified) <= ?';
        whereConveniencia += ' AND DATE(created_at) <= ?';
        params.push(dataFim, dataFim);
      }

      if (tipo && tipo !== 'Todos') {
        if (tipo === 'Lavação') {
          whereConveniencia += ' AND 1=0';
        } else if (tipo === 'Conveniência') {
          whereLavacao += ' AND 1=0';
        }
      }

      if (forma_pagamento && forma_pagamento !== 'Todos') {
        whereLavacao += ' AND forma_pagamento = ?';
        whereConveniencia += ' AND metodo_pagamento = ?';
        params.push(forma_pagamento, forma_pagamento);
      }

      // ====== QUERY BASE ======
      const baseQuery = `
      SELECT 
          valor, 
          forma_pagamento, 
          'Lavação' AS tipo, 
          DATE_FORMAT(modified, '%d/%m/%Y %H:%i:%s') AS data, 
          CONCAT('Pagamento via ', forma_pagamento, ' lavação ', tipo, ' ', IFNULL(carro, '')) AS text 
      FROM lavacoes 
      ${whereLavacao}

      UNION ALL

      SELECT 
          valor, 
          metodo_pagamento AS forma_pagamento, 
          'Conveniência' AS tipo, 
          DATE_FORMAT(created_at, '%d/%m/%Y %H:%i:%s') AS data, 
          CONCAT('Pagamento via ', metodo_pagamento, ' comanda ', com.cliente) AS text 
      FROM pagamentos pag 
      LEFT JOIN comanda com ON pag.comanda_id = com.id
      ${whereConveniencia}
    `;

      // ====== TOTAL DE REGISTROS ======
      const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as totalTable`;
      const [countRows] = await db.execute(countQuery, params);
      const total = countRows[0]?.total || 0;

      // ====== TOTAL FINANCEIRO (sem LIMIT) ======
      const totalQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN LOWER(forma_pagamento) LIKE '%pix%' THEN valor END), 0) AS totalPix,
        COALESCE(SUM(CASE WHEN LOWER(forma_pagamento) LIKE '%crédito%' THEN valor END), 0) AS totalCredito,
        COALESCE(SUM(CASE WHEN LOWER(forma_pagamento) LIKE '%débito%' THEN valor END), 0) AS totalDebito,
        COALESCE(SUM(CASE WHEN LOWER(forma_pagamento) LIKE '%dinheiro%' THEN valor END), 0) AS totalDinheiro,
        COALESCE(SUM(valor), 0) AS totalGeral
      FROM (${baseQuery}) as totalsTable;
    `;
      const [totalRows] = await db.execute(totalQuery, params);
      const totais = totalRows[0];

      // ====== PAGINAÇÃO (LIMIT/OFFSET) ======
      const offset = (page - 1) * limit;
      const paginatedQuery = `
      SELECT * FROM (
        ${baseQuery}
      ) AS finalTable
      ORDER BY data DESC
      LIMIT ? OFFSET ?
    `;
      const [rows] = await db.execute(paginatedQuery, [...params, limit, offset]);

      return { registros: rows, pagination: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit }, totais };
    } catch (error) {
      throw new Error(`Erro ao buscar registros do caixa: ${error.message}`);
    }
  }


}

export default new DashboardService();