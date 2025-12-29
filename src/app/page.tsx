import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import Link from 'next/link';

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Vítej, {session.user.name}!</h2>
        <p className="text-base-content/70 mb-6">
          Začni s tipováním letošních oscarových sázek!
        </p>
        <div className="flex flex-col gap-3 items-center">
          <Link href="/prenomination" className="btn btn-primary">
            Prenominační kolo
          </Link>
          <Link href="/prenomination2" className="btn btn-primary">
            Prenominační kolo 2.0
          </Link>
        </div>
      </div>
    </div>
  );
}
