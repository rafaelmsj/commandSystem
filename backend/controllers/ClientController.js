import ClientService from '../services/ClientService.js';

class ClientController {

    async GetAll(req, res) {
        try {
            const search = req.query.search

            const result = await ClientService.GetAll(search);

            res.status(200).json(result.clients)
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ClientController / GetAll()' })
            return res.status(500).json({ success: false, message: 'Erro ao buscar clientes.', error: err.message })
        }
    }

    async GetById(req, res) {
        try {
            const id_user = req.params.id

            const result = await ClientService.GetById(id_user);

            res.status(200).json(result.client)
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ClientController / GetById()' })
            return res.status(500).json({ success: false, message: 'Erro ao buscar cliente.', error: err.message })
        }
    }

    async Create(req, res) {
        try {
            const { name, number, endereco } = req.body

            if (!name, !number) return res.status(400).json({ success: false, message: 'Preencha todos os campos!' })

            if (name.trim().length < 3) return res.status(400).json({ success: false, message: 'Digite um name válido.' })

            if (number.trim().length < 10 || number.length > 12 || isNaN(number)) return res.status(400).json({ success: false, message: 'Digite um número válido.' })

            const findName = await ClientService.FindName(name)
            if (findName.success) return res.status(400).json({ success: false, message: 'Cliente já cadastrado.' })

            const findNumber = await ClientService.FindNumber(number)
            if (findNumber.success) return res.status(400).json({ success: false, message: 'Esse número já esta cadastrado.' })

            const createClient = await ClientService.CreateClient(name, number, endereco)
            if (!createClient.success) return res.status(400).json({ success: false, message: 'Não conseguimos cadastrar esse cliente.' })

            res.status(201).json({ success: true, message: 'Cliente cadastrado com sucesso!' })

        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ClientController / Create()' })
            return res.status(500).json({ success: false, message: 'Erro interno no servidor', error: err.message })
        }
    }

    async Update(req, res) {
        try {
            const { name, number, endereco } = req.body
            const id_user = req.params.id

            if (!name, !number, !endereco) return res.status(400).json({ success: false, message: 'Preencha todos os campos!' })

            if (name.length < 3) return res.status(400).json({ success: false, message: 'Digite um nome válido.' })

            if (number.length < 10 || number.length > 12 || isNaN(number)) return res.status(400).json({ success: false, message: 'Digite um número válido.' })

            const findName = await ClientService.FindName(name)
            if (findName.success && findName.client.id != id_user) return res.status(400).json({ success: false, message: 'Esse nome já está cadastrado.' })

            const findNumber = await ClientService.FindNumber(number)
            if (findNumber.success && findNumber.client.id != id_user) return res.status(400).json({ success: false, message: 'Esse número já esta cadastrado.' })

            const updateClient = await ClientService.UpdateClient(name, number, endereco, id_user)
            if (!updateClient.success) return res.status(400).json({ success: false, message: 'Não conseguimos alterar esse cliente.' })

            res.status(201).json({ success: true, message: 'Cliente alterado com sucesso!' })
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ClientController / Update()' })
            return res.status(500).json({ success: false, message: 'Erro interno no servidor', error: err.message })
        }
    }


}

export default new ClientController();