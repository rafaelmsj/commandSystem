import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Shield, ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import api from '../services/api';

export default function UsuariosCriar() {
  const navigate = useNavigate();
  const messageRef = React.useRef<HTMLDivElement | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [role, setRole] = useState<'administrador' | 'normal'>('normal');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'administrador') {
      navigate('/usuarios/alterar-senha');
    }
  }, [navigate, user.role]);

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

    setTimeout(() => {
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageRef.current?.focus();
    }, 50);
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

    if (senha !== confirmarSenha) {
      showMessage('As senhas não coincidem', 'error');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/usuarios', { nome, email, password: senha, role });
      showMessage(data.message, data.success ? 'success' : 'error');
      setNome('');
      setEmail('');
      setSenha('');
      setConfirmarSenha('');
      setRole('normal');
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Erro ao criar usuário.', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (user.role !== 'administrador') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="secondary"
          onClick={() => navigate('/usuarios')}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Criar Usuário</h1>
          <p className="text-sm text-gray-600">
            Adicione um novo usuário ao sistema
          </p>
        </div>
      </div>

      {message && (
        <div
          ref={messageRef}
          tabIndex={-1}
          className={`p-4 rounded-md outline-none ${messageType === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
            }`}
        >
          {message}
        </div>
      )}

      <Card>
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0 p-3 rounded-md bg-blue-50">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Novo Usuário</h3>
            <p className="text-sm text-gray-600">
              Preencha os dados do novo usuário
            </p>
          </div>
        </div>

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
                type={showSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md 
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite a senha"
              />

              {/* Botão mostrar/ocultar */}
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showSenha ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Mínimo 8 caracteres, 1 maiúscula, 1 minúscula e 1 número
            </p>
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

              <input
                type={showConfirmarSenha ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 ${confirmarSenha && senha !== confirmarSenha
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
                  }`}
                placeholder="Confirme a senha"
              />

              {/* Botão visualizar senha */}
              <button
                type="button"
                onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmarSenha ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {confirmarSenha && senha !== confirmarSenha && (
              <p className="mt-1 text-xs text-red-600">As senhas não coincidem</p>
            )}
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
              onClick={() => navigate('/usuarios')}
            >
              Cancelar
            </Button>
            <Button
              onClick={criarUsuario}
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}