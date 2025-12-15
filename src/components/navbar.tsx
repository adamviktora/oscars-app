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
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <SidebarMenu />
            <Link href="/" className="min-w-0">
              <h1 className="text-base sm:text-xl md:text-3xl font-bold text-gray-900 truncate">
                <span className="hidden sm:inline">🏆 Oscars predictions 2026</span>
                <span className="sm:hidden">🏆 Oscars 2026</span>
              </h1>
            </Link>
          </div>

          {/* Right side: Auth */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {session ? (
              <ProfileDropdown
                name={session.user.name}
                email={session.user.email}
              />
            ) : (
              <>
                <Link href="/signin" className="btn btn-ghost btn-xs sm:btn-sm text-gray-900 hover:bg-amber-300 hover:text-gray-900">
                  <span className="hidden sm:inline">Přihlásit se</span>
                  <span className="sm:hidden">Přihlásit</span>
                </Link>
                <Link href="/signup" className="btn btn-xs sm:btn-sm bg-gray-900 text-amber-400 hover:bg-gray-800">
                  <span className="hidden sm:inline">Registrovat se</span>
                  <span className="sm:hidden">Registrace</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

