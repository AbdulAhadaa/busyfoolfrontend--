import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Signup from "./pages/SignUp"
import Login from "./pages/Login"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import Ingredients from "./pages/Ingredients"
import Welcome from "./pages/Welcome"
import Products from "./pages/Products"
import Stock from "./pages/Stock.jsx"
import Purchase from "./pages/Purchase"
import Sales from "./pages/Sales"
import Dashboard from "./pages/Dashboard"

import DragDropCSVPopup from "./components/DragDropCSVPopup"
import DailySales from "./pages/DailySales"

// Helper to check if user is logged in
function isLoggedIn() {
  return Boolean(localStorage.getItem("accessToken"))
}

// Wrapper for protected routes
function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/signup" replace />
  }
  return children
}

// Wrapper for public routes (login/signup)
function PublicRoute({ children }) {
  if (isLoggedIn()) {
    return <Navigate to="/welcome" replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root route: redirect based on login status */}
        <Route
          path="/"
          element={isLoggedIn() ? <Navigate to="/welcome" replace /> : <Navigate to="/signup" replace />}
        />

        {/* Public routes: only accessible if not logged in */}
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Protected routes: only accessible if logged in */}
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <Welcome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mapper"
          element={
            <ProtectedRoute>
              <DragDropCSVPopup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dailysales"
          element={
            <ProtectedRoute>
              <DailySales />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ingredients"
          element={
            <ProtectedRoute>
              <Ingredients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock"
          element={
            <ProtectedRoute>
              <Stock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases"
          element={
            <ProtectedRoute>
              <Purchase />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Sales />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
