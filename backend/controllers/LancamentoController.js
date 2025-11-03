import LancamentoService from '../services/LancamentoService.js'

class LancamentoController {
  async getByComanda(req, res) {
    try {
      const { comandaId } = req.params;
      const lancamentos = await LancamentoService.getByComanda(parseInt(comandaId));
      res.json(lancamentos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const { comandaId, produtoId, valorLancado, quantidade, clienteId } = req.body;

      if (!comandaId || !produtoId || valorLancado === undefined || !quantidade) return res.status(400).json({ error: 'Comanda ID, produto ID, valor lançado e quantidade são obrigatórios' });

      if (valorLancado < 0) return res.status(400).json({ error: 'Valor lançado deve ser maior ou igual a zero' });

      if (quantidade <= 0) return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });

      const lancamento = await LancamentoService.create({ comandaId, produtoId, valorLancado, quantidade, clienteId });
      if (lancamento?.success === false) return res.status(400).json({ message: lancamento.message });

      res.status(201).json(lancamento);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await LancamentoService.delete(parseInt(id));
      res.json(result);
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
}

export default new LancamentoController();