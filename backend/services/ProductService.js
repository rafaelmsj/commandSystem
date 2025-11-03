import db from '../database/database.js';

class ProductService {

    async CreateProduto(nome, valorPadrao, estoque_atual, estoque_minimo) {
        try {

            const nameOk = await this.FirstLetterUpper(nome.toLowerCase().trim())

            await db.execute(`INSERT INTO produto (nome, valorPadrao, estoque_atual, estoque_minimo) VALUES (?, ?, ?, ?)`,
                [nameOk, valorPadrao, estoque_atual, estoque_minimo]
            )

            return { success: true, message: 'Produto inserido no banco de dados.' }
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ProductService / CreateProduto()' })
            return { success: false, message: 'Erro ao cadastrar o produto.' }
        }
    }

    async UpdateProduto(nome, valorPadrao, id_produto, estoque_atual, estoque_minimo) {
        try {
            const nameOk = await this.FirstLetterUpper(nome.toLowerCase().trim())

            await db.execute(`UPDATE produto SET nome = ?, valorPadrao = ?, estoque_atual = ?, estoque_minimo = ? WHERE id = ?`,
                [nameOk, valorPadrao, estoque_atual, estoque_minimo, id_produto]
            )

            return { success: true, message: 'Produto alterado com sucesso.' }
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ProductService / UpdateProduto()' })
            return { success: false, message: 'Erro ao alterar o produto.' }
        }
    }

    async FindName(nome) {
        try {
            const result = await db.execute(`SELECT * FROM produto WHERE nome = ?`, [nome])

            if (result[0][0] == undefined) return { success: false, message: 'Produto não encontrado.' }

            return { success: true, message: 'Produto encontrado.', product: result[0][0] }
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ProductService / FindName()' })
            return { success: false, message: 'Erro ao buscar esse produto.' }
        }
    }

    async GetAll(search) {
        try {

            if (search == undefined || search == '') {
                const result = await db.execute(`SELECT * FROM produto ORDER BY nome ASC`)

                return { success: true, message: 'Lista de produtos.', products: result[0] }
            }

            const result = await db.execute(`SELECT * FROM produto WHERE nome LIKE ? ORDER BY nome ASC`, [`%${search}%`])

            return { success: true, message: 'Lista de produtos.', products: result[0] }

        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ProductService / GetAll()' })
            return { success: false, message: 'Erro ao buscar produtos.' }
        }
    }

    async FirstLetterUpper(str) {
        return str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

}

export default new ProductService();