'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { GoogleSignInButton } from '@/components/google-sign-in-button';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        if (result.error.message?.includes('Invalid') || result.error.code === 'INVALID_EMAIL_OR_PASSWORD') {
          setError('Nesprávný email nebo heslo');
        } else if (result.error.message?.includes('not found')) {
          setError('Účet s tímto emailem neexistuje');
        } else {
          setError(result.error.message || 'Přihlášení se nezdařilo');
        }
        setIsLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Přihlášení se nezdařilo. Zkontrolujte své přihlašovací údaje.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl mb-4">Přihlášení</h2>

          <GoogleSignInButton />

          <div className="divider">NEBO</div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="alert alert-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="form-control">
              <label className="label" htmlFor="email">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label" htmlFor="password">
                <span className="label-text">Heslo</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-control pt-2">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Přihlašování...
                  </>
                ) : (
                  'Přihlásit se'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
