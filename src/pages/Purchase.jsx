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

export default function Purchase() {
     const [sidebarOpen, setSidebarOpen] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    ingredientId: "",
    unit: "",
    quantity: "",
    purchasePrice: "",
    purchase_date: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [ingredients, setIngredients] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    fetchIngredients();
    fetchPurchases();
  }, []);

  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://busy-fool-backend.vercel.app/ingredients", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIngredients(Array.isArray(data) ? data : []);
      } else {
        setIngredients([]);
      }
    } catch (err) {
      setIngredients([]);
    }
  };

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://busy-fool-backend.vercel.app/purchases", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPurchases(Array.isArray(data) ? data : []);
      } else {
        setPurchases([]);
      }
    } catch (err) {
      setPurchases([]);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage("");
    let errors = {};
    if (!formData.ingredientId) errors.ingredientId = "Required";
    if (!formData.unit) errors.unit = "Required";
    if (!formData.quantity) errors.quantity = "Required";
    if (!formData.purchasePrice) errors.purchasePrice = "Required";
    if (!formData.purchase_date) errors.purchase_date = "Required";
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      setIsSubmitting(false);
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const payload = {
        ingredientId: formData.ingredientId,
        unit: formData.unit,
        quantity: Number(formData.quantity),
        purchasePrice: Number(formData.purchasePrice),
        purchase_date: formData.purchase_date
      };
      const res = await fetch("https://busy-fool-backend.vercel.app/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMessage("Purchase added successfully.");
        setMessageType("success");
        setShowModal(false);
        setFormData({ ingredientId: "", unit: "", quantity: "", purchasePrice: "", purchase_date: "" });
        fetchPurchases();
      } else {
        const errorText = await res.text();
        setMessage(`Failed to add purchase. ${errorText}`);
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Error adding purchase.");
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
                <h1 className="text-3xl font-bold text-amber-900 tracking-tight">Purchases</h1>
                <p className="text-amber-700 mt-1 text-sm">Track and add your ingredient purchases</p>
              </div>
<button
  onClick={() => setShowModal(true)}
  disabled={isSubmitting}
  className="bg-[#6B4226] hover:bg-[#7a4d2c] text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all shadow-sm"
>
  <Plus className="w-4 h-4 mr-2" />
  Add Purchase
</button>



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
                  <Package className="w-5 h-5 text-amber-600" />
                  Purchase History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ingredient</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Quantity</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Unit</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Purchase Price</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Total Cost</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Purchase Date</th>
                        
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                              <span className="text-gray-600">Loading purchases...</span>
                            </div>
                          </td>
                        </tr>
                      ) : purchases.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center align-middle min-h-[300px]">
                            <div className="flex flex-col items-center justify-center gap-3 min-h-[220px] h-full w-full">
                              <Package className="w-12 h-12 text-gray-300 mb-2" />
                              <div className="flex flex-col items-center">
                                <p className="text-gray-500 font-medium text-center">No purchases found</p>
                                <p className="text-gray-400 text-sm text-center">Add your first purchase to get started</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : purchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-gray-50/50 transition-colors duration-150 bg-white">
                          <td className="px-6 py-4 font-medium text-gray-900">{purchase.ingredient?.name || "-"}</td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">{purchase.quantity}</td>
                          <td className="px-6 py-4 text-right">{purchase.ingredient?.unit || "-"}</td>
                          <td className="px-6 py-4 text-right font-semibold text-green-600">${Number(purchase.purchasePrice).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">${Number(purchase.total_cost).toFixed(2)}</td>
                          <td className="px-6 py-4 text-center text-xs text-gray-700">{purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleString() : '-'}</td>
                          <td className="px-6 py-4 text-center text-xs text-gray-700">{purchase.user?.name || '-'}</td>
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
                    Add Purchase
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Ingredient Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="ingredientId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Ingredient *
                    </Label>
                    <Select
                      value={formData.ingredientId}
                      onValueChange={value => {
                        const selected = ingredients.find(i => i.id === value);
                        setFormData(prev => ({
                          ...prev,
                          ingredientId: value,
                          unit: selected?.unit || ""
                        }));
                      }}
                    >
                      <SelectTrigger className={`h-12 ${formErrors.ingredientId ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500"}`}>
                        <SelectValue placeholder="Choose an ingredient..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map(ingredient => (
                          <SelectItem key={ingredient.id} value={ingredient.id} className="py-3">
                            {ingredient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.ingredientId && <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.ingredientId}
                    </p>}
                  </div>

                  {/* Quantity and Unit */}
                  <div className="grid grid-cols-2 gap-6">
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
                    <div className="space-y-2">
                      <Label htmlFor="unit" className="text-sm font-semibold text-gray-700">
                        Unit *
                      </Label>
                      <Input
                        id="unit"
                        value={formData.unit}
                        readOnly
                        className={`h-12 bg-gray-100 cursor-not-allowed ${formErrors.unit ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500"}`}
                      />
                      {formErrors.unit && <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.unit}
                      </p>}
                    </div>
                  </div>

                  {/* Purchase Price */}
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Purchase Price ($) *
                    </Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={e => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                      placeholder="0.00"
                      className={`h-12 ${formErrors.purchasePrice ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500"}`}
                    />
                    {formErrors.purchasePrice && <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.purchasePrice}
                    </p>}
                  </div>

                  {/* Purchase Date */}
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Purchase Date *
                    </Label>
                    <Input
                      id="purchase_date"
                      type="datetime-local"
                      value={formData.purchase_date}
                      onChange={e => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                      className={`h-12 ${formErrors.purchase_date ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500"}`}
                    />
                    {formErrors.purchase_date && <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.purchase_date}
                    </p>}
                  </div>
                </div>

                <DialogFooter className="pt-6 gap-3">
                  <Button
                      variant="outline"
                      onClick={() => setShowModal(false)}
                      disabled={isSubmitting}
                      className="bg-[#6B4226] hover:bg-[#7a4d2c] text-white px-6 py-2.5 rounded-xl shadow-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-[#6B4226] hover:bg-[#7a4d2c] text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isSubmitting && (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    )}
                    {isSubmitting ? "Processing..." : "Add Purchase"}
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
