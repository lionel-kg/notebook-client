'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type User } from './api';

/** Charge l'utilisateur connecté ; redirige vers /login si la session est absente ou expirée. */
export function useRequireUser() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .me()
      .then((r) => alive && setUser(r.user))
      .catch(() => router.replace('/login'));
    return () => {
      alive = false;
    };
  }, [router]);

  return user;
}
