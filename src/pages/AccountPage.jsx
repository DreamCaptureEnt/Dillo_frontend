import React, { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { KeyRound, LogIn, LogOut, UserPlus } from 'lucide-react';
import { useAuth } from '../auth';
import { LogoLoader } from '../components/Preloader';

export default function AccountPage() {
  const { user, loading, login, register, logout, requestPasswordReset, confirmPasswordReset } = useAuth();
  const [searchParams] = useSearchParams();
  const resetUid = searchParams.get('uid') || '';
  const resetToken = searchParams.get('token') || '';
  const [mode, setMode] = useState(resetUid && resetToken ? 'reset-confirm' : 'login');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    identifier: '',
    username: '',
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    password: '',
    confirm_password: '',
  });

  if (loading) return <LogoLoader size="md" label="Loading account..." className="min-h-[45vh]" />;

  if (user?.is_staff) return <Navigate to="/admin" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      if (mode === 'login') {
        await login(form.identifier, form.password);
      } else if (mode === 'register') {
        await register({
          username: form.username,
          email: form.email,
          phone: form.phone,
          first_name: form.first_name,
          last_name: form.last_name,
          password: form.password,
        });
      } else if (mode === 'forgot') {
        const data = await requestPasswordReset(form.identifier);
        setMessage(data.detail || 'Password reset instructions have been sent if the account exists.');
      } else if (mode === 'reset-confirm') {
        if (form.password !== form.confirm_password) {
          setError('Passwords do not match.');
          return;
        }
        const data = await confirmPasswordReset({ uid: resetUid, token: resetToken, password: form.password });
        setMessage(data.detail || 'Password has been reset. You can login now.');
        setForm(f => ({ ...f, password: '', confirm_password: '' }));
        setMode('login');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (user) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-dillo-charcoal">My Account</h1>
        <div className="mt-6 bg-white border border-gray-100 p-6">
          <p className="font-body text-gray-500">Signed in as</p>
          <p className="font-body text-xl font-bold text-dillo-charcoal mt-1">{user.username}</p>
          <p className="font-body text-sm text-gray-500 mt-1">{user.email || 'No email added'}</p>
          <p className="font-body text-sm text-gray-500 mt-1">{user.phone || 'No phone added'}</p>
          <button onClick={logout} className="btn-outline mt-6 inline-flex items-center gap-2">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-dillo-ivory px-4 py-16">
      <div className="max-w-md mx-auto bg-white border border-gray-100 p-6 md:p-8">
        {mode !== 'forgot' && mode !== 'reset-confirm' && (
        <div className="flex border border-gray-200 mb-6">
          {['login', 'register'].map(value => (
            <button
              key={value}
              onClick={() => { setMode(value); setError(''); setMessage(''); }}
              className={`flex-1 py-2 text-sm font-body font-semibold capitalize ${mode === value ? 'bg-dillo-red text-white' : 'text-gray-500'}`}
            >
              {value}
            </button>
          ))}
        </div>
        )}
        <h1 className="font-display text-2xl font-bold text-dillo-charcoal mb-5">
          {mode === 'login' && 'Login'}
          {mode === 'register' && 'Create Account'}
          {mode === 'forgot' && 'Forgot Password'}
          {mode === 'reset-confirm' && 'Reset Password'}
        </h1>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'login' && (
            <input
              className="input-field"
              placeholder="Username, email, or phone"
              value={form.identifier}
              onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
              required
            />
          )}
          {mode === 'register' && (
            <>
              <input
                className="input-field"
                placeholder="Username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
              />
              <input className="input-field" placeholder="Email" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              <input className="input-field" placeholder="Phone number" type="tel" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder="First name" value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                <input className="input-field" placeholder="Last name" value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
              </div>
            </>
          )}
          {mode === 'forgot' && (
            <input
              className="input-field"
              placeholder="Username, email, or phone"
              value={form.identifier}
              onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
              required
            />
          )}
          {mode !== 'forgot' && (
            <input
              className="input-field"
              placeholder={mode === 'reset-confirm' ? 'New password' : 'Password'}
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          )}
          {mode === 'reset-confirm' && (
            <input
              className="input-field"
              placeholder="Confirm new password"
              type="password"
              value={form.confirm_password}
              onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
              required
            />
          )}
          {error && <p className="font-body text-sm text-red-600">{error}</p>}
          {message && <p className="font-body text-sm text-green-700 bg-green-50 border border-green-100 px-3 py-2">{message}</p>}
          <button className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {mode === 'login' && <LogIn size={16} />}
            {mode === 'register' && <UserPlus size={16} />}
            {(mode === 'forgot' || mode === 'reset-confirm') && <KeyRound size={16} />}
            {mode === 'login' && 'Login'}
            {mode === 'register' && 'Register'}
            {mode === 'forgot' && 'Send Reset Link'}
            {mode === 'reset-confirm' && 'Reset Password'}
          </button>
          {mode === 'login' && (
            <button type="button" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
              className="w-full font-body text-sm text-dillo-red hover:underline">
              Forgot password?
            </button>
          )}
          {(mode === 'forgot' || mode === 'reset-confirm') && (
            <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className="w-full font-body text-sm text-gray-500 hover:text-dillo-red">
              Back to login
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
