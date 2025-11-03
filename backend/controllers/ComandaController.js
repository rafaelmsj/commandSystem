import ComandaService from '../services/ComandaService.js';
import ClientService from '../services/ClientService.js';

class ComandaController {

    async GetAll(req, res) {
        try {
            const filters = req.query; 

            const result = await ComandaService.GetAll(filters);

            res.status(200).json(result.comandas)
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ComandaController / GetAll()' })
            return res.status(500).json({ success: false, message: 'Erro ao buscar Comandas.', error: err.message })
        }
    }

    async GetById(req, res) {
        try {
            const { id } = req.params;
            const result = await ComandaService.GetById(id);

            res.status(200).json(result.comandas)
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ComandaController / GetById(id)' })
            return res.status(500).json({ success: false, message: 'Erro ao buscar comanda.', error: err.message })
        }
    }

    async Create(req, res) {
        try {
            const { clienteId } = req.body

            if (!clienteId) return res.status(400).json({ success: false, message: 'Preencha todos os campos!' })

            const findById = await ClientService.GetById(clienteId)
            if (!findById.success) return res.status(400).json({ success: false, message: 'Cliente não encontrado.' })

            const createComanda = await ComandaService.CreateComanda(clienteId, findById.client[0].name)
            if (!createComanda.success) return res.status(400).json({ success: false, message: 'Não conseguimos cadastrar essa comanda.' })

            res.status(201).json({ success: true, message: 'Comanda cadastrada com sucesso!' })
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ComandaController / Create()' })
            return res.status(500).json({ success: false, message: 'Erro interno no servidor', error: err.message })
        }
    }

    async Update(req, res) {
        try {
            const { nome, valorPadrao } = req.body
            const id_produto = req.params.id

            if (!nome, !valorPadrao) return res.status(400).json({ success: false, message: 'Preencha todos os campos!' })

            if (nome.length < 3) return res.status(400).json({ success: false, message: 'Digite um nome válido.' })

            if (isNaN(valorPadrao)) return res.status(400).json({ success: false, message: 'Digite um valor válido.' })

            const findName = await ComandaService.FindName(nome)
            if (findName.success && findName.product.id != id_produto) return res.status(400).json({ success: false, message: 'Esse produto já está cadastrado.' })

            const updateProduto = await ComandaService.UpdateProduto(nome, valorPadrao, id_produto)
            if (!updateProduto.success) return res.status(400).json({ success: false, message: 'Não conseguimos alterar esse produto.' })

            res.status(201).json({ success: true, message: 'Produto alterado com sucesso!' })
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ComandaController / Update()' })
            return res.status(500).json({ success: false, message: 'Erro interno no servidor', error: err.message })
        }
    }

    async fechar(req, res) {
        try {
            const { id } = req.params;

            const verifySaldo = await ComandaService.GetById(parseInt(id))
            if (verifySaldo.comandas.saldoRestante != 0) return res.status(400).json({ success: false, message: 'Não é possivel fechar a comanda pois tem saldo em aberto.'})

            const comanda = await ComandaService.fechar(parseInt(id));

            res.status(200).json(comanda);
        } catch (err) {
            console.log({ success: false, error: err, method: 'ComandaController / fechar()' })
            return res.status(500).json({ success: false, message: 'Erro interno no servidor', error: err.message })
        }
    }


}

export default new ComandaController();