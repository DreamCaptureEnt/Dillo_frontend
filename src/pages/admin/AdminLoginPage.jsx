import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../../auth';

export default function AdminLoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  if (user?.is_staff) return <Navigate to="/admin" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const loggedIn = await login(form.username, form.password);
      if (!loggedIn.is_staff) {
        setError('This account does not have admin access.');
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[70vh] bg-dillo-ivory flex items-center justify-center px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-sm bg-white border border-gray-100 p-7">
        <div className="w-11 h-11 bg-dillo-red text-white flex items-center justify-center mb-5">
          <Lock size={20} />
        </div>
        <h1 className="font-display text-2xl font-bold text-dillo-charcoal">Admin Login</h1>
        <p className="font-body text-sm text-gray-500 mt-1 mb-6">Sign in with a staff account.</p>
        <div className="space-y-4">
          <input className="input-field" placeholder="Username" value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
          <input className="input-field" placeholder="Password" type="password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          {error && <p className="font-body text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full py-3">Login</button>
        </div>
      </form>
    </div>
  );
}
