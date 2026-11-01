import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import { createQueryClient } from '@/api/query-client.ts';
import App from '@/App';
import { AuthProvider } from '@/features/auth/AuthProvider.tsx';

import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@/styles/global.scss';

const queryClient = createQueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
