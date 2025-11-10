import db from '../database/database.js';

class ClientService {

    async CreateClient(name, number, endereco) {
        try {

            const nameOk = await this.FirstLetterUpper(name.toLowerCase().trim())

            await db.query(`INSERT INTO client (name, number, endereco) VALUES (?, ?, ?)`,
                [nameOk, number.trim(), endereco.trim()]
            )

            return { success: true, message: 'Cliente inserido no banco de dados.' }
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ClientService / Create()' })
            return { success: false, message: 'Erro ao cadastrar o cliente.' }
        }
    }

    async UpdateClient(name, number, endereco, id_user) {
        try {
            const nameOk = await this.FirstLetterUpper(name.toLowerCase().trim())

            await db.query(`UPDATE client SET name = ?, number = ?, endereco = ? WHERE id = ?`,
                [nameOk, number.trim(), endereco.trim(), id_user]
            )

            return { success: true, message: 'Cliente alterado com sucesso.' }
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ClientService / UpdateClient()' })
            return { success: false, message: 'Erro ao alterar o cliente.' }
        }
    }

    async FindName(name) {
        try {
            const result = await db.query(`SELECT * FROM client WHERE name = ?`,
                [`%${name}%`]
            )

            if (result[0][0] == undefined) return { success: false, message: 'Nome não encontrado.' }

            return { success: true, message: 'Nome encontrado.', client: result[0][0] }
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ClientService / FindName()' })
            return { success: false, message: 'Erro ao buscar esse nome.' }
        }
    }

    async FindNumber(number) {
        try {
            const result = await db.query(`SELECT * FROM client WHERE number = ?`,
                [number]
            )

            if (result[0][0] == undefined) return { success: false, message: 'Número não encontrado.' }

            return { success: true, message: 'Número já associado a um cadastro.', client: result[0][0] }
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ClientService / FindNumber()' })
            return { success: false, message: 'Erro ao buscar esse número.' }
        }
    }

    async GetAll(search) {
        try {
            if (search == undefined || search == '') {
                const result = await db.query(`SELECT * FROM client ORDER BY name ASC`)

                return { success: true, message: 'Lista de clientes.', clients: result[0] }
            }

            const result = await db.query(
                `SELECT * FROM client WHERE name LIKE ? ORDER BY name ASC`,
                [`%${search}%`]
              );

            return { success: true, message: 'Lista de clientes.', clients: result[0] }
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ClientService / GetAll()' })
            return { success: false, message: 'Erro ao buscar clientes.' }
        }
    }

    async GetById(id_user) {
        try {
            const result = await db.query(`SELECT * FROM client WHERE id = ?`,
                [id_user]
            )

            if (result[0] == undefined) return { success: false, message: 'Cliente não encontrado.' }

            return { success: true, message: 'Listando cliente.', client: result[0] }
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ClientService / GetById()' })
            return { success: false, message: 'Erro ao buscar cliente.' }
        }
    }

    async FirstLetterUpper(str) {
        return str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

}

export default new ClientService();