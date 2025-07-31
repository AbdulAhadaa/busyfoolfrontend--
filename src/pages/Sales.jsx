import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Plus, Package, DollarSign, Calendar, AlertCircle, CheckCircle } from "lucide-react";

export default function Sales() {
     const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    quantity: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:3000/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      setProducts([]);
    }
  };

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:3000/sales", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSales(Array.isArray(data) ? data : []);
      } else {
        setSales([]);
      }
    } catch (err) {
      setSales([]);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage("");
    let errors = {};
    if (!formData.productId) errors.productId = "Required";
    if (!formData.quantity) errors.quantity = "Required";
    // Only validate productId and quantity
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      setIsSubmitting(false);
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const selectedProduct = products.find(p => p.id === formData.productId);
      const payload = {
        productId: formData.productId,
        product_name: selectedProduct?.name || "",
        quantity: Number(formData.quantity)
      };
      const res = await fetch("http://localhost:3000/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMessage("Sale added successfully.");
        setMessageType("success");
        setShowModal(false);
        setFormData({ productId: "", quantity: "" });
        fetchSales();
      } else {
        const errorText = await res.text();
        setMessage(`Failed to add sale. ${errorText}`);
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Error adding sale.");
      setMessageType("error");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64 flex flex-col min-h-screen">
    <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 space-y-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-amber-900 tracking-tight">Sales</h1>
                <p className="text-amber-700 mt-1 text-sm">Track and add your product sales</p>
              </div>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-[#6B4226] to-[#5a3620] text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all shadow-sm"
                disabled={isSubmitting}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Sale
              </Button>
            </div>

            {message && (
              <div className={`mb-6 px-4 py-3 rounded-lg border-l-4 flex items-center gap-3 ${
                messageType === "success"
                  ? "bg-green-50 text-green-800 border-green-400"
                  : "bg-red-50 text-red-800 border-red-400"
              }`}>
                {messageType === "success" ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">{message}</span>
              </div>
            )}

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                  Sales History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Product</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Quantity</th>
                        {/* Only show Product, Quantity, User columns */}
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                              <span className="text-gray-600">Loading sales...</span>
                            </div>
                          </td>
                        </tr>
                      ) : sales.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center align-middle min-h-[300px]">
                            <div className="flex flex-col items-center justify-center gap-3 min-h-[220px] h-full w-full">
                              <DollarSign className="w-12 h-12 text-gray-300 mb-2" />
                              <div className="flex flex-col items-center">
                                <p className="text-gray-500 font-medium text-center">No sales found</p>
                                <p className="text-gray-400 text-sm text-center">Add your first sale to get started</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors duration-150 bg-white">
                          <td className="px-6 py-4 font-medium text-gray-900">{sale.product?.name || "-"}</td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">{sale.quantity}</td>
                          {/* Only show quantity, remove salePrice, total, sale_date columns */}
                          <td className="px-6 py-4 text-center text-xs text-gray-700">{sale.user?.name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Modal Dialog */}
            <Dialog open={showModal} onOpenChange={open => !open && setShowModal(false)}>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                <DialogHeader className="pb-6">
                  <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Plus className="w-5 h-5 text-amber-600" />
                    </div>
                    Add Sale
                  </DialogTitle>
                </DialogHeader>
                {/* Show error message in modal if present and type is error */}
                {message && messageType === "error" && (
                  <div className="mb-4 px-4 py-3 rounded-lg border-l-4 flex items-center gap-3 bg-red-50 text-red-800 border-red-400">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium">{message}</span>
                  </div>
                )}
                <div className="space-y-6 py-4">
                  {/* Product Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="productId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Product *
                    </Label>
                    <Select
                      value={formData.productId}
                      onValueChange={value => setFormData(prev => ({ ...prev, productId: value }))}
                    >
                      <SelectTrigger className={`h-12 ${formErrors.productId ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500"}`}>
                        <SelectValue placeholder="Choose a product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id} className="py-3">
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.productId && <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.productId}
                    </p>}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700">
                      Quantity *
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="1"
                      value={formData.quantity}
                      onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Enter quantity..."
                      className={`h-12 ${formErrors.quantity ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500"}`}
                    />
                    {formErrors.quantity && <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.quantity}
                    </p>}
                  </div>


                </div>

                <DialogFooter className="pt-6 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isSubmitting && (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    )}
                    {isSubmitting ? "Processing..." : "Add Sale"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
