import express from 'express'
const Router = express.Router();

import ClientController from '../controllers/ClientController.js';
import ProductController from '../controllers/ProductController.js';
import ComandaController from '../controllers/ComandaController.js';
import LancamentoController from '../controllers/LancamentoController.js';
import PagamentoController from '../controllers/PagamentoController.js';
import DashboardController from '../controllers/DashboardController.js';
import EstoqueController from '../controllers/EstoqueController.js';
import RifaController from '../controllers/RifaController.js';
import LavacaoController from '../controllers/LavacaoController.js';
import AuthController from '../controllers/AuthController.js';

import verifyToken from '../middlewares/verifyToken.js';

Router.post('/auth/register', AuthController.validateRegistration, AuthController.register);
Router.post('/auth/login', AuthController.login);

Router.use(verifyToken);

Router.post('/cliente', ClientController.Create);
Router.put('/cliente/:id', ClientController.Update);
Router.get('/clientes', ClientController.GetAll);
Router.get('/cliente/:id', ClientController.GetById);

Router.post('/produto', ProductController.Create);
Router.put('/produto/:id', ProductController.Update);
Router.get('/produtos', ProductController.GetAll);

Router.put('/produtos/:id/estoque', EstoqueController.UpdateEstoque)
Router.get('/produtos/estoque-baixo', EstoqueController.EstoqueBaixo)

Router.post('/comanda', ComandaController.Create)
Router.get('/comandas', ComandaController.GetAll);
Router.get('/comandas/:id', ComandaController.GetById)
Router.get('/comandas/:comandaId/lancamentos', LancamentoController.getByComanda)
Router.get('/comandas/:comandaId/pagamentos', PagamentoController.getByComanda)
Router.patch('/comandas/:id/fechar', ComandaController.fechar)

Router.post('/lancamentos', LancamentoController.create)
Router.delete('/lancamentos/:id', LancamentoController.delete)

Router.post('/pagamentos', PagamentoController.create)
Router.delete('/pagamentos/:id', PagamentoController.delete)

Router.get('/dashboard', DashboardController.getData)
Router.get('/dashboard/comandas', DashboardController.getComandas)
Router.get('/dashboard/produtos-mais-vendidos', DashboardController.getProdutosMaisVendidos)
Router.get('/caixa', DashboardController.Caixa)
Router.get('/caixa/exportar', DashboardController.ExportarCaixa);

Router.post('/rifas', RifaController.Create)
Router.delete('/rifas/:rifa_id', RifaController.DeletarRifa)
Router.get('/rifas', RifaController.GetAll)
Router.get('/rifas/:id', RifaController.GetID)
Router.get('/premios/cliente', RifaController.BuscarPremios);

Router.put('/premios/:premio_id/entregar', RifaController.MarcarComoEntregue);
Router.put('/premios/:premio_id', RifaController.AlterarPremio);
Router.post('/premio/:colocacao_id/novo', RifaController.CriarPremio);
Router.delete('/premios/:premio_id', RifaController.DeletarPremio);

Router.put('/rifas/:rifa_id', RifaController.AtualizaGanhador)

Router.get('/estoque/movimentacoes', EstoqueController.ListarMovimentacoes);
Router.get('/estoque/relatorio', EstoqueController.Relatorio);
Router.get('/estoque/baixo', EstoqueController.EstoqueBaixo);


Router.post('/lavacoes', LavacaoController.registrar);
Router.get('/lavacoes', LavacaoController.listar);
Router.put('/lavacoes/:id', LavacaoController.atualizar);
Router.get('/lavacoes/relatorio', LavacaoController.relatorio);
Router.get('/lavacoes/resumo-dia', LavacaoController.resumoDia);
Router.get('/lavacoes/abertas', LavacaoController.resumoAbertas);
Router.get('/lavacoes/antigas', LavacaoController.lavacoesAntigas);




export default Router;
