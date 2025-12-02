import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { ToastProvider } from './components/ToastProvider.tsx'
import { BrowserRouter } from 'react-router-dom'
import './index.css'

// 确保 React Refresh 预处理变量存在，避免 "@vitejs/plugin-react can't detect preamble" 报错
if (import.meta.hot) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  if (!w.$RefreshReg$) {
    w.$RefreshReg$ = () => {}
  }
  if (!w.$RefreshSig$) {
    w.$RefreshSig$ = () => (type: unknown) => type
  }
}

if (import.meta.env.DEV) {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('unsupported type')) {
      console.log('React 试图打印的值：', args[1])
    }
    originalError(...args)
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
          <AuthProvider>
              <App />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
)