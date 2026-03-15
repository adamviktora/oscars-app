export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
