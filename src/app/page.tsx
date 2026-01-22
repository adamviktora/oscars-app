import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { isAdmin } from '@/lib/constants';

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Vítejte v Oscars Predictions
          </h2>
          <p className="text-base-content/70 mb-6">
            Přihlaste se a začněte tipovat Oscary 2026!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link href="/signin" className="btn btn-outline w-full sm:w-auto">
              Přihlásit se
            </Link>
            <Link href="/signup" className="btn btn-primary w-full sm:w-auto">
              Registrovat se
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userIsAdmin = isAdmin(session.user.email);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Vítej, {session.user.name}!</h2>
        <p className="text-base-content/70 mb-6">
          Tipování v prenominačních kolech je u konce.
          <br />
          Podívej se na výsledky, tipy ostatních účastníků a statistiky.
        </p>

        {/* Admin section */}
        {userIsAdmin && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-warning">
              🔧 Admin - Zadat nominace
            </h3>
            <div className="flex flex-row gap-3 justify-center">
              <Link href="/admin/nominations" className="btn btn-warning">
                🎬 Nejlepší film
              </Link>
              <Link href="/admin/nominations2" className="btn btn-warning">
                📋 Prenominační 2.0
              </Link>
            </div>
          </div>
        )}

        <h3 className="text-lg font-bold mb-4 mt-6">Prenominační kolo</h3>
        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/vysledky/prenom1-leaderboard"
            className="btn btn-primary"
          >
            🏆 Žebříček
          </Link>
          <Link href="/vysledky/prenom1" className="btn btn-primary btn-outline">
            Tipy účastníků
          </Link>
          <Link
            href="/vysledky/prenom1-preferences"
            className="btn btn-primary btn-outline"
          >
            Celková preference filmů
          </Link>
        </div>

        <h3 className="text-lg font-bold mb-4 mt-6">Prenominační kolo 2.0</h3>
        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/vysledky/prenom2-leaderboard"
            className="btn btn-secondary"
          >
            🏆 Žebříček
          </Link>
          <Link
            href="/vysledky/prenom2-earnings"
            className="btn btn-secondary"
          >
            💰 Výsledné zisky
          </Link>
          <Link href="/vysledky/prenom2" className="btn btn-secondary btn-outline">
            Tipy účastníků
          </Link>
          <Link href="/vysledky/prenom2-stats" className="btn btn-secondary btn-outline">
            Statistiky kategorií
          </Link>
        </div>
      </div>
    </div>
  );
}
