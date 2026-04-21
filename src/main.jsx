import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos por defecto
      gcTime: 1000 * 60 * 60 * 24, // 24 horas (reemplaza cacheTime)
      refetchOnWindowFocus: false, // Opcional: para mejor exp offline
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
)
