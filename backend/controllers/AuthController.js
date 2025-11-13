import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import db from '../database/database.js';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export default {
    validateRegistration: [
        body('email').isEmail().withMessage('Email inválido'),
        body('password').isLength({ min: 6 }).withMessage('Senha mínimo 6 caracteres'),
    ],

    async login(req, res) {
        try {
            const { email, password } = req.body;

            const [rows] = await db.query(
                'SELECT id, nome, email, password_hash, role, ativo FROM users WHERE email = ?',
                [email]
            );

            const user = rows[0];
            if (!user) return res.status(400).json({ success: false, message: 'Credenciais inválidas' });
            if (!user.ativo) return res.status(403).json({ success: false, message: 'Usuário inativo' });

            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) return res.status(400).json({ success: false, message: 'Credenciais inválidas' });

            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            delete user.password_hash;

            return res.json({ success: true, message: 'Login ok', result: { user }, token });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Erro no servidor' });
        }
    },

    // ===================================================
    // 🆕 ESQUECI MINHA SENHA
    // ===================================================
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            // Busca usuário
            const [rows] = await db.query('SELECT id, nome, email FROM users WHERE email = ?', [email]);
            const user = rows[0];

            if (!user)
                return res.status(200).json({
                    success: true,
                    message: 'Se o e-mail existir, enviaremos uma nova senha'
                });

            // Gera nova senha (8 caracteres)
            const novaSenha = Math.random().toString(36).slice(-8);

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(novaSenha, salt);

            await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);

            // === Enviar e-mail ===
            const transporter = nodemailer.createTransport({
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT,
                secure: false,
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                }
            });

            transporter.sendMail({
                from: `"CommandSystem" <${process.env.MAIL_USER}>`,
                to: user.email,
                subject: 'Nova senha de acesso',
                html: `
                    <h3>Olá ${user.nome},</h3>
                    <p>Sua nova senha foi gerada:</p>
                    <h2>${novaSenha}</h2>
                    <p>Recomendamos alterar após o login.</p>
                `
            });

            return res.json({
                success: true,
                message: 'Se o e-mail existir, enviaremos uma nova senha'
            });

        } catch (err) {
            console.log(err);
            return res.status(500).json({ success: false, message: 'Erro ao enviar nova senha' });
        }
    }
};
