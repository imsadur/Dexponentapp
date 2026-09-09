import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty-state">
      <h1>Page not found</h1>
      <p>Return to your workspace to continue.</p>
      <Link className="button primary" href="/app/dashboard">
        Open dashboard
      </Link>
    </main>
  );
}
