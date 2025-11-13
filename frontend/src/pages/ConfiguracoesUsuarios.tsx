import React, { useState } from 'react';
import { User, Lock, Mail, Shield, UserPlus } from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import Modal from '../components/UI/Modal';
import api from '../services/api';

export default function ConfiguracoesUsuarios() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<'administrador' | 'normal'>('normal');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  };

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  async function criarUsuario() {
    if (!nome.trim()) {
      showMessage('Nome é obrigatório', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showMessage('Email inválido', 'error');
      return;
    }

    if (!validatePassword(senha)) {
      showMessage('Senha deve ter pelo menos 8 caracteres, 1 letra maiúscula, 1 minúscula e 1 número', 'error');
      return;
    }

    try {
      const { data } = await api.post('/usuarios', { nome, email, password: senha, role });
      showMessage(data.message, 'success');
      setNome('');
      setEmail('');
      setSenha('');
      setRole('normal');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Erro ao criar usuário.', 'error');
    }
  }

  async function alterarSenha() {
    if (!validatePassword(newPassword)) {
      showMessage('Nova senha deve ter pelo menos 8 caracteres, 1 letra maiúscula, 1 minúscula e 1 número', 'error');
      return;
    }

    if (user.role !== 'administrador' && !oldPassword.trim()) {
      showMessage('Senha atual é obrigatória', 'error');
      return;
    }

    try {
      const body =
        user.role === 'administrador'
          ? { id: user.id, newPassword }
          : { oldPassword, newPassword };

      const { data } = await api.put('/usuarios/senha', body);
      showMessage(data.message, 'success');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Erro ao alterar senha.', 'error');
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações de Usuários</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie usuários e altere sua senha
          </p>
        </div>
        {user.role === 'administrador' && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Criar Usuário
          </Button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          messageType === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Alterar Senha */}
      <Card>
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0 p-3 rounded-md bg-blue-50">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Alterar Senha</h3>
            <p className="text-sm text-gray-600">
              {user.role === 'administrador' 
                ? 'Como administrador, você pode alterar sua senha diretamente'
                : 'Digite sua senha atual e a nova senha'
              }
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {user.role !== 'administrador' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha Atual
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite sua senha atual"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite a nova senha"
            />
            <p className="mt-1 text-xs text-gray-500">
              Mínimo 8 caracteres, 1 maiúscula, 1 minúscula e 1 número
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={alterarSenha} variant="success">
              <Lock className="h-4 w-4 mr-2" />
              Alterar Senha
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal Criar Usuário */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Criar Novo Usuário"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o nome completo"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite a senha"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Mínimo 8 caracteres, 1 maiúscula, 1 minúscula e 1 número
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Usuário
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'administrador' | 'normal')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Usuário Normal</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={criarUsuario}>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Usuário
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}