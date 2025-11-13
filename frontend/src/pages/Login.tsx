import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ReCAPTCHA from 'react-google-recaptcha';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();

  // ------ validação de e-mail ------
  function isValidEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // validação
    if (!isValidEmail(email)) {
      setError('Informe um e-mail válido');
      return;
    }

    if (!recaptchaToken) {
      setError('Confirme que você não é um robô.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
        recaptcha: recaptchaToken,
      });

      if (data?.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.result.user || {}));
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

        setTimeout(() => navigate('/'), 100);
      } else {
        setError('Resposta inesperada do servidor');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao conectar');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setForgotLoading(true);
    setForgotMsg('');

    if (!isValidEmail(forgotEmail)) {
      setForgotMsg('Informe um e-mail válido.');
      setForgotLoading(false);
      return;
    }

    try {
      const { data } = await api.post('/auth/forgot-password', {
        email: forgotEmail,
      });

      setForgotMsg(data.message);
    } catch {
      setForgotMsg('Erro ao solicitar nova senha.');
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      {/* ==== CARD ==== */}
      <div className="w-full max-w-sm p-6 bg-white border rounded shadow">
        <h2 className="text-xl font-bold mb-4">Entrar</h2>

        {error && <div className="mb-3 text-red-600">{error}</div>}
        {success && <div className="mb-3 text-green-600">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* E-mail */}
          <label className="block mb-2">Email</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            className="w-full mb-3 p-2 border rounded"
          />

          {/* Senha */}
          <label className="block mb-2">Senha</label>
          <div className="relative mb-4">
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPass ? 'text' : 'password'}
              className="w-full p-2 border rounded pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-2 top-2 text-gray-600"
            >
              {showPass ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>

          {/* reCAPTCHA */}
          <div className="mb-4 flex justify-center">
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(token) => setRecaptchaToken(token)}
            />
          </div>

          <button
            className="w-full p-2 bg-blue-600 text-white rounded mb-3"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Esqueci senha */}
        <button
          onClick={() => setForgotOpen(true)}
          className="text-sm text-blue-600 hover:underline w-full text-center mt-2"
        >
          Esqueci minha senha
        </button>
      </div>

      {/* ==== MODAL ESQUECI SENHA ==== */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-sm p-6 rounded shadow-md">

            <h3 className="text-lg font-bold mb-3">Recuperar senha</h3>

            <label className="block mb-2">Informe seu e-mail</label>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full p-2 border rounded mb-3"
            />

            {forgotMsg && (
              <p className="mb-3 text-blue-600">{forgotMsg}</p>
            )}

            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => {
                  setForgotMsg('');
                  setForgotOpen(false);
                }}
              >
                Fechar
              </button>

              <button
                onClick={handleForgotPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded"
                disabled={forgotLoading}
              >
                {forgotLoading ? 'Enviando...' : 'Enviar nova senha'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
