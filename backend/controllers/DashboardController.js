import DashboardService from '../services/DashboardService.js';

class DashboardController {
  async getData(req, res) {
    try {
      const data = await DashboardService.getData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getComandas(req, res) {
    try {
      const comandas = await DashboardService.getComandas();
      res.json(comandas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProdutosMaisVendidos(req, res) {
    try {
      const produtos = await DashboardService.getProdutosMaisVendidos();
      res.json(produtos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async Caixa(req, res) {
    try {
      const { dataInicio, dataFim, tipo, forma_pagamento, page = 1, limit = 10 } = req.query;

      const result = await DashboardService.BuscaRegistrosCaixa(dataInicio, dataFim, tipo, forma_pagamento, parseInt(page), parseInt(limit));

      res.status(200).json({ success: true, message: 'Exibindo registros do caixa', result: result.registros, pagination: result.pagination, totais: result.totais });
    } catch (err) {
      console.error({ success: false, message: 'Erro ao buscar registros do caixa', method: 'DashboardController / Caixa()', error: err });
      res.status(500).json({ success: false, message: 'Erro ao buscar registros do caixa', error: err.message });
    }
  }

  async ExportarCaixa(req, res) {
    try {
      const { dataInicio, dataFim, tipo, forma_pagamento } = req.query;

      const result = await DashboardService.BuscaRegistrosCaixa(dataInicio, dataFim, tipo, forma_pagamento, 1, 999999);

      res.status(200).json({ success: true, message: 'Exportação de registros do caixa concluída', result: result.registros, });
    } catch (err) {
      console.error({ success: false, message: 'Erro ao exportar registros do caixa', method: 'DashboardController / ExportarCaixa()', error: err, });
      res.status(500).json({ success: false, message: 'Erro ao exportar registros do caixa', error: err.message, });
    }
  }


}

export default new DashboardController();