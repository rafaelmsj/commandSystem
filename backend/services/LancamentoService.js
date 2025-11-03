import db from '../database/database.js';
import ComandaService from './ComandaService.js';
import EstoqueService from './EstoqueService.js';

class LancamentoService {
  async getByComanda(comandaId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          lp.id,
          lp.comanda_id as comandaId,
          lp.produto_id as produtoId,
          p.nome as produtoNome,
          lp.valor_lancado as valorLancado,
          lp.quantidade,
          lp.created_at as createdAt
        FROM lancamentos_produtos lp
        LEFT JOIN produto p ON lp.produto_id = p.id
        WHERE lp.comanda_id = ?
        ORDER BY lp.created_at DESC
      `, [comandaId]);

      return rows;
    } catch (error) {
      throw new Error(`Erro ao buscar lançamentos: ${error.message}`);
    }
  }
  async create(lancamentoData) {
    const { comandaId, produtoId, valorLancado, quantidade, clienteId } = lancamentoData;

    try {
      const baixaEstoque = await EstoqueService.DiminuirEstoque(produtoId, quantidade, 'conveniencia', clienteId, `Venda via comanda #${comandaId}`);
      if (!baixaEstoque.success) return { success: false, message: baixaEstoque.message };

      const [result] = await db.execute(
        "INSERT INTO lancamentos_produtos (comanda_id, produto_id, valor_lancado, quantidade) VALUES (?, ?, ?, ?)",
        [comandaId, produtoId, valorLancado, quantidade]
      );


      await ComandaService.recalcularTotais(comandaId);

      const [rows] = await db.execute(`
        SELECT 
          lp.id,
          lp.comanda_id as comandaId,
          lp.produto_id as produtoId,
          p.nome as produtoNome,
          lp.valor_lancado as valorLancado,
          lp.quantidade,
          lp.created_at as createdAt
        FROM lancamentos_produtos lp
        LEFT JOIN produto p ON lp.produto_id = p.id
        WHERE lp.id = ?
      `, [result.insertId]);

      return rows[0];
    } catch (error) {
      console.log(error)
      throw new Error(`Erro ao criar lançamento: ${error.message}`);

    }
  }

  async delete(id) {
    try {
      const [lancamento] = await db.execute(
        `SELECT 
          lp.comanda_id, 
          lp.produto_id, 
          lp.quantidade, 
          c.clienteId
        FROM lancamentos_produtos AS lp
        LEFT JOIN comanda AS c ON lp.comanda_id = c.id
        WHERE lp.id = ?`,
        [id]
      );


      if (lancamento.length === 0) {
        throw new Error('Lançamento não encontrado');
      }

      const { comanda_id, produto_id, quantidade, clienteId } = lancamento[0];

      const [result] = await db.execute(
        `DELETE FROM lancamentos_produtos WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) throw new Error('Lançamento não encontrado');

      await EstoqueService.AumentarEstoque(produto_id, quantidade, 'conveniencia', clienteId, `Exclusão de lançamento da comanda #${comanda_id}`);

      await ComandaService.recalcularTotais(comanda_id);

      return { message: 'Lançamento excluído com sucesso e estoque devolvido.' };
    } catch (error) {
      throw new Error(`Erro ao excluir lançamento: ${error.message}`);
    }
  }
}

export default new LancamentoService();
