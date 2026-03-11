import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function VysledkyLayout({
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

  return (
    <div className="min-h-screen bg-base-200">
      {/* Results Header */}
      <div className="bg-base-300 border-b border-base-content/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-xl">📊</span>
            <h2 className="font-semibold text-lg">Výsledky</h2>
            <nav className="flex items-center gap-2 ml-4 flex-wrap">
              {/* Nomination round group */}
              <div className="flex items-center gap-1 bg-base-200 rounded-lg px-2 py-1">
                <span className="text-xs text-base-content/50 mr-1">Nominační:</span>
                <Link href="/vysledky/nominations" className="btn btn-ghost btn-xs">
                  Tipy účastníků
                </Link>
                <Link href="/vysledky/nomination-stats" className="btn btn-ghost btn-xs">
                  Statistiky
                </Link>
              </div>

              {/* Prenom 1 group */}
              <div className="flex items-center gap-1 bg-base-200 rounded-lg px-2 py-1">
                <span className="text-xs text-base-content/50 mr-1">Prenominační:</span>
                <Link href="/vysledky/prenom1" className="btn btn-ghost btn-xs">
                  Tipy účastníků
                </Link>
                <Link href="/vysledky/prenom1-preferences" className="btn btn-ghost btn-xs">
                  Preference filmů
                </Link>
                <Link href="/vysledky/prenom1-leaderboard" className="btn btn-ghost btn-xs">
                  Žebříček
                </Link>
              </div>

              {/* Prenom 2 group */}
              <div className="flex items-center gap-1 bg-base-200 rounded-lg px-2 py-1">
                <span className="text-xs text-base-content/50 mr-1">Prenominační 2.0:</span>
                <Link href="/vysledky/prenom2" className="btn btn-ghost btn-xs">
                  Tipy účastníků
                </Link>
                <Link href="/vysledky/prenom2-stats" className="btn btn-ghost btn-xs">
                  Statistiky kategorií
                </Link>
                <Link href="/vysledky/prenom2-leaderboard" className="btn btn-ghost btn-xs">
                  Žebříček
                </Link>
                <Link href="/vysledky/prenom2-earnings" className="btn btn-ghost btn-xs">
                  Výsledné zisky
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
