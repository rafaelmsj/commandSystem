import React, { useEffect, useState } from 'react';
import { PlusCircle, Wallet, Search, ChevronLeft, ChevronRight, Filter, X, CreditCard, Plus, FileSpreadsheet } from 'lucide-react';
import api from '../services/api';
import Button from '../components/UI/Button';
import { Input } from '../components/UI/InputRifa';
import Card from '../components/UI/Card';
import ReactSelect from 'react-select';
import Modal from '../components/UI/Modal';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Lavacao {
    id: number;
    tipo: string;
    placa: string;
    carro: string;
    cliente: string;
    valor: number;
    pago: boolean;
    forma_pagamento?: string;
    observacoes?: string;
    data_lavagem: string;
    desconto: string;
}

export const LavacaoPage: React.FC = () => {
    const [lavacoes, setLavacoes] = useState<Lavacao[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const hasActiveFilters = Array.from(searchParams.keys()).length > 0;
    const [relatorio, setRelatorio] = useState<{ [key: string]: number }>({});

    // Estado para os valores dos inputs do filtro (não aplicados)
    const [filterInputs, setFilterInputs] = useState({
        pago: searchParams.get('pago') || '',
        forma_pagamento: searchParams.get('forma_pagamento') || '',
        dataInicio: searchParams.get('dataInicio') || '',
        dataFim: searchParams.get('dataFim') || '',
        desconto: searchParams.get('desconto') === '1' ? '1' : searchParams.get('desconto') === '0' ? '0' : '',
    });

    // Estado para os filtros que estão de fato aplicados (sincronizados com searchParams)
    const [appliedFilters, setAppliedFilters] = useState({
        pago: searchParams.get('pago') || '',
        forma_pagamento: searchParams.get('forma_pagamento') || '',
        dataInicio: searchParams.get('dataInicio') || '',
        dataFim: searchParams.get('dataFim') || '',
        desconto: searchParams.get('desconto') === '1' ? '1' : searchParams.get('desconto') === '0' ? '0' : '',
    });


    const [pagination, setPagination] = useState({ totalPages: 1, currentPage: 1 });
    const [isModalCadastro, setIsModalCadastro] = useState(false);
    const [isModalPagamento, setIsModalPagamento] = useState(false);

    const [lavacaoSelecionada, setLavacaoSelecionada] = useState<Lavacao | null>(null);
    const [pagamentoData, setPagamentoData] = useState({
        forma_pagamento: '',
        descontoGold: false,
    });

    const [novoRegistro, setNovoRegistro] = useState({
        tipo: '',
        placa: '',
        carro: '',
        cliente: '',
        valor: 0,
        pago: false,
        forma_pagamento: '',
        observacoes: '',
    });

    const precosPadrao: Record<string, number> = {
        carro: 70,
        moto: 30,
        camionete: 100,
        bicicleta: 20,
        jetski: 80,
        caminhao: 150,
        carreta: 200,
        '5ª roda': 250,
        'quadri ciclo': 50,
    };

    const handleApplyFilters = () => {
        const newParams = new URLSearchParams();
        if (filterInputs.pago) newParams.set('pago', filterInputs.pago);
        if (filterInputs.forma_pagamento) newParams.set('forma_pagamento', filterInputs.forma_pagamento);
        if (filterInputs.dataInicio) newParams.set('dataInicio', filterInputs.dataInicio);
        if (filterInputs.dataFim) newParams.set('dataFim', filterInputs.dataFim);
        if (filterInputs.desconto) newParams.set('desconto', filterInputs.desconto);

        setSearchParams(newParams);
        setAppliedFilters(filterInputs); // 🔹 Atualiza os filtros aplicados
        setIsFilterOpen(false);
        fetchLavacoes(1); // 🔹 força reset da paginação

        const resumo: { [key: string]: number } = {};
        res.data.lavacoes.forEach((lav: Lavacao) => {
            const tipo = lav.tipo?.toLowerCase() || 'outros';
            resumo[tipo] = (resumo[tipo] || 0) + 1;
        });
        setRelatorio(resumo);
    };


    const handleClearFilters = () => {
        setSearchParams({});
        setFilterInputs({ // 🔹 Limpa os inputs
            pago: '',
            forma_pagamento: '',
            dataInicio: '',
            dataFim: '',
            desconto: '',
        });
        setAppliedFilters({ // 🔹 Limpa os filtros aplicados
            pago: '',
            forma_pagamento: '',
            dataInicio: '',
            dataFim: '',
            desconto: '',
        });
        setIsFilterOpen(false);
        fetchLavacoes(1);
    };

    const fetchLavacoes = async (toPage: number = 1) => {
        const limit = 10;

        const params = new URLSearchParams({
            page: String(toPage),
            limit: String(limit),
        });

        if (appliedFilters.pago) params.append('pago', appliedFilters.pago);
        if (appliedFilters.forma_pagamento) params.append('forma_pagamento', appliedFilters.forma_pagamento);
        if (appliedFilters.dataInicio) params.append('dataInicio', appliedFilters.dataInicio);
        if (appliedFilters.dataFim) params.append('dataFim', appliedFilters.dataFim);
        if (appliedFilters.desconto) params.append('desconto', appliedFilters.desconto);

        try {
            const res = await api.get(`/lavacoes?${params.toString()}`);
            if (res.data?.success) {
                setLavacoes(res.data.lavacoes);
                setPagination({
                    currentPage: Number(res.data.pagination?.currentPage || 1),
                    totalPages: Number(res.data.pagination?.totalPages || 1),
                });
            }
        } catch (err) {
            console.error('Erro ao buscar lavacoes:', err);
        }
    };



    // 🔹 O useEffect agora só reage a mudanças nos searchParams (URL)
    // 🔹 e a mudanças nos appliedFilters (que é atualizado no handleApplyFilters/handleClearFilters)
    useEffect(() => {
        // 🔹 Sincroniza os inputs do filtro com os searchParams ao carregar a página
        setFilterInputs({
            pago: searchParams.get('pago') || '',
            forma_pagamento: searchParams.get('forma_pagamento') || '',
            dataInicio: searchParams.get('dataInicio') || '',
            dataFim: searchParams.get('dataFim') || '',
            desconto: searchParams.get('desconto') === '1' ? '1' : searchParams.get('desconto') === '0' ? '0' : ''
        });
        setAppliedFilters({
            pago: searchParams.get('pago') || '',
            forma_pagamento: searchParams.get('forma_pagamento') || '',
            dataInicio: searchParams.get('dataInicio') || '',
            dataFim: searchParams.get('dataFim') || '',
            desconto: searchParams.get('desconto') === '1' ? '1' : searchParams.get('desconto') === '0' ? '0' : ''
        });
        fetchLavacoes(1);
    }, [searchParams]);

    // 🔹 Adiciona um useEffect para garantir que a busca seja feita quando os appliedFilters mudarem
    useEffect(() => {
        fetchLavacoes(1);
    }, [appliedFilters]);

    const handleRegistrar = async () => {
        if (!novoRegistro.tipo) return alert('Selecione o tipo da lavagem!');
        await api.post('/lavacoes', novoRegistro);
        setIsModalCadastro(false);
        setNovoRegistro({
            tipo: '',
            placa: '',
            carro: '',
            cliente: '',
            valor: 0,
            pago: false,
            forma_pagamento: '',
            observacoes: '',
        });
        fetchLavacoes();
    };

    const handleAbrirPagamento = (lav: Lavacao) => {
        setLavacaoSelecionada(lav);
        setPagamentoData({ forma_pagamento: '', descontoGold: false });
        setIsModalPagamento(true);
    };

    const handleConfirmarPagamento = async () => {
        if (!lavacaoSelecionada) return;

        if (!pagamentoData.forma_pagamento) {
            alert('Selecione a forma de pagamento antes de confirmar.');
            return;
        }

        let valorFinal = lavacaoSelecionada.valor;
        if (pagamentoData.descontoGold) valorFinal -= 10;

        await api.put(`/lavacoes/${lavacaoSelecionada.id}`, {
            pago: true,
            forma_pagamento: pagamentoData.forma_pagamento,
            valor: valorFinal,
            desconto: pagamentoData.descontoGold ? 1 : 0,
        });

        setIsModalPagamento(false);
        fetchLavacoes(pagination.currentPage);
    };


    const handleChangeTipo = (tipo: string) => {
        setNovoRegistro({ ...novoRegistro, tipo, valor: precosPadrao[tipo] || 0 });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilterInputs({ ...filterInputs, [e.target.name]: e.target.value });
    };

    const exportarExcel = async () => {
        try {
            const limit = 9999; // Exporta todos os registros

            const params = new URLSearchParams({
                page: '1',
                limit: String(limit),
            });

            // 🔹 aplica filtros ativos (appliedFilters já está sincronizado)
            if (appliedFilters.pago) params.append('pago', appliedFilters.pago);
            if (appliedFilters.forma_pagamento)
                params.append('forma_pagamento', appliedFilters.forma_pagamento);
            if (appliedFilters.dataInicio)
                params.append('dataInicio', appliedFilters.dataInicio);
            if (appliedFilters.dataFim)
                params.append('dataFim', appliedFilters.dataFim);
            if (appliedFilters.desconto)
                params.append('desconto', appliedFilters.desconto);

            const res = await api.get(`/lavacoes?${params.toString()}`);
            if (!res.data?.success) {
                alert('Erro ao gerar relatório.');
                return;
            }

            const lavacoesExport = res.data.lavacoes;
            if (!lavacoesExport.length) {
                alert('Nenhum registro encontrado para exportar.');
                return;
            }

            // 🔹 planilha principal
            const worksheet = XLSX.utils.json_to_sheet(
                lavacoesExport.map((l: any) => ({
                    Data: new Date(l.data_lavagem).toLocaleString('pt-BR'),
                    Tipo: l.tipo,
                    Placa: l.placa || '-',
                    Carro: l.carro || '-',
                    Cliente: l.cliente || '-',
                    Valor: `R$ ${l.valor}`,
                    Pago: l.pago ? 'Sim' : 'Não',
                    FormaPgto: l.forma_pagamento || '-',
                    Desconto: l.desconto == 1 ? 'Sim' : 'Não',
                }))
            );

            // 🔹 resumo por tipo
            const resumo: { [key: string]: number } = {};
            lavacoesExport.forEach((lav: any) => {
                const tipo = lav.tipo?.toLowerCase() || 'outros';
                resumo[tipo] = (resumo[tipo] || 0) + 1;
            });

            const startRow = lavacoesExport.length + 3;
            XLSX.utils.sheet_add_aoa(worksheet, [['Resumo por Tipo de Lavagem']], {
                origin: `A${startRow}`,
            });
            XLSX.utils.sheet_add_aoa(
                worksheet,
                [['Tipo', 'Total'], ...Object.entries(resumo)],
                { origin: `A${startRow + 1}` }
            );

            // 🔹 cria workbook e salva
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Lavacoes');

            const nomeArquivo = `Relatorio_Lavacao_${new Date()
                .toLocaleDateString('pt-BR')
                .replace(/\//g, '-')}.xlsx`;

            const excelBuffer = XLSX.write(workbook, {
                bookType: 'xlsx',
                type: 'array',
            });
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, nomeArquivo);
        } catch (err) {
            console.error('Erro ao exportar Excel:', err);
            alert('Erro ao exportar relatório.');
        }
    };


    return (
        <div className="">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Lavação</h1>
                    <p className="text-gray-600 mt-2">Gerencie as lavagens realizadas</p>
                </div>

                <div className="flex space-x-3">
                    {hasActiveFilters ? (
                        <>
                            <Button variant="danger" onClick={handleClearFilters}>
                                <Filter className="h-4 w-4 mr-2" />
                                Limpar Filtros
                            </Button>
                            <Button variant="secondary" onClick={() => setIsFilterOpen(true)}>
                                <Filter className="h-4 w-4 mr-2" />
                                Editar Filtros
                            </Button>
                        </>
                    ) : (
                        <Button variant="secondary" onClick={() => setIsFilterOpen(true)}>
                            <Filter className="h-4 w-4 mr-2" />
                            Filtrar
                        </Button>
                    )}
                    <Button onClick={() => setIsModalCadastro(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Lavagem
                    </Button>

                    <Button variant="secondary" onClick={exportarExcel}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Exportar Excel
                    </Button>

                </div>
            </div>

            {/* 🔍 Filtros */}


            {/* 📋 Tabela */}
            <Card className="p-6 shadow-md bg-white rounded-xl">
                {/* 📋 Lista de Lavagens */}
                <div className="space-y-3">
                    {lavacoes.length === 0 ? (
                        <p className="text-center text-gray-500 py-6">Nenhuma lavagem encontrada.</p>
                    ) : (
                        lavacoes.map((lav) => (
                            <Card
                                key={lav.id}
                                className={`p-4 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${lav.pago ? 'border-green-400 bg-green-50' : 'border-yellow-300 bg-white'
                                    }`}
                            >
                                {/* 🔹 Informações principais */}
                                <div className="flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-x-3">
                                        <h3 className="text-base font-semibold text-gray-800 capitalize">{lav.tipo}</h3>
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full font-medium ${lav.pago ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}
                                        >
                                            {lav.pago ? 'Pago' : 'Pendente'}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-700">
                                        <strong>Cliente:</strong> {lav.cliente || '-'}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <strong>Carro:</strong> {lav.carro || '-'} ({lav.placa || 'Sem placa'})
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <strong>Valor:</strong> R$ {lav.valor}{' '}
                                        {lav.forma_pagamento && (
                                            <span className="text-xs text-gray-500">
                                                — {lav.forma_pagamento.replace('_', ' ')}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        <strong>Data:</strong> {new Date(lav.data_lavagem).toLocaleString()}
                                    </p>
                                </div>

                                {/* 🔹 Botão / Status */}
                                <div className="flex items-center justify-end gap-3">
                                    {!lav.pago ? (
                                        <Button
                                            variant="secondary"
                                            icon={<CreditCard />}
                                            onClick={() => handleAbrirPagamento(lav)}
                                            className="whitespace-nowrap"
                                        >
                                            Marcar como Pago
                                        </Button>
                                    ) : (
                                        <span className="text-green-600 font-semibold flex items-center gap-1 whitespace-nowrap">
                                            <Wallet size={16} /> Pago
                                        </span>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* 🧾 Relatório de totais */}
                {Object.keys(relatorio).length > 0 && (
                    <div className="mt-8 bg-gray-50 border rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Resumo por tipo de lavagem</h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(relatorio).map(([tipo, total]) => (
                                <li
                                    key={tipo}
                                    className="flex justify-between bg-white border rounded-lg px-4 py-2 shadow-sm hover:shadow transition-all"
                                >
                                    <span className="capitalize text-gray-700 font-medium">{tipo}</span>
                                    <span className="font-semibold text-blue-700">{total}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-4 mt-6">
                        <Button
                            variant="secondary"
                            disabled={pagination.currentPage <= 1}
                            onClick={() => fetchLavacoes(pagination.currentPage - 1)}
                        >
                            ← Anterior
                        </Button>

                        <span className="text-gray-700">
                            Página {pagination.currentPage} de {pagination.totalPages}
                        </span>

                        <Button
                            variant="secondary"
                            disabled={pagination.currentPage >= pagination.totalPages}
                            onClick={() => fetchLavacoes(pagination.currentPage + 1)}
                        >
                            Próxima →
                        </Button>
                    </div>
                )}
            </Card>

            {/* 🧾 Modal de Cadastro */}
            <Modal isOpen={isModalCadastro} onClose={() => setIsModalCadastro(false)} title="Registrar Nova Lavagem">
                <div className="space-y-4">
                    <ReactSelect
                        placeholder="Tipo de veículo"
                        value={novoRegistro.tipo ? { value: novoRegistro.tipo, label: novoRegistro.tipo.toUpperCase() } : null}
                        onChange={(option) => handleChangeTipo(option?.value || '')}
                        options={Object.keys(precosPadrao).map((t) => ({ value: t, label: t.toUpperCase() }))}
                    />

                    <Input label="Placa" value={novoRegistro.placa} onChange={(e) => setNovoRegistro({ ...novoRegistro, placa: e.target.value.toUpperCase() })} />
                    <Input label="Carro (ex: Onix Azul)" value={novoRegistro.carro} onChange={(e) => setNovoRegistro({ ...novoRegistro, carro: e.target.value })} />
                    <Input label="Cliente" value={novoRegistro.cliente} onChange={(e) => setNovoRegistro({ ...novoRegistro, cliente: e.target.value })} />
                    <Input type="number" label="Valor (R$)" value={novoRegistro.valor} onChange={(e) => setNovoRegistro({ ...novoRegistro, valor: Number(e.target.value) })} />
                    <Input label="Observações" value={novoRegistro.observacoes} onChange={(e) => setNovoRegistro({ ...novoRegistro, observacoes: e.target.value })} />

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsModalCadastro(false)} icon={<X />}>Cancelar</Button>
                        <Button onClick={handleRegistrar} icon={<PlusCircle />}>Salvar</Button>
                    </div>
                </div>
            </Modal>

            {/* 💳 Modal de Pagamento */}
            <Modal isOpen={isModalPagamento} onClose={() => setIsModalPagamento(false)} title="Confirmar Pagamento">
                <div className="space-y-5">
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Forma de Pagamento *</label>
                        <select
                            value={pagamentoData.forma_pagamento}
                            onChange={(e) => setPagamentoData({ ...pagamentoData, forma_pagamento: e.target.value })}
                            className="border rounded-lg px-3 py-2 w-full"
                        >
                            <option value="">Selecione a forma de pagamento</option>
                            <option value="Cartão de Crédito">Cartão Crédito</option>
                            <option value="Cartão de Débito">Cartão Débito</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Pix">PIX</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="descontoGold"
                            checked={pagamentoData.descontoGold}
                            onChange={(e) => setPagamentoData({ ...pagamentoData, descontoGold: e.target.checked })}
                            className="w-5 h-5 accent-yellow-500"
                        />
                        <label htmlFor="descontoGold" className="text-gray-700 font-medium">
                            Desconto associado GOLD
                        </label>
                    </div>

                    {lavacaoSelecionada && (
                        <div className="bg-gray-50 p-3 rounded-lg border text-sm">
                            <p className="text-gray-600">
                                Valor original: <span className="font-semibold">R$ {lavacaoSelecionada.valor}</span>
                            </p>
                            {pagamentoData.descontoGold && (
                                <p className="text-green-600 font-semibold">
                                    Valor com desconto: R$ {(lavacaoSelecionada.valor - 10)}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsModalPagamento(false)} icon={<X />}>
                            Cancelar
                        </Button>
                        <Button onClick={handleConfirmarPagamento} icon={<Wallet />}>
                            Confirmar Pagamento
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Filtros */}
            <Modal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                title="Filtrar Lavagens"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data Início
                            </label>
                            <input
                                type="date"
                                value={filterInputs.dataInicio}
                                onChange={(e) => setFilterInputs({ ...filterInputs, dataInicio: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data Fim
                            </label>
                            <input
                                type="date"
                                value={filterInputs.dataFim}
                                onChange={(e) => setFilterInputs({ ...filterInputs, dataFim: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pago
                        </label>
                        <select
                            value={filterInputs.pago}
                            onChange={(e) => setFilterInputs({ ...filterInputs, pago: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos</option>
                            <option value="true">Sim</option>
                            <option value="false">Não</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Forma de Pagamento
                        </label>
                        <select
                            value={filterInputs.forma_pagamento}
                            onChange={(e) =>
                                setFilterInputs({ ...filterInputs, forma_pagamento: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todas</option>
                            <option value="Cartão de Crédito">Cartão Crédito</option>
                            <option value="Cartão de Débito">Cartão Débito</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Pix">PIX</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Desconto
                        </label>
                        <select
                            value={filterInputs.desconto}
                            onChange={(e) =>
                                setFilterInputs({ ...filterInputs, desconto: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos</option>
                            <option value="1">Com Desconto</option>
                            <option value="0">Sem Desconto</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button variant="secondary" onClick={() => setIsFilterOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleApplyFilters}>Aplicar Filtros</Button>
                    </div>
                </div>
            </Modal>


        </div>
    );
};

export default LavacaoPage;