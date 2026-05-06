import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, signup } from '../api';
import { Alert, FormGroup } from '../components/UI';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const isLogin = mode === 'login';

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Email and password are required.'); return; }
    if (!isLogin && !form.name) { setError('Name is required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      const res = isLogin
        ? await login(form.email, form.password)
        : await signup(form.name, form.email, form.password, form.role);

      loginUser(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Check your API URL in src/api/index.js');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">TaskFlow</div>
        <h1 className="auth-title">{isLogin ? 'Welcome back' : 'Create account'}</h1>
        <p className="auth-sub">{isLogin ? 'Sign in to your workspace' : 'Join your team on TaskFlow'}</p>

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <FormGroup label="Full Name">
              <input
                name="name"
                className="form-control"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
              />
            </FormGroup>
          )}
          <FormGroup label="Email">
            <input
              name="email"
              type="email"
              className="form-control"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </FormGroup>
          <FormGroup label="Password">
            <input
              name="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </FormGroup>
          {!isLogin && (
            <FormGroup label="Role">
              <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </FormGroup>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <a onClick={() => { setMode(isLogin ? 'signup' : 'login'); setError(''); }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </a>
        </div>

        {isLogin && (
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text2)' }}>
            <strong>Note:</strong> First registered user becomes Admin automatically.
          </div>
        )}
      </div>
    </div>
  );
}
