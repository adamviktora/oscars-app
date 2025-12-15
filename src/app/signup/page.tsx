'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth-client';
import { GoogleSignInButton } from '@/components/google-sign-in-button';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const showMismatchWarning = confirmPassword.length > 0 && !passwordsMatch;
  const isFormValid = passwordsMatch && password.length > 0 && name.length > 0 && email.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordsMatch) {
      setError('Hesla se neshodují');
      return;
    }

    if (password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        if (result.error.message?.includes('already exists') || result.error.code === 'USER_ALREADY_EXISTS') {
          setError('Účet s tímto emailem již existuje');
        } else if (result.error.message?.includes('password')) {
          setError('Heslo nesplňuje požadavky');
        } else {
          setError(result.error.message || 'Registrace se nezdařila');
        }
        setIsLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Registrace se nezdařila. Zkuste to prosím znovu.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl mb-4">Registrace</h2>

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
              <label className="label" htmlFor="name">
                <span className="label-text">Jméno</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="input input-bordered w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
                minLength={8}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">Minimálně 8 znaků</span>
              </label>
            </div>
            <div className="form-control">
              <label className="label" htmlFor="confirmPassword">
                <span className="label-text">Heslo znovu</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`input input-bordered w-full ${
                  showMismatchWarning ? 'input-error' : ''
                }`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {showMismatchWarning && (
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
                <span>Hesla se neshodují</span>
              </div>
            )}

            <div className="form-control pt-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Registrace...
                  </>
                ) : (
                  'Registrovat se'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
