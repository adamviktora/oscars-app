'use client';

import { signOut } from '@/lib/auth-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProfileDropdownProps {
  name: string;
  email: string;
}

export function ProfileDropdown({ name, email }: ProfileDropdownProps) {
  const router = useRouter();
  const initial = name?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || '?';

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-circle bg-gray-900 text-amber-400 hover:bg-gray-800 text-lg font-bold"
      >
        {initial}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-10 w-56 p-2 shadow-lg mt-2"
      >
        <li className="menu-title px-4 py-2">
          <div className="flex flex-col">
            <span className="font-semibold text-base-content">{name}</span>
            <span className="text-xs text-base-content/60">{email}</span>
          </div>
        </li>
        <div className="divider my-0"></div>
        <li>
          <Link href="/profile" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Profil
          </Link>
        </li>
        <li>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Odhlásit se
          </button>
        </li>
      </ul>
    </div>
  );
}

