export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 md:py-8">{children}</div>
    </div>
  );
}


