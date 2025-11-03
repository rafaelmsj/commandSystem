import RifaService from '../services/RifaService.js';
import EstoqueService from '../services/EstoqueService.js';

class RifaController {

    async Create(req, res) {
        try {
            const { quantidade_ganhadores, nome, data, status, colocacoes } = req.body;

            const createRifaResult = await RifaService.CreateRifa(quantidade_ganhadores, nome, data, status);
            if (!createRifaResult.success) {
                return res.status(400).json({ success: false, message: 'Não conseguimos cadastrar essa rifa.' });
            }

            const rifaId = createRifaResult.result.insertId;

            // Processar colocações e prêmios
            for (const colocacao of colocacoes) {
                const createColocacaoResult = await RifaService.CreateColocacao(rifaId, colocacao.posicao);
                if (!createColocacaoResult.success) {
                    return res.status(400).json({ success: false, message: `Erro ao cadastrar colocação ${colocacao.posicao}.` });
                }
                const colocacaoId = createColocacaoResult.result.insertId;

                for (const premio of colocacao.premios) {
                    const createPremioResult = await RifaService.CreatePremio(colocacaoId, premio.produto_id, premio.quantidade);
                    if (!createPremioResult.success) {
                        // Considerar rollback ou tratamento de erro mais robusto aqui
                        return res.status(400).json({ success: false, message: `Erro ao cadastrar prêmio ${premio.nome_produto} para a colocação ${colocacao.posicao}.` });
                    }
                }
            }

            res.status(201).json({ success: true, message: 'Rifa cadastrada com sucesso!' });
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'RifaController / Create()' });
            return res.status(500).json({ success: false, message: 'Erro interno no servidor', error: err.message });
        }
    }

    async GetAll(req, res) {
        try {
            const {
                status,
                data,
                page = 1,
                limit = 9
            } = req.query;

            const pageNumber = parseInt(page, 10) || 1;
            const limitNumber = parseInt(limit, 10) || 10;

            const filters = { status, data };

            const result = await RifaService.GetAll({ filters, page: pageNumber, limit: limitNumber });

            res.status(200).json({ result: result.rifas, pagination: result.pagination });
        }
        catch (err) {
            console.log({ success: false, error: err, method: 'ComandaController / GetAll()' })
            return res.status(500).json({ success: false, message: 'Erro ao buscar Comandas.', error: err.message })
        }
    }

    async GetID(req, res) {
        try {
            const { id } = req.params;
            const result = await RifaService.GetById(id);

            if (!result.success) return res.status(404).json({ success: false, message: result.message });

            res.status(200).json(result.rifa);
        } catch (err) {
            console.error({ success: false, error: err, method: 'RifaController / GetID()' });
            res.status(500).json({ success: false, message: 'Erro ao buscar rifa.', error: err.message });
        }
    }

    async AtualizaGanhador(req, res) {
        try {
            const { ganhadores, status } = req.body;
            const { rifa_id } = req.params

            for (const ganhador of ganhadores) {
                const resultGanhador = await RifaService.DefinirGanhador(ganhador.colocacaoId, ganhador.ganhadorNome, ganhador.ganhadorId)
                if (!resultGanhador.success) return res.status(400).json({ success: false, message: 'Error ao definir ganhadores da rifa.' });
            };

            const finalizaRifa = await RifaService.MudarStatusRifa('finalizada', rifa_id)
            if (!finalizaRifa.success) return res.status(400).json({ success: false, message: 'Error ao finalizar rifa.' });

            res.status(200).json({ success: true, message: 'Rifa finalizada com sucesso!' });
        } catch (err) {
            console.error({ success: false, error: err, method: 'RifaController / AtualizaGanhador()' });
            res.status(500).json({ success: false, message: 'Erro ao atualizar rifa.', error: err.message });
        }
    }

    async DeletarRifa(req, res) {
        try {
            const { rifa_id } = req.params

            const findRifa = await RifaService.GetById(rifa_id);
            if (!findRifa.success) return res.status(400).json({ success: false, message: findRifa.message })
            if (findRifa.rifa.status == 'finalizada') return res.status(400).json({ success: false, message: 'Não é possivel deletar uma rifa que já foi finalizada.' })

            const deletaRifa = await RifaService.DeletarRifa(rifa_id);
            if (!deletaRifa.success) return res.status(400).json({ success: false, message: 'Erro ao deletar rifa.' })

            res.status(200).json({ success: true, message: 'Rifa deletada com sucesso!' });
        } catch (err) {
            console.error({ success: false, error: err, method: 'RifaController / DeletarRifa()' });
            res.status(500).json({ success: false, message: 'Erro ao deletar rifa.', error: err.message });
        }
    }

    async BuscarPremios(req, res) {
        try {
            const { nome, filtro } = req.query;

            const result = await RifaService.BuscaPremiosGanhador(nome, filtro);
            if (!result.success) return res.status(400).json({ success: false, message: result.message });

            res.status(200).json(result.result);
        }
        catch (err) {
            console.error({ success: false, message: 'Erro ao buscar prêmios do cliente.', method: 'RifaController / DeletarRifa()', error: err });
            res.status(500).json({ success: false, message: 'Erro ao buscar prêmios do cliente.', error: err.message });
        }
    }

    async MarcarComoEntregue(req, res) {
        try {
            const { produto_id, quantidade, status_entrega, cliente_id } = req.body;
            const { premio_id } = req.params;

            if (status_entrega === 'entregue') {
                let estoque = await EstoqueService.DiminuirEstoque(produto_id, quantidade, 'rifa', cliente_id, `Entrega de prêmio da rifa`);
                if (!estoque.success) return res.status(400).json({ message: estoque.message }), console.log(estoque.message)
            }

            const marcarEntregue = await RifaService.MudarStatusPremio(status_entrega, premio_id);
            if (!marcarEntregue.success) return res.status(400).json({ success: false, message: 'Erro ao mudar o status do prêmio.' })

            res.status(200).json({ success: true, message: 'Status  do prêmio alterado com sucesso!' });
        }
        catch (err) {
            console.error({ success: false, message: 'Erro ao marcar como entregue.', method: 'RifaController / MarcarComoEntregue()', error: err });
            res.status(500).json({ success: false, message: 'Erro ao marcar como entregue.', error: err.message });
        }
    }

    async AlterarPremio(req, res) {
        try {
            const { produto_id, quantidade } = req.body;
            const { premio_id } = req.params;

            const alterarPremio = await RifaService.AlterarPremio(produto_id, quantidade, premio_id);
            if (!alterarPremio.success) return res.status(400).json({ success: false, message: 'Erro ao mudar o produto do prêmio.' })

            res.status(200).json({ success: true, message: 'Prêmio alterado com sucesso!' });
        }
        catch (err) {
            console.error({ success: false, message: 'Erro ao alterar prêmio.', method: 'RifaController / AlterarPremio()', error: err });
            res.status(500).json({ success: false, message: 'Erro ao alterar prêmio.', error: err.message });
        }
    }

    async DeletarPremio(req, res) {
        try {
            const { premio_id } = req.params;

            const deletarPremio = await RifaService.DeletarPremio(premio_id);
            if (!deletarPremio.success) return res.status(400).json({ success: false, message: 'Erro ao deletar o produto do prêmio.' })

            res.status(200).json({ success: true, message: 'Prêmio deletado com sucesso!' });
        }
        catch (err) {
            console.error({ success: false, message: 'Erro ao deletar prêmio.', method: 'RifaController / DeletarPremio()', error: err });
            res.status(500).json({ success: false, message: 'Erro ao deletar prêmio.', error: err.message });
        }
    }

    async CriarPremio(req, res) {
        try {
            const { produto_id, quantidade } = req.body;
            const { colocacao_id } = req.params;

            const criarPremio = await RifaService.CriarPremio(produto_id, quantidade, colocacao_id);
            if (!criarPremio.success) return res.status(400).json({ success: false, message: 'Erro ao adicionar novo produto do prêmio.' })

            res.status(200).json({ success: true, message: 'Novo prêmio criado com sucesso!' });
        }
        catch (err) {
            console.error({ success: false, message: 'Erro ao criar novo prêmio.', method: 'RifaController / CriarPremio()', error: err });
            res.status(500).json({ success: false, message: 'Erro ao criar novo prêmio.', error: err.message });
        }
    }
}

export default new RifaController();