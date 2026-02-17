export default function ComingSoonPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Coming Soon
        </h1>
        <p className="text-xl text-slate-600 mb-8">
          We&apos;re working hard to bring you this feature. Stay tuned!
        </p>
        <div className="bg-white rounded-lg border p-8 shadow-sm">
          <p className="text-slate-700 mb-6">
            This service will be available soon. Check back later for updates.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}
