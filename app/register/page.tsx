import { AuthForm } from '@/components/AuthForm';

export const metadata = { title: 'Créer un compte — Notre album' };

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
