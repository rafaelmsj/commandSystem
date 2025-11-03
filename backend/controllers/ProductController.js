import ProductService from '../services/ProductService.js';
import EstoqueService from '../services/EstoqueService.js';
import db from '../database/database.js'


class ProductController {

    async GetAll(req, res) {
        try {
            const search = req.query.search

            const result = await ProductService.GetAll(search);

            res.status(200).json(result.products)
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ProductController / GetAll()' })
            return res.status(500).json({ success: false, message: 'Erro ao buscar produtos.', error: err.message })
        }
    }

    async Create(req, res) {
        try {
            const { nome, valorPadrao, estoque_atual, estoque_minimo } = req.body;

            if (!nome || !valorPadrao || estoque_atual === undefined || estoque_minimo === undefined) return res.status(400).json({ success: false, message: 'Preencha todos os campos!' });

            if (nome.trim().length < 3) return res.status(400).json({ success: false, message: 'Digite um nome válido.' });

            if (isNaN(valorPadrao)) return res.status(400).json({ success: false, message: 'Digite um valor válido.' });

            if (estoque_atual < 0 || estoque_minimo < 0) return res.status(400).json({ success: false, message: 'Estoque não pode ser negativo.' });

            const findName = await ProductService.FindName(nome);
            if (findName.success) return res.status(400).json({ success: false, message: 'Produto já cadastrado.' });

            const createProduto = await ProductService.CreateProduto(nome, valorPadrao, estoque_atual, estoque_minimo);
            if (!createProduto.success) return res.status(400).json({ success: false, message: 'Não conseguimos cadastrar esse produto.' });

            const newProduct = await ProductService.FindName(nome);

            await EstoqueService.RegistrarMovimentacao({ produto_id: newProduct.product.id, cliente_id: null, origem: 'cadastro_produto', tipo: 'entrada', quantidade: estoque_atual, descricao: `Cadastro inicial do produto "${nome}" com ${estoque_atual} unidades.`, });

            res.status(201).json({ success: true, message: 'Produto cadastrado e estoque atualizado com sucesso!' });
        } catch (err) {
            console.log({ success: false, error: err, method: 'ProductController / Create()' });
            return res.status(500).json({ success: false, message: 'Erro interno no servidor', error: err.message });
        }
    }


    async Update(req, res) {
        try {
            const { nome, valorPadrao, estoque_atual, estoque_minimo } = req.body;
            const id_produto = req.params.id;

            if (!nome || !valorPadrao) return res.status(400).json({ success: false, message: 'Preencha todos os campos!' });

            if (nome.length < 3) return res.status(400).json({ success: false, message: 'Digite um nome válido.' });

            if (isNaN(valorPadrao)) return res.status(400).json({ success: false, message: 'Digite um valor válido.' });

            if (estoque_atual < 0 || estoque_minimo < 0) return res.status(400).json({ success: false, message: 'Estoque não pode ser negativo.' });

            const findName = await ProductService.FindName(nome);
            if (findName.success && findName.product.id != id_produto) return res.status(400).json({ success: false, message: 'Esse produto já está cadastrado.' });

            const [rows] = await db.execute('SELECT estoque_atual FROM produto WHERE id = ?', [id_produto]);
            const estoqueAntigo = rows[0]?.estoque_atual ?? 0;

            const updateProduto = await ProductService.UpdateProduto(nome, valorPadrao, id_produto, estoque_atual, estoque_minimo);
            if (!updateProduto.success) return res.status(400).json({ success: false, message: 'Não conseguimos alterar esse produto.' });

            const diferenca = estoque_atual - estoqueAntigo;

            if (diferenca !== 0) {
                const tipoMovimentacao = diferenca > 0 ? 'entrada' : 'saida';
                const quantidade = Math.abs(diferenca);

                await EstoqueService.RegistrarMovimentacao({
                    produto_id: id_produto, cliente_id: null, origem: 'alteracao_produto', tipo: tipoMovimentacao, quantidade, descricao: tipoMovimentacao === 'entrada'
                        ? `Ajuste de estoque: adicionadas ${quantidade} unidade(s) no produto "${nome}".`
                        : `Ajuste de estoque: retiradas ${quantidade} unidade(s) do produto "${nome}".`,
                });
            }

            res.status(200).json({ success: true, message: 'Produto alterado e movimentação registrada com sucesso!' });
        } catch (err) {
            console.log({ success: false, error: err, method: 'ProductController / Update()' });
            return res.status(500).json({ success: false, message: 'Erro interno no servidor', error: err.message });
        }
    }



}

export default new ProductController();