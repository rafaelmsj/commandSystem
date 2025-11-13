import React, { useState, useRef, useEffect } from 'react';
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import api from '../services/api';

export default function UsuariosAlterarSenha() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);

  const messageRef = useRef<HTMLDivElement | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasMinLength && hasUpper && hasLower && hasNumber;
  };

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);

    setTimeout(() => {
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageRef.current?.focus();
    }, 80);
  };

  async function alterarSenha() {
    // Validar senha atual (para todos)
    if (!oldPassword.trim()) {
      showMessage('Senha atual é obrigatória', 'error');
      return;
    }

    // Validar nova senha
    if (!validatePassword(newPassword)) {
      showMessage(
        'Nova senha deve ter 8 caracteres, 1 maiúscula, 1 minúscula e 1 número',
        'error'
      );
      return;
    }

    // Verificar se coincide
    if (newPassword !== confirmNewPassword) {
      showMessage('As senhas não coincidem', 'error');
      return;
    }

    setLoading(true);
    try {
      const body = { oldPassword, newPassword };

      const { data } = await api.put('/usuarios/senha', body);

      showMessage(data.message, data.success ? 'success' : 'error');

      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      showMessage(
        err.response?.data?.message || 'Erro ao alterar senha',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alterar Senha</h1>
          <p className="text-sm text-gray-600">
            Altere sua senha com segurança
          </p>
        </div>
      </div>

      {message && (
        <div
          ref={messageRef}
          tabIndex={-1}
          className={`p-4 rounded-md outline-none ${
            messageType === 'success'
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
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Alterar Senha</h3>
            <p className="text-sm text-gray-600">Preencha os campos abaixo</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Senha Atual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha Atual
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite sua senha atual"
              />

              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showOld ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Nova Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite a nova senha"
              />

              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Mínimo 8 caracteres, 1 maiúscula, 1 minúscula e 1 número
            </p>
          </div>

          {/* Confirmar Nova Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  confirmNewPassword && confirmNewPassword !== newPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Confirme a nova senha"
              />

              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showConfirm ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {confirmNewPassword && confirmNewPassword !== newPassword && (
              <p className="mt-1 text-xs text-red-600">As senhas não coincidem</p>
            )}
          </div>

          {/* Botão */}
          <div className="flex justify-end pt-4">
            <Button onClick={alterarSenha} variant="success" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
