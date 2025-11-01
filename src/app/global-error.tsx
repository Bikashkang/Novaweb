"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-2xl font-semibold">App crashed</h1>
          <p className="text-slate-600 max-w-md">{error?.message ?? "An unexpected error occurred."}</p>
          <button onClick={() => reset()} className="rounded bg-black text-white px-4 py-2">Reload</button>
        </main>
      </body>
    </html>
  );
}



