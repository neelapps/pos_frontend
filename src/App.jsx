import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

// Pages imports
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import POSBilling from './pages/POSBilling.jsx';
import KOTManagement from './pages/KOTManagement.jsx';
import Orders from './pages/Orders.jsx';
import Tables from './pages/Tables.jsx';
import MenuItems from './pages/MenuItems.jsx';
import Customers from './pages/Customers.jsx';
import Inventory from './pages/Inventory.jsx';
import Expenses from './pages/Expenses.jsx';
import Coupons from './pages/Coupons.jsx';
import Staff from './pages/Staff.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unauthenticated Login view */}
        <Route path="/login" element={<Login />} />

        {/* Authenticated Admin panel */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Default entry redirecting to POS */}
          <Route index element={<Navigate to="/pos" replace />} />

          {/* POS Billing Screen */}
          <Route
            path="pos"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Cashier']}>
                <POSBilling />
              </ProtectedRoute>
            }
          />

          {/* Dashboard home */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Cashier']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Kitchen KOT Display */}
          <Route
            path="kot"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Kitchen']}>
                <KOTManagement />
              </ProtectedRoute>
            }
          />

          {/* Orders log history */}
          <Route
            path="orders"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Cashier']}>
                <Orders />
              </ProtectedRoute>
            }
          />

          {/* Tables layout status */}
          <Route
            path="tables"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Cashier']}>
                <Tables />
              </ProtectedRoute>
            }
          />

          {/* Menu Items & Categories */}
          <Route
            path="menu"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <MenuItems />
              </ProtectedRoute>
            }
          />

          {/* Customer loyalty list */}
          <Route
            path="customers"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Cashier']}>
                <Customers />
              </ProtectedRoute>
            }
          />

          {/* Raw inventory levels */}
          <Route
            path="inventory"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <Inventory />
              </ProtectedRoute>
            }
          />

          {/* Operational Expenses */}
          <Route
            path="expenses"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <Expenses />
              </ProtectedRoute>
            }
          />

          {/* Coupons & discounts */}
          <Route
            path="coupons"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <Coupons />
              </ProtectedRoute>
            }
          />

          {/* Staff directory */}
          <Route
            path="staff"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <Staff />
              </ProtectedRoute>
            }
          />

          {/* Analytics reports */}
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* Business configurations */}
          <Route
            path="settings"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Profile credentials */}
          <Route path="profile" element={<Profile />} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
