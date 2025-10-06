export default function HomePage() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold">Acegrocer</h1>
      <p className="mt-2 text-muted-foreground">Welcome! Your Next.js + TypeScript starter is ready.</p>
      <ul className="mt-4 list-disc space-y-1 pl-6">
        <li>
          Dev server: <span className="font-mono text-sm">http://localhost:3000</span>
        </li>
        <li>
          Health check: <code className="rounded bg-muted px-1 py-0.5 text-sm">/api/health</code> → {`{"status":"ok"}`}
        </li>
      </ul>
    </main>
  )
}
