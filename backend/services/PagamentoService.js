import db from '../database/database.js'
import ComandaService from './ComandaService.js';

class PagamentoService {
  async getByComanda(comandaId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          id,
          comanda_id as comandaId,
          valor,
          metodo_pagamento as metodoPagamento,
          created_at as createdAt
        FROM pagamentos
        WHERE comanda_id = ?
        ORDER BY created_at DESC
      `, [comandaId]);
      
      return rows;
    } catch (error) {
      throw new Error(`Erro ao buscar pagamentos: ${error.message}`);
    }
  }

  async create(pagamentoData) {
  const { comandaId, valor, metodoPagamento } = pagamentoData;

  try {
    // Buscar saldo atual
    const comanda = await ComandaService.GetById(comandaId);
    const saldoAtual = parseFloat(comanda.comandas.saldoRestante);

    if (saldoAtual <= 0) {
      throw new Error('Esta comanda já está quitada.');
    }

    if (valor > saldoAtual) {
      throw new Error(`O valor pago (${valor}) é maior que o saldo devedor (${saldoAtual.toFixed(2)}).`);
    }

    // Registrar o pagamento
    const [result] = await db.execute(
      `INSERT INTO pagamentos (comanda_id, valor, metodo_pagamento) VALUES (?, ?, ?)`,
      [comandaId, valor, metodoPagamento]
    );

    // Recalcular totais
    await ComandaService.recalcularTotais(comandaId);

    // Buscar pagamento criado
    const [rows] = await db.execute(`
      SELECT 
        id,
        comanda_id as comandaId,
        valor,
        metodo_pagamento as metodoPagamento,
        created_at as createdAt
      FROM pagamentos
      WHERE id = ?
    `, [result.insertId]);

    return rows[0];
  } catch (error) {
    throw new Error(`Erro ao criar pagamento: ${error.message}`);
  }
}


  async delete(id) {
    try {
      // Buscar o pagamento para obter o comandaId
      const [pagamento] = await db.execute(
        `SELECT comanda_id FROM pagamentos WHERE id = ?`,
        [id]
      );
      
      if (pagamento.length === 0) {
        throw new Error('Pagamento não encontrado');
      }
      
      const comandaId = pagamento[0].comanda_id;
      
      // Excluir o pagamento
      const [result] = await db.execute(
        `DELETE FROM pagamentos WHERE id = ?`,
        [id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Pagamento não encontrado');
      }
      
      // Recalcular totais da comanda
      await ComandaService.recalcularTotais(comandaId);
      
      return { message: 'Pagamento excluído com sucesso' };
    } catch (error) {
      throw new Error(`Erro ao excluir pagamento: ${error.message}`);
    }
  }
}

export default new PagamentoService();