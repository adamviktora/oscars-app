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
          <h2 className="text-2xl font-bold mb-4">Welcome to Oscars Predictions</h2>
          <p className="text-base-content/70 mb-6">
            Sign in to start making your predictions for the 2026 Oscars!
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signin" className="btn btn-outline">
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-primary">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Welcome back, {session.user.name}!</h2>
        <p className="text-base-content/70 mb-6">
          Ready to make your Oscar predictions?
        </p>
        <Link href="/prenomination" className="btn btn-primary">
          Start Predictions
        </Link>
      </div>
    </div>
  );
}

