import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/constants';
import Link from 'next/link';
import { AdminDropdown } from '@/components/admin-dropdown';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to signin if not authenticated
  if (!session) {
    redirect('/signin');
  }

  // Redirect to home if not an admin
  if (!isAdmin(session.user.email)) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Admin Header */}
      <div className="bg-base-300 border-b border-base-content/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-xl">⚙️</span>
            <h2 className="font-semibold text-lg">Admin mód</h2>
            <nav className="flex items-center gap-2 ml-4 flex-wrap">
              <Link href="/admin/users" className="btn btn-ghost btn-sm">
                Uživatelé
              </Link>
              <AdminDropdown
                label="Zadat nominace"
                items={[
                  { href: '/admin/nominations', label: 'Nejlepší film', icon: '🎬' },
                  { href: '/admin/nominations2', label: 'Prenominační kolo 2.0', icon: '📋' },
                ]}
              />
            </nav>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="container mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
