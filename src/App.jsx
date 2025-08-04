import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import Signup from "./pages/SignUp"
import Login from "./pages/Login"
import Ingredients from "./pages/Ingredients"
import Welcome from "./pages/Welcome"
import Products from "./pages/Products"
import Stock from "./pages/Stock.jsx"
import Purchase from "./pages/Purchase"
import Sales from "./pages/Sales"
import Dashboard from "./pages/Dashboard"
import WhatIf from "./pages/WhatIf"



// Helper to check if user is logged in
function isLoggedIn() {
  return Boolean(localStorage.getItem("accessToken"));
}

// Wrapper for protected routes
function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/signup" replace />;
  }
  return children;
}

// Wrapper for public routes (login/signup)
function PublicRoute({ children }) {
  if (isLoggedIn()) {
    return <Navigate to="/welcome" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root route: redirect based on login status */}
        <Route path="/" element={isLoggedIn() ? <Navigate to="/welcome" replace /> : <Navigate to="/signup" replace />} />

        {/* Public routes: only accessible if not logged in */}
        <Route path="/signup" element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        {/* Protected routes: only accessible if logged in */}
        <Route path="/welcome" element={
          <ProtectedRoute>
            <Welcome />
          </ProtectedRoute>
        } />
    
        <Route path="/products" element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        } />
        <Route path="/ingredients" element={
          <ProtectedRoute>
            <Ingredients />
          </ProtectedRoute>
        } />
        <Route path="/stock" element={
          <ProtectedRoute>
            <Stock />
          </ProtectedRoute>
        } />
        <Route path="/purchases" element={
          <ProtectedRoute>
            <Purchase />
          </ProtectedRoute>
        } />
        <Route path="/sales" element={
          <ProtectedRoute>
            <Sales />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      
        <Route path="/what-if" element={
          <ProtectedRoute>
            <WhatIf />
          </ProtectedRoute>
        } />

        {/* Catch-all: redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App