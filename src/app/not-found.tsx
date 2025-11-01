export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-2xl font-semibold">404 - Page not found</h1>
      <p className="text-slate-600">The page you are looking for doesn’t exist.</p>
      <a href="/" className="underline">Go home</a>
    </main>
  );
}



