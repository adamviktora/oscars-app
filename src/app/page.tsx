import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { isAdmin, REGISTRATION_OPEN } from '@/lib/constants';

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
          <div className="mb-6">
            <Link href="/live" className="btn btn-warning btn-lg">
              🏆 LIVE výsledky
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link href="/signin" className="btn btn-outline w-full sm:w-auto">
              Přihlásit se
            </Link>
            {REGISTRATION_OPEN && (
              <Link href="/signup" className="btn btn-primary w-full sm:w-auto">
                Registrovat se
              </Link>
            )}
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

        {/* Live Oscar results - main CTA */}
        <div className="mb-8 p-6 bg-linear-to-r from-amber-500/20 to-yellow-500/20 rounded-xl border border-amber-500/30">
          <h3 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
            🏆 Oscary 2026
          </h3>
          <p className="text-base-content/70 mb-4">
            Vyhlášení Oscarů je tu! Sledujte výsledky v reálném čase!
          </p>
          <Link href="/live" className="btn btn-warning btn-lg">
            LIVE výsledky
          </Link>
        </div>

        {/* Admin section */}
        {userIsAdmin && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-warning">
              🔧 Admin
            </h3>
            <div className="flex flex-row gap-3 justify-center flex-wrap">
              <Link href="/admin/oscar-winners" className="btn btn-warning">
                🏆 Vyhlášení výsledků
              </Link>
              <Link href="/admin/nominations" className="btn btn-warning btn-outline">
                🎬 Nejlepší film
              </Link>
              <Link href="/admin/nominations2" className="btn btn-warning btn-outline">
                📋 Prenominační 2.0
              </Link>
            </div>
          </div>
        )}

        <h3 className="text-lg font-bold mb-4 mt-6">Nominační kolo</h3>
        <div className="flex flex-col gap-3 items-center">
          <Link href="/vysledky/nomination-stats" className="btn btn-warning btn-outline">
            Statistiky
          </Link>
          <Link href="/vysledky/nominations" className="btn btn-warning btn-outline">
            Tipy účastníků
          </Link>
        </div>

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
