// services/UserService.js
import bcrypt from 'bcryptjs';
import db from '../database/database.js';

export default {
  async createUser(nome, email, password, role = 'normal') {
    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return { success: false, message: 'Esse e-mail já está cadastrado.' };

    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (nome, email, password_hash, role, ativo) VALUES (?, ?, ?, ?, 1)', [
      nome,
      email,
      hash,
      role
    ]);

    return { success: true, message: 'Usuário criado com sucesso.' };
  },

  async changePassword(id, oldPassword, newPassword) {
    const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [id]);
    if (!users.length) return { success: false, message: 'Usuário não encontrado.' };

    const user = users[0];

    const valid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!valid) return { success: false, message: 'Senha antiga incorreta.' };

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, id]);

    return { success: true, message: 'Senha alterada com sucesso.' };
  },


  async deactivateUser(id, ativo) {
    await db.query('UPDATE users SET ativo = ? WHERE id = ?', [ativo, id]);

    if (ativo == 1) return { success: true, message: 'Usuário reativado com sucesso.' };

    return { success: true, message: 'Usuário inativado com sucesso.' };
  },

  async listUsers({ page = 1, limit = 10, search = '', ativo = '', role = '' }) {
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';

    if (search) {
      where += ' AND (nome LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (ativo !== '' && (ativo === '0' || ativo === '1' || ativo === 0 || ativo === 1)) {
      where += ' AND ativo = ?';
      params.push(Number(ativo));
    }

    if (role) {
      where += ' AND role = ?';
      params.push(role);
    }

    const [rows] = await db.query(
      `SELECT id, nome, email, role, ativo 
       FROM users 
       ${where} 
       ORDER BY nome ASC 
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [countRows] = await db.query(`SELECT COUNT(*) as total FROM users ${where}`, params);
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message: 'Lista de usuários obtida com sucesso.',
      pagination: {
        total,
        totalPages,
        currentPage: Number(page),
        perPage: Number(limit)
      },
      result: rows
    };
  }
};
