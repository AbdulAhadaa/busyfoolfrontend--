import { BrowserRouter, Routes, Route } from "react-router-dom"
import Signup from "./pages/SignUp"
import Login from "./pages/Login"
import Ingredients from "./pages/Ingredients"
import Welcome from "./pages/Welcome"
import Products from "./pages/Products"
import Stock from "./pages/Stock.jsx"
function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<Welcome />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
             <Route path="/ingredients" element={<Ingredients />} />
              <Route path="/welcome" element={<Welcome />} />
                       <Route path="/products" element={<Products />} />
        
                        <Route path="/stock" element={<Stock />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App