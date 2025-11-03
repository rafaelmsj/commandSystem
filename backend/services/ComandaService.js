import db from '../database/database.js';

class ComandaService {

  async CreateComanda(clienteId, cliente) {
    try {

      await db.execute(`INSERT INTO comanda (clienteId, cliente, status, valorTotal, valorPago, saldoRestante) VALUES (?, ?, ?, ?, ?, ?)`,
        [clienteId, cliente, 'Aberta', 0, 0, 0]
      )

      return { success: true, message: 'Comanda inserida no banco de dados.' }
    }
    catch (err) {
      console.log({ success: false, error: err, method: 'ComandaService / CreateComanda()' })
      return { success: false, message: 'Erro ao cadastrar abrir a comanda.' }
    }
  }

  async UpdateProduto(nome, valorPadrao, id_produto) {
    try {
      const nameOk = await this.FirstLetterUpper(nome.toLowerCase().trim())

      await db.execute(`UPDATE produto SET nome = ?, valorPadrao = ? WHERE id = ?`,
        [nameOk, valorPadrao, id_produto]
      )

      return { success: true, message: 'Produto alterado com sucesso.' }
    }
    catch (err) {
      console.log({ success: false, error: err, method: 'ComandaService / UpdateProduto()' })
      return { success: false, message: 'Erro ao alterar o produto.' }
    }
  }

  async FindName(nome) {
    try {
      const result = await db.execute(`SELECT * FROM produto WHERE nome = ?`,
        [nome])

      if (result[0][0] == undefined) return { success: false, message: 'Produto não encontrado.' }

      return { success: true, message: 'Produto encontrado.', product: result[0][0] }
    }
    catch (err) {
      console.log({ success: false, error: err, method: 'ComandaService / FindName()' })
      return { success: false, message: 'Erro ao buscar esse produto.' }
    }
  }

  async GetAll(filters = {}) {
    try {
      const { clienteId, dataInicio, dataFim } = filters;

      let status = filters.status || 'Aberta'
      if (status == 'todos') status = ''

      let baseQuery = `
        SELECT 
          c.id, c.status, c.createdAt, c.updatedAt,
          c.valorTotal, c.valorPago, c.saldoRestante,
          c.clienteId, cl.name as clienteNome 
        FROM comanda c
        JOIN client cl ON c.clienteId = cl.id
      `;

      const whereClauses = [];
      const queryParams = [];

      if (clienteId) {
        whereClauses.push(`c.clienteId = ?`);
        queryParams.push(clienteId);
      }
      if (status) {
        whereClauses.push(`c.status = ?`);
        queryParams.push(status);
      }
      if (dataInicio) {
        whereClauses.push(`c.createdAt >= ?`);
        queryParams.push(`${dataInicio} 00:00:00`);
      }
      if (dataFim) {
        whereClauses.push(`c.createdAt <= ?`);
        queryParams.push(`${dataFim} 23:59:59`);
      }

      if (whereClauses.length > 0) {
        baseQuery += ` WHERE ` + whereClauses.join(` AND `);
      }

      baseQuery += ` ORDER BY cl.name ASC`;

      const [result] = await db.execute(baseQuery, queryParams);

      return { success: true, message: 'Lista de Comandas.', comandas: result };
    } catch (err) {
      console.log({ success: false, error: err, method: 'ComandaService / GetAll()' });
      return { success: false, message: 'Erro ao buscar comandas.' };
    }
  }

  async GetById(id) {
    try {
      const result = await db.execute(`SELECT 
          c.id,
          c.clienteId as clienteId,
          cl.name as cliente,
          c.status,
          c.valorTotal as valorTotal,
          c.valorPago as valorPago,
          c.saldoRestante as saldoRestante,
          c.createdAt as createdAt,
          c.updatedAt as updatedAt
        FROM comanda c
        LEFT JOIN client cl ON c.clienteId = cl.id
        WHERE c.id = ?
      `, [id])

      return { success: true, message: 'Lista de Comandas.', comandas: result[0][0] }
    }
    catch (err) {
      console.log({ success: false, error: err, method: 'ComandaService / GetById()' })
      return { success: false, message: 'Erro ao buscar produtos.' }
    }
  }

  async FirstLetterUpper(str) {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async recalcularTotais(comandaId) {
    try {
      const [lancamentos] = await db.execute(
        `SELECT COALESCE(SUM(valor_lancado * quantidade), 0) as total FROM lancamentos_produtos WHERE comanda_id = ?`,
        [comandaId]
      );

      const [pagamentos] = await db.execute(
        `SELECT COALESCE(SUM(valor), 0) as total FROM pagamentos WHERE comanda_id = ?`,
        [comandaId]
      );

      const valorTotal = parseFloat(lancamentos[0].total) || 0;
      const valorPago = parseFloat(pagamentos[0].total) || 0;
       const saldoRestante = Math.max(valorTotal - valorPago, 0);

      await db.execute(
        `UPDATE comanda SET valorTotal = ?, valorPago = ?, saldoRestante = ? WHERE id = ?`,
        [valorTotal, valorPago, saldoRestante, comandaId]
      );

      return { valorTotal, valorPago, saldoRestante };
    } catch (error) {
      throw new Error(`Erro ao recalcular totais: ${error.message}`);
    }
  }

  async fechar(id) {
    try {
      const [result] = await db.execute(
        `UPDATE comanda SET status = "Fechada" WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Comanda não encontrada');
      }

      return await this.GetById(id);
    } catch (error) {
      throw new Error(`Erro ao fechar comanda: ${error.message}`);
    }
  }

  async VerificarSaldo(id) {
    try {
      const result = await db.execute(`SELECT * FROM comanda WHERE id = ?`,
        [id])

      if (result[0][0] == undefined) return { success: false, message: 'Comanda não encontrada.' }

      if (result[0][0] == undefined) return { success: false, message: 'Comanda não encontrada.' }

      return { success: true, message: 'Produto encontrado.', product: result[0][0] }
    }
    catch (err) {
      console.log({ success: false, error: err, method: 'ComandaService / VerificarSaldo()' })
      return { success: false, message: 'Erro ao buscar essa comanda.' }
    }

  }

}



export default new ComandaService();