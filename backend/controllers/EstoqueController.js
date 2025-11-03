import EstoqueService from '../services/EstoqueService.js';

class EstoqueController {
    async UpdateEstoque(req, res) {
        try {
            const { id } = req.params;
            const { estoque_atual, estoque_minimo } = req.body;

            if (estoque_atual < 0 || estoque_minimo < 0) return res.status(400).json({ error: 'Estoque não pode ser negativo.' });

            const updateEstoque = await EstoqueService.UpdateEstoque(estoque_atual, estoque_minimo, id);

            if (!updateEstoque.success) return res.status(400).json(updateEstoque);

            res.status(200).json({ success: true, message: updateEstoque.message });
        } catch (err) {
            console.log({ success: false, error: err, method: 'EstoqueController / UpdateEstoque()' });
            return res.status(500).json({ success: false, message: 'Erro ao atualizar estoque.', error: err.message });
        }
    }


    async EstoqueBaixo(req, res) {
        try {
            const produtosEstoqueBaixo = await EstoqueService.ProdutosEstoqueBaixo();
            res.status(200).json(produtosEstoqueBaixo.products);
        } catch (err) {
            console.log({ success: false, error: err, method: 'EstoqueController / EstoqueBaixo()' });
            return res.status(500).json({ success: false, message: 'Erro ao buscar produtos com estoque baixo.', error: err.message });
        }
    }

    async ListarMovimentacoes(req, res) {
        try {
            const filtros = req.query;
            const result = await EstoqueService.ListarMovimentacoes(filtros);

            if (!result.success) return res.status(400).json(result);

            res.status(200).json({ success: true, movimentacoes: result.movimentacoes, pagination: result.pagination });
        } catch (err) {
            console.log({ success: false, error: err, method: 'EstoqueController / ListarMovimentacoes()' });
            return res.status(500).json({ success: false, message: 'Erro ao listar movimentações.', error: err.message });
        }
    }

    async Relatorio(req, res) {
        try {
            const filtros = req.query;
            const result = await EstoqueService.RelatorioProdutos(filtros);


            if (!result.success) return res.status(400).json(result);

            res.status(200).json({ success: true, relatorio: result.relatorio });
        } catch (err) {
            console.log({ success: false, error: err, method: 'EstoqueController / Relatorio()' });
            return res.status(500).json({ success: false, message: 'Erro ao gerar relatório.', error: err.message });
        }
    }
}

export default new EstoqueController();
