import PagamentoService from '../services/PagamentoService.js'

class PagamentoController {
  async getByComanda(req, res) {
    try {
      const { comandaId } = req.params;

      const pagamentos = await PagamentoService.getByComanda(parseInt(comandaId));
      res.json(pagamentos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const { comandaId, valor, metodoPagamento } = req.body;

      if (!metodoPagamento) return res.status(400).json({ message: 'Selecione o método de pagamento.' });

      if (!comandaId || valor === undefined || !metodoPagamento) return res.status(400).json({ message: 'Preencha todos os campos.' });

      if (valor <= 0) return res.status(400).json({ message: 'Valor deve ser maior que zero' });

      const pagamento = await PagamentoService.create({ comandaId, valor, metodoPagamento });
      if (!pagamento) return res.status(400).json({ message: 'pagamento' });

      res.status(201).json(pagamento);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await PagamentoService.delete(parseInt(id));
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

export default new PagamentoController();