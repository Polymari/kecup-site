import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { routerBasename } from './lib/asset'
import { RequireAuth } from './lib/auth'
import { PublicLayout } from './components/layout/PublicLayout'
import { PortalLayout } from './components/layout/PortalLayout'
import Home from './pages/public/Home'
import Menu from './pages/public/Menu'
import Build from './pages/public/Build'
import Outlets from './pages/public/Outlets'
import OutletDetail from './pages/public/OutletDetail'
import Story from './pages/public/Story'
import Franchise from './pages/public/Franchise'
import NotFound from './pages/public/NotFound'

const CupLab = lazy(() => import('./pages/lab/CupLab'))
const BrandLab = lazy(() => import('./pages/lab/BrandLab'))
const Login = lazy(() => import('./pages/portal/Login'))
const Dashboard = lazy(() => import('./pages/portal/Dashboard'))
const Cashier = lazy(() => import('./pages/portal/Cashier'))
const Inventory = lazy(() => import('./pages/portal/Inventory'))
const Sales = lazy(() => import('./pages/portal/Sales'))
const Analytics = lazy(() => import('./pages/portal/Analytics'))
const Settings = lazy(() => import('./pages/portal/Settings'))

export const router = createBrowserRouter(
  [
    {
      element: <PublicLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'menu', element: <Menu /> },
        { path: 'build', element: <Build /> },
        { path: 'outlets', element: <Outlets /> },
        { path: 'outlets/:slug', element: <OutletDetail /> },
        { path: 'story', element: <Story /> },
        { path: 'franchise', element: <Franchise /> },
        { path: 'lab/cup', element: <CupLab /> },
        { path: 'lab/brand', element: <BrandLab /> },
        { path: '*', element: <NotFound /> },
      ],
    },
    {
      path: 'portal',
      children: [
        { path: 'login', element: <Login /> },
        {
          element: (
            <RequireAuth>
              <PortalLayout />
            </RequireAuth>
          ),
          children: [
            { index: true, element: <Navigate to="dashboard" replace /> },
            { path: 'dashboard', element: <Dashboard /> },
            { path: 'cashier', element: <Cashier /> },
            { path: 'inventory', element: <Inventory /> },
            { path: 'sales', element: <Sales /> },
            { path: 'analytics', element: <Analytics /> },
            { path: 'settings', element: <Settings /> },
          ],
        },
      ],
    },
  ],
  { basename: routerBasename() },
)
