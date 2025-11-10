import db from '../database/database.js'

class EstoqueService {

    async UpdateEstoque(estoque_atual, estoque_minimo, id) {
        try {

            const [rows] = await db.query(`SELECT nome, estoque_atual FROM produto WHERE id = ?`, [id]);
            if (rows.length === 0) return { success: false, message: 'Produto não encontrado.' };

            const produto = rows[0];
            const estoqueAntigo = parseFloat(produto.estoque_atual) || 0;
            const novoEstoque = parseFloat(estoque_atual) || 0;
            const diferenca = novoEstoque - estoqueAntigo;

            await db.query(
                `UPDATE produto SET estoque_atual = ?, estoque_minimo = ? WHERE id = ?`,
                [novoEstoque, estoque_minimo, id]
            );

            if (diferenca !== 0) {
                const tipo = diferenca > 0 ? 'entrada' : 'saida';
                const quantidade = Math.abs(diferenca);

                await db.query(
                    `INSERT INTO movimentacao_estoque 
                        (produto_id, cliente_id, origem, tipo, quantidade, descricao, created_at)
                        VALUES (?, NULL, ?, ?, ?, ?, NOW())`,
                    [
                        id,
                        'ajuste_manual',
                        tipo,
                        quantidade,
                        tipo === 'entrada'
                            ? `Ajuste manual: adicionadas ${quantidade} unidade(s) no produto "${produto.nome}".`
                            : `Ajuste manual: retiradas ${quantidade} unidade(s) do produto "${produto.nome}".`,
                    ]
                );
            }

            return { success: true, message: 'Estoque atualizado com sucesso.' };
        } catch (err) {
            console.log({ success: false, error: err, method: 'EstoqueService / UpdateEstoque()' });
            return { success: false, message: 'Erro ao atualizar estoque.', error: err.message };
        }
    }


    async ProdutosEstoqueBaixo() {
        try {
            const result = await db.query(`SELECT * FROM produto WHERE estoque_atual <= estoque_minimo ORDER BY estoque_atual ASC`);
            return { success: true, message: 'Lista de produtos.', products: result[0] }
        } catch (err) {
            console.log({ success: false, error: err, method: 'ProductService / ProdutosEstoqueBaixo()' })
            return { success: false, message: 'Erro ao buscar produtos com estoque baixo.', error: err.message }
        }
    }

    async DiminuirEstoque(produto_id, quantidade, origem = null, cliente_id = null, descricao = null) {
        try {
            const [rows] = await db.query(`SELECT estoque_atual FROM produto WHERE id = ?`, [produto_id]);
            if (!rows[0]) return { success: false, message: 'Produto não encontrado.' };

            const novoEstoque = rows[0].estoque_atual - quantidade;
            if (novoEstoque < 0) return { success: false, message: 'Estoque insuficiente.' };

            await db.query(`UPDATE produto SET estoque_atual = ? WHERE id = ?`, [novoEstoque, produto_id]);

            await this.RegistrarMovimentacao({
                produto_id,
                cliente_id,
                origem,
                tipo: 'saida',
                quantidade,
                descricao: descricao || `Saída de ${quantidade} unidade(s)`
            });

            return { success: true, message: 'Estoque atualizado e movimentação registrada.' };
        } catch (err) {
            console.log({ success: false, error: err, method: 'EstoqueService / DiminuirEstoque()' });
            return { success: false, message: 'Erro ao baixar estoque.', error: err.message };
        }
    }

    async AumentarEstoque(produto_id, quantidade, origem = null, cliente_id = null, descricao = null) {
        try {
            const [rows] = await db.query(`SELECT estoque_atual FROM produto WHERE id = ?`, [produto_id]);
            if (!rows[0]) return { success: false, message: 'Produto não encontrado.' };

            const novoEstoque = rows[0].estoque_atual + quantidade;
            await db.query(`UPDATE produto SET estoque_atual = ? WHERE id = ?`, [novoEstoque, produto_id]);

            await this.RegistrarMovimentacao({
                produto_id,
                cliente_id,
                origem,
                tipo: 'entrada',
                quantidade,
                descricao: descricao || `Entrada de ${quantidade} unidade(s)`
            });

            return { success: true, message: 'Estoque devolvido e movimentação registrada.' };
        } catch (err) {
            console.log({ success: false, error: err, method: 'EstoqueService / AumentarEstoque()' });
            return { success: false, message: 'Erro ao devolver estoque.', error: err.message };
        }
    }

    async RegistrarMovimentacao({ produto_id, cliente_id, origem, tipo, quantidade, descricao }) {
        try {
            await db.query(
                `INSERT INTO movimentacao_estoque (produto_id, cliente_id, origem, tipo, quantidade, descricao)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [produto_id, cliente_id, origem, tipo, quantidade, descricao]
            );
        } catch (err) {
            console.log({ success: false, error: err, method: 'EstoqueService / RegistrarMovimentacao()' });
        }
    }

    async ListarMovimentacoes({ produto_id, cliente_id, origem, tipo, dataInicio, dataFim, page = 1, limit = 20, order = 'desc' }) {
        try {
            const offset = (page - 1) * limit;
            let where = 'WHERE 1=1';
            const params = [];

            if (produto_id) {
                where += ' AND m.produto_id = ?';
                params.push(produto_id);
            }
            if (cliente_id) {
                where += ' AND m.cliente_id = ?';
                params.push(cliente_id);
            }
            if (origem) {
                where += ' AND m.origem = ?';
                params.push(origem);
            }
            if (tipo) {
                where += ' AND m.tipo = ?';
                params.push(tipo);
            }
            if (dataInicio) {
                where += ' AND DATE(m.created_at) >= ?';
                params.push(dataInicio);
            }
            if (dataFim) {
                where += ' AND DATE(m.created_at) <= ?';
                params.push(dataFim);
            }

            // Contagem total para paginação
            const [countResult] = await db.query(`
                SELECT COUNT(*) AS total
                FROM movimentacao_estoque m
                ${where}
                `, params);
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);

            // Consulta paginada e ordenada
            const [rows] = await db.query(`
                SELECT 
                    m.id,
                    m.produto_id,
                    p.nome AS produto_nome,
                    m.cliente_id,
                    c.name AS cliente_nome,
                    m.origem,
                    m.tipo,
                    m.quantidade,
                    m.descricao,
                    m.created_at
                FROM movimentacao_estoque m
                LEFT JOIN produto p ON m.produto_id = p.id
                LEFT JOIN client c ON m.cliente_id = c.id
                ${where}
                ORDER BY m.created_at ${order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}
                LIMIT ? OFFSET ?
                `, [...params, Number(limit), Number(offset)]);

            return { success: true, message: 'Movimentações encontradas.', movimentacoes: rows, pagination: { total, totalPages, currentPage: Number(page), limit: Number(limit), } };
        } catch (err) {
            console.log({ success: false, error: err, method: 'EstoqueService / ListarMovimentacoes()' });
            return { success: false, message: 'Erro ao buscar movimentações de estoque.', error: err.message };
        }
    }

    async RelatorioProdutos({ dataInicio, dataFim, origem, tipo, cliente_id, produto_id }) {
        try {
            let where = 'WHERE 1=1';
            const params = [];

            if (origem) {
                where += ' AND m.origem = ?';
                params.push(origem);
            }
            if (tipo) {
                where += ' AND m.tipo = ?';
                params.push(tipo);
            }
            if (dataInicio) {
                where += ' AND DATE(m.created_at) >= ?';
                params.push(dataInicio);
            }
            if (dataFim) {
                where += ' AND DATE(m.created_at) <= ?';
                params.push(dataFim);
            }

            if (cliente_id) {
                where += ' AND m.cliente_id = ?';
                params.push(cliente_id);
            }

            if (produto_id) {
                where += ' AND m.produto_id = ?';
                params.push(produto_id);
            }

            const [rows] = await db.query(`
      SELECT 
        p.nome AS produto_nome,
        SUM(m.quantidade) AS total_movimentado,
        m.tipo
      FROM movimentacao_estoque m
      LEFT JOIN produto p ON m.produto_id = p.id
      ${where}
      GROUP BY p.id, m.tipo
      ORDER BY total_movimentado DESC
    `, params);

            return { success: true, relatorio: rows };
        } catch (err) {
            console.log({ success: false, error: err, method: 'EstoqueService / RelatorioProdutos()' });
            return { success: false, message: 'Erro ao gerar relatório.', error: err.message };
        }
    }

}

export default new EstoqueService();
