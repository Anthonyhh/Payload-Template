'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              A critical error occurred. Please refresh the page.
            </p>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace', marginBottom: '1rem' }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{ padding: '0.5rem 1.5rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
