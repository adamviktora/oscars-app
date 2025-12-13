import { headers } from 'next/headers';
import { auth } from '@/app/lib/auth';
import Link from 'next/link';
import { ProfileDropdown } from './profile-dropdown';

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="bg-gradient-to-r from-amber-400 to-yellow-500 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              🏆 Oscars Predictions 2026
            </h1>
          </Link>

          <div className="flex items-center gap-3">
            {session ? (
              <ProfileDropdown
                name={session.user.name}
                email={session.user.email}
              />
            ) : (
              <>
                <Link href="/signin" className="btn btn-ghost btn-sm text-gray-900">
                  Sign in
                </Link>
                <Link href="/signup" className="btn btn-sm bg-gray-900 text-amber-400 hover:bg-gray-800">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

