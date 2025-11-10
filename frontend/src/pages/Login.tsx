// pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // seu api.ts axios

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data && data.token) {
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

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm p-6 border rounded">
        <h2 className="text-xl font-bold mb-4">Entrar</h2>
        {error && <div className="mb-3 text-red-600">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full mb-3 p-2 border rounded" />
          <label className="block mb-2">Senha</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="w-full mb-4 p-2 border rounded" />
          <button className="w-full p-2 bg-blue-600 text-white rounded" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
