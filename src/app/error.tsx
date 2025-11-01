"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // You can log the error to an error reporting service here
    // console.error(error);
  }, [error]);

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-slate-600 max-w-md">{error?.message ?? "An unexpected error occurred."}</p>
      <button onClick={() => reset()} className="rounded bg-black text-white px-4 py-2">Try again</button>
    </main>
  );
}



