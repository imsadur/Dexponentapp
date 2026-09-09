"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty-state">
      <h1>Something didn’t load</h1>
      <p>Your saved drafts remain in this browser.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
