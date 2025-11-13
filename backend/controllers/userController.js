
import bcrypt from 'bcryptjs';
import UserService from '../services/UserService.js';

export default {
  // 🔹 Criar usuário (apenas admin pode)
  async create(req, res) {
    try {
      const { nome, email, password, role } = req.body;
      const userRole = req.user?.role;

      if (userRole !== 'administrador')
        return res.status(403).json({ success: false, message: 'Apenas administradores podem criar usuários.' });

      const result = await UserService.createUser(nome, email, password, role);
      res.json(result);
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
  },

  // 🔹 Alterar senha (própria ou de outro usuário se for admin)
  async changePassword(req, res) {
    try {
      const { userId } = req.user;
      const { oldPassword, newPassword } = req.body;

      const result = await UserService.changePassword(userId, oldPassword, newPassword, false);

      res.json(result);
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
  },

  // 🔹 Inativar usuário (apenas admin)
  async deactivate(req, res) {
    try {
      const { id } = req.params;
      const { ativo } = req.body
      const userRole = req.user?.role;

      if (id == 1) return res.status(403).json({ success: false, message: 'Não é possível inativar esse usuário.' });

      if (userRole !== 'administrador') return res.status(403).json({ success: false, message: 'Apenas administradores podem inativar usuários.' });

      const result = await UserService.deactivateUser(id, ativo);
      res.json(result);
    } catch (err) {
      console.error('Erro ao inativar usuário:', err);
      res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
  },

  async list(req, res) {
    try {
      if (req.user.role !== 'administrador')
        return res.status(403).json({ success: false, message: 'Acesso negado.' });

      const { page = 1, limit = 10, search = '', ativo = '', role = '' } = req.query;

      const result = await UserService.listUsers({ page, limit, search, ativo, role });
      res.json(result);
    } catch (err) {
      console.error('Erro ao listar usuários:', err);
      res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
  }
};
