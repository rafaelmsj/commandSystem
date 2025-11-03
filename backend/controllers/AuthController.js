// controllers/AuthController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import db from '../database/database.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export default {
    validateRegistration: [
        body('email').isEmail().withMessage('Email inválido'),
        body('password').isLength({ min: 6 }).withMessage('Senha mínimo 6 caracteres'),
    ],

    async register(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

            const { nome, email, password } = req.body;
            // verificar se email já existe
            const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (exists.length) return res.status(400).json({ success: false, message: 'Email já cadastrado' });

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            const [result] = await db.query('INSERT INTO users (nome, email, password_hash) VALUES (?, ?, ?)', [nome, email, hash]);
            const userId = result.insertId;

            const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            return res.json({ success: true, message: 'Usuário criado', result: { id: userId, nome, email }, token });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Erro no servidor' });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const [rows] = await db.query('SELECT id, nome, email, password_hash, role, ativo FROM users WHERE email = ?', [email]);
            const user = rows[0];
            if (!user) return res.status(400).json({ success: false, message: 'Credenciais inválidas' });
            if (!user.ativo) return res.status(403).json({ success: false, message: 'Usuário inativo' });

            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) return res.status(400).json({ success: false, message: 'Credenciais inválidas' });

            const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            // não enviar password_hash
            delete user.password_hash;
            return res.json({ success: true, message: 'Login ok', result: { user }, token });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Erro no servidor' });
        }
    }
};
