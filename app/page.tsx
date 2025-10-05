export default function HomePage() {
  return (
    <main style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: 24 }}>
      <h1>Acegrocer</h1>
      <p>Welcome! Your Next.js + TypeScript starter is ready.</p>
      <ul>
        <li>Dev server: http://localhost:3000</li>
        <li>Health check: <code>/api/health</code> → {`{"status":"ok"}`}</li>
      </ul>
    </main>
  )
}
