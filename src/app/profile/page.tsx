import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6">Profil</h2>

          <div className="flex items-center gap-4 mb-6">
            <div className="avatar placeholder">
              <div className="bg-amber-400 text-gray-900 rounded-full w-16 h-16 flex items-center justify-center">
                <span className="text-3xl font-bold">
                  {session.user.name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{session.user.name}</h3>
              <p className="text-base-content/60">{session.user.email}</p>
            </div>
          </div>

          <div className="divider"></div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-base-content/60">Jméno</label>
              <p className="text-lg">{session.user.name}</p>
            </div>
            <div>
              <label className="text-sm text-base-content/60">Email</label>
              <p className="text-lg">{session.user.email}</p>
            </div>
            <div>
              <label className="text-sm text-base-content/60">Člen od</label>
              <p className="text-lg">
                {new Date(session.user.createdAt).toLocaleDateString('cs-CZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

