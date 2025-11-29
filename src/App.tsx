import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import MainLayout from './components/Layout/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import QuestionManagePage from './pages/QuestionManagePage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import LinksGenerate from './pages/LinksGenerate'
import LinksManage from './pages/LinksManage'
import Packages from './pages/Packages'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import UserManagement from './pages/UserManagement'
import UserDetail from './pages/UserDetail'
import QuestionImport from './pages/QuestionImport'
import ReportDetail from './pages/ReportDetail'
import Reports from './pages/Reports'
import ExportHistory from './pages/ExportHistory'
import AuditLogs from './pages/AuditLogs'
import BackupManage from './pages/BackupManage'
import Statistics from './pages/Statistics'
import BatchImportLinks from './pages/BatchImportLinks'

// 页面加载组件
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : (
              <Suspense fallback={<PageLoader />}>
                <Login />
              </Suspense>
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : (
              <Suspense fallback={<PageLoader />}>
                <Register />
              </Suspense>
            )
          } 
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="dashboard" 
            element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            } 
          />
          <Route 
            path="links/generate" 
            element={
              <Suspense fallback={<PageLoader />}>
                <LinksGenerate />
              </Suspense>
            } 
          />
          <Route 
            path="links/manage" 
            element={
              <Suspense fallback={<PageLoader />}>
                <LinksManage />
              </Suspense>
            } 
          />
          <Route 
            path="links/batch-import" 
            element={
              <Suspense fallback={<PageLoader />}>
                <BatchImportLinks />
              </Suspense>
            } 
          />
          <Route 
            path="packages" 
            element={
              <Suspense fallback={<PageLoader />}>
                <Packages />
              </Suspense>
            } 
          />
          <Route 
            path="notifications" 
            element={
              <Suspense fallback={<PageLoader />}>
                <Notifications />
              </Suspense>
            } 
          />
          <Route 
            path="profile" 
            element={
              <Suspense fallback={<PageLoader />}>
                <Profile />
              </Suspense>
            } 
          />
          <Route 
            path="settings" 
            element={
              <Suspense fallback={<PageLoader />}>
                <Profile />
              </Suspense>
            } 
          />
          <Route 
            path="reports/:id" 
            element={
              <Suspense fallback={<PageLoader />}>
                <ReportDetail />
              </Suspense>
            } 
          />
          <Route 
            path="admin/reports" 
            element={
              <Suspense fallback={<PageLoader />}>
                <Reports />
              </Suspense>
            } 
          />
          <Route 
            path="admin/export-history" 
            element={
              <Suspense fallback={<PageLoader />}>
                <ExportHistory />
              </Suspense>
            } 
          />
          <Route 
            path="statistics" 
            element={
              <Suspense fallback={<PageLoader />}>
                <Statistics />
              </Suspense>
            } 
          />
          <Route 
            path="admin/users" 
            element={
              <Suspense fallback={<PageLoader />}>
                <UserManagement />
              </Suspense>
            } 
          />
          <Route 
            path="admin/users/:userId" 
            element={
              <Suspense fallback={<PageLoader />}>
                <UserDetail />
              </Suspense>
            } 
          />
          <Route 
            path="admin/users/:id" 
            element={
              <Suspense fallback={<PageLoader />}>
                <UserDetail />
              </Suspense>
            } 
          />
          <Route 
            path="admin/questions/import" 
            element={
              <Suspense fallback={<PageLoader />}>
                <QuestionImport />
              </Suspense>
            } 
          />
          <Route 
            path="admin/questions/manage" 
            element={
              <QuestionManagePage />
            } 
          />
          <Route 
            path="admin/audit" 
            element={
              <Suspense fallback={<PageLoader />}>
                <AuditLogs />
              </Suspense>
            } 
          />
          <Route 
            path="admin/backup" 
            element={
              <Suspense fallback={<PageLoader />}>
                <BackupManage />
              </Suspense>
            } 
          />
        </Route>
      </Routes>
    </Suspense>
  )
}
