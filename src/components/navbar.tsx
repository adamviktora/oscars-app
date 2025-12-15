import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { ProfileDropdown } from './profile-dropdown';
import { SidebarMenu } from './sidebar-menu';

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="bg-linear-to-r from-amber-400 to-yellow-500 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side: Hamburger + Logo */}
          <div className="flex items-center gap-2">
            <SidebarMenu />
            <Link href="/">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                🏆 Oscars predictions 2026
              </h1>
            </Link>
          </div>

          {/* Right side: Auth */}
          <div className="flex items-center gap-3">
            {session ? (
              <ProfileDropdown
                name={session.user.name}
                email={session.user.email}
              />
            ) : (
              <>
                <Link href="/signin" className="btn btn-ghost btn-sm text-gray-900 hover:bg-amber-300 hover:text-gray-900">
                  Přihlásit se
                </Link>
                <Link href="/signup" className="btn btn-sm bg-gray-900 text-amber-400 hover:bg-gray-800">
                  Registrovat se
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

