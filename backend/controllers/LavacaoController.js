import db from '../database/database.js';

class LavacaoController {
    async registrar(req, res) {
        try {
            const { tipo, valor, pago, forma_pagamento, observacoes, placa, carro, cliente } = req.body;
            await db.execute(
                `INSERT INTO lavacoes 
         (tipo, valor, pago, forma_pagamento, observacoes, placa, carro, cliente)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [tipo, valor, pago || false, forma_pagamento || null, observacoes || null, placa || null, carro || null, cliente || null]
            );
            res.status(201).json({ success: true, message: 'Lavagem registrada com sucesso!' });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Erro ao registrar lavagem.', error: err.message });
        }
    }

    async listar(req, res) {
        try {
            const { page = 1, limit = 10, pago, forma_pagamento, dataInicio, dataFim, desconto } = req.query;
            const offset = (page - 1) * limit;

            let where = 'WHERE 1=1';
            const params = [];

            if (pago === 'true' || pago === 'false') {
                where += ' AND pago = ?';
                params.push(pago === 'true');
            }

            if (forma_pagamento) {
                where += ' AND forma_pagamento = ?';
                params.push(forma_pagamento);
            }

            if (desconto) {
                where += ' AND desconto = ?';
                params.push(desconto);
            }

            if (dataInicio) {
                where += ' AND DATE(data_lavagem) >= ?';
                params.push(dataInicio);
            }

            if (dataFim) {
                where += ' AND DATE(data_lavagem) <= ?';
                params.push(dataFim);
            }

            const [rows] = await db.query(
                `SELECT * FROM lavacoes ${where} ORDER BY data_lavagem DESC LIMIT ? OFFSET ?`,
                [...params, Number(limit), Number(offset)]
            );

            const [countResult] = await db.query(`SELECT COUNT(*) as total FROM lavacoes ${where}`, params);

            res.status(200).json({
                success: true,
                lavacoes: rows,
                pagination: {
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit),
                    currentPage: Number(page),
                },
            });
        } catch (err) {
	    console.log(err)
            res.status(500).json({ success: false, message: 'Erro ao listar lavagens.', error: err.message });
        }
    }

    async atualizar(req, res) {
        try {
            const { id } = req.params;
            const { pago, forma_pagamento, valor, desconto } = req.body;

            await db.execute(
                `UPDATE lavacoes SET pago = ?, forma_pagamento = ?, valor = ?, desconto = ? WHERE id = ?`,
                [pago, forma_pagamento, valor, desconto || 0, id]
            );

            res.status(200).json({ success: true, message: 'Lavagem atualizada com sucesso!' });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Erro ao atualizar lavagem.', error: err.message });
        }
    }


    async relatorio(req, res) {
        try {
            const { dataInicio, dataFim, desconto } = req.query;

            let where = 'WHERE 1=1';
            const params = [];

            // filtros opcionais
            if (dataInicio) {
                where += ' AND DATE(data_lavagem) >= ?';
                params.push(dataInicio);
            }

            if (dataFim) {
                where += ' AND DATE(data_lavagem) <= ?';
                params.push(dataFim);
            }

            if (desconto) {
                where += ' AND desconto <= ?';
                params.push(desconto);
            }

            // resumo diário
            const [rows] = await db.execute(`
            SELECT 
                DATE(data_lavagem) AS data,
                COUNT(*) AS total_lavagens,
                desconto,
                SUM(CASE WHEN pago = 1 THEN valor ELSE 0 END) AS total_pago,
                SUM(CASE WHEN pago = 0 THEN valor ELSE 0 END) AS total_pendente
            FROM lavacoes
            ${where}
            GROUP BY DATE(data_lavagem)
            ORDER BY DATE(data_lavagem) ASC
            `, params);

            // resumo geral
            const [resumo] = await db.execute(`
            SELECT 
                COUNT(*) AS total_geral,
                SUM(valor) AS valor_total,
                SUM(CASE WHEN pago = 1 THEN valor ELSE 0 END) AS valor_pago,
                SUM(CASE WHEN pago = 0 THEN valor ELSE 0 END) AS valor_pendente
            FROM lavacoes
            ${where}
            `, params);

            res.status(200).json({ success: true, message: 'Relatório gerado com sucesso.', relatorio: rows, resumo: resumo[0] });
        } catch (err) {
            console.error('Erro ao gerar relatório:', err);
            res.status(500).json({ success: false, message: 'Erro ao gerar relatório de lavação.', error: err.message, });
        }
    }

    async resumoDia(req, res) {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    COUNT(*) AS total_lavagens,
                    SUM(CASE WHEN pago = 1 THEN valor ELSE 0 END) AS total_pago,
                    SUM(CASE WHEN pago = 0 THEN valor ELSE 0 END) AS total_pendente
                FROM lavacoes
                WHERE DATE(data_lavagem) = CURDATE()
                `);

            const resumo = rows[0] || { total_lavagens: 0, total_pago: 0, total_pendente: 0 };

            res.status(200).json({ success: true, message: 'Resumo diário carregado com sucesso.', resumo });
        } catch (err) {
            console.error('Erro ao gerar resumo do dia:', err);
            res.status(500).json({ success: false, message: 'Erro ao gerar resumo diário.', error: err.message });
        }
    }

    async resumoAbertas(req, res) {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    COUNT(*) AS total_abertas,
                    SUM(valor) AS valor_aberto
                FROM lavacoes
                WHERE pago = 0
                `);

            const resumo = rows[0] || { total_abertas: 0, valor_aberto: 0 };

            res.status(200).json({ success: true, message: 'Resumo de lavações em aberto carregado com sucesso.', resumo, });
        } catch (err) {
            console.error('Erro ao gerar resumo de lavações abertas:', err);
            res.status(500).json({ success: false, message: 'Erro ao gerar resumo de lavações abertas.', error: err.message, });
        }
    }

    async lavacoesAntigas(req, res) {
        try {
            const [rows] = await db.execute(`
      SELECT 
        id,
        cliente,
        carro,
        placa,
        valor,
        DATE_FORMAT(data_lavagem, '%d/%m/%Y %H:%i:%s') AS data_lavagem
      FROM lavacoes
      WHERE pago = 0
      ORDER BY data_lavagem ASC
      LIMIT 5
    `);

            res.status(200).json({ success: true, message: 'Lavações mais antigas carregadas com sucesso.', lavacoes: rows, });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Erro ao listar lavações antigas.', error: err.message, });
        }
    }



}

export default new LavacaoController();
