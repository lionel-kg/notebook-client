'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLogin && password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas');
      return;
    }
    setBusy(true);
    try {
      if (isLogin) await api.login(username, password);
      else await api.register(username, password);
      router.replace('/albums');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de joindre le serveur');
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <div className="auth-brand">
        <span className="serif">Notre album</span>
        <span className="hand">photos, stickers &amp; mots doux</span>
      </div>
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>{isLogin ? 'Se connecter' : 'Créer un compte'}</h1>

        <div className="field">
          <label htmlFor="username">Nom d&apos;utilisateur</label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            minLength={3}
            maxLength={32}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {!isLogin && <small>3 à 32 caractères : lettres, chiffres, _ . -</small>}
        </div>

        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            required
            minLength={isLogin ? 1 : 8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {!isLogin && <small>8 caractères minimum</small>}
        </div>

        {!isLogin && (
          <div className="field">
            <label htmlFor="confirm">Confirme le mot de passe</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="big" disabled={busy || !username || !password}>
          {busy ? 'Un instant…' : isLogin ? 'Se connecter' : 'Créer mon compte'}
        </button>

        <p className="auth-switch">
          {isLogin ? (
            <>
              Pas encore de compte ? <Link href="/register">Créer un compte</Link>
            </>
          ) : (
            <>
              Déjà inscrit·e ? <Link href="/login">Se connecter</Link>
            </>
          )}
        </p>
      </form>
    </main>
  );
}
