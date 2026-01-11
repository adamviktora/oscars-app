import prisma from '@/lib/prisma';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    where: {
      email: { not: 'robinzon@skaut.cz' },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Registrovaní uživatelé</h1>
      
      <div className="bg-base-100 rounded-lg shadow overflow-hidden">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Jméno</th>
              <th>Email</th>
              <th>Registrace</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="font-medium">{user.name}</td>
                <td>{user.email}</td>
                <td className="text-base-content/60">
                  {new Date(user.createdAt).toLocaleDateString('cs-CZ', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-base-content/60">
        Celkem: {users.length} uživatelů
      </div>
    </div>
  );
}
