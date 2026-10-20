import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import '@fontsource-variable/fredoka'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource/lilita-one'
import '@fontsource/bagel-fat-one/latin.css'
import '@fontsource/sacramento'
import '@fontsource/space-mono/400.css'
import '@fontsource/space-mono/700.css'
import './styles/globals.css'
import './i18n'
import { AuthProvider } from './lib/auth'
import { router } from './router'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <Suspense fallback={<div className="p-10 text-center">Loading…</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  </StrictMode>,
)
