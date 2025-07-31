import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { Plus, Edit3, Package, DollarSign, TrendingDown, Boxes, AlertCircle, CheckCircle } from "lucide-react";

const unitOptions = ["ml", "L", "g", "kg", "unit"];

export default function Stock() {
  // Cache for ingredient details by id
   const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stockItems, setStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    ingredientId: "",
    purchased_quantity: "",
    unit: "",
    purchase_price: "",
    waste_percent: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [ingredients, setIngredients] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    fetchIngredients();
    fetchStock();
  }, []);

  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:3000/ingredients", {
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

  const fetchStock = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:3000/stock", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStockItems(Array.isArray(data) ? data : []);
      } else {
        setStockItems([]);
      }
    } catch (err) {
      setStockItems([]);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id) => {
    setIsSubmitting(true);
    setMessage("");
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:3000/stock/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage("Stock deleted successfully.");
        setMessageType("success");
        fetchStock();
      } else {
        setMessage("Failed to delete stock.");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Error deleting stock.");
      setMessageType("error");
    }
    setIsSubmitting(false);
  };

  const handleEdit = (item) => {
    setEditingStock(item.id);
    setFormData({
      ingredientId: item.ingredient?.id || "",
      purchased_quantity: item.purchased_quantity,
      unit: item.unit,
      purchase_price: item.purchase_price,
      waste_percent: item.waste_percent
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage("");
    let errors = {};
    if (!formData.ingredientId) errors.ingredientId = "Required";
    if (!formData.purchased_quantity) errors.purchased_quantity = "Required";
    if (!formData.unit) errors.unit = "Required";
    if (!formData.purchase_price) errors.purchase_price = "Required";
    if (!formData.waste_percent) errors.waste_percent = "Required";
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      setIsSubmitting(false);
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      let res;
      if (editingStock) {
        const payload = {
          purchased_quantity: Number(formData.purchased_quantity),
          unit: formData.unit,
          purchase_price: Number(formData.purchase_price),
          waste_percent: Number(formData.waste_percent),
          ingredientId: formData.ingredientId
        };
        res = await fetch(`http://localhost:3000/stock/${editingStock}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } else {
        const payload = {
          purchased_quantity: Number(formData.purchased_quantity),
          unit: formData.unit,
          purchase_price: Number(formData.purchase_price),
          waste_percent: Number(formData.waste_percent),
          ingredientId: formData.ingredientId
        };
        res = await fetch("http://localhost:3000/stock", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }
      if (res.ok) {
        setMessage(editingStock ? "Stock updated successfully." : "Stock added successfully.");
        setMessageType("success");
        setShowModal(false);
        setEditingStock(null);
        setFormData({ ingredientId: "", purchased_quantity: "", unit: "", purchase_price: "", waste_percent: "" });
        fetchStock();
      } else {
        const errorText = await res.text();
        setMessage(`Failed to submit stock. ${errorText}`);
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Error submitting stock.");
      setMessageType("error");
    }
    setIsSubmitting(false);
  };

  // Calculate total stock value
  const totalStockValue = stockItems.reduce((total, item) => {
    return total + (Number(item.purchase_price) * Number(item.purchased_quantity));
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 space-y-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
        
            {/* Stats Cards */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Items</p>
                      <p className="text-2xl font-bold text-gray-900">{stockItems.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold text-gray-900">${totalStockValue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Waste</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stockItems.length > 0 
                          ? (stockItems.reduce((sum, item) => sum + Number(item.waste_percent), 0) / stockItems.length).toFixed(1)
                          : "0.0"
                        }%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div> */}

            {/* Message Display */}
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

            {/* Main Table Card */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  Stock Inventory
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ingredient Name</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Quantity</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Unit</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Purchase Price</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Waste %</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Remaining Qty</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Purchased At</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Updated At</th>
                        {/* <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th> */}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                              <span className="text-gray-600">Loading stock items...</span>
                            </div>
                          </td>
                        </tr>
                      ) : stockItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center align-middle min-h-[300px]">
                            <div className="flex flex-col items-center justify-center gap-3 min-h-[220px] h-full w-full">
                              <Package className="w-12 h-12 text-gray-300 mb-2" />
                              <div className="flex flex-col items-center">
                                <p className="text-gray-500 font-medium text-center">No stock items found</p>
                                <p className="text-gray-400 text-sm text-center">Add your first stock item to get started</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : stockItems.map((item, index) => (
                        <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-amber-100 rounded-lg">
                                <Package className="w-4 h-4 text-amber-600" />
                              </div>
                              <span className="font-medium text-gray-900">{item.ingredient?.name || "Unknown Ingredient"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">{item.purchased_quantity}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-green-600">${Number(item.purchase_price).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              Number(item.waste_percent) > 15 
                                ? 'bg-red-100 text-red-800' 
                                : Number(item.waste_percent) > 10 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.waste_percent}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">{item.remaining_quantity ?? '-'}</td>
                          <td className="px-6 py-4 text-center text-xs text-gray-700">{item.purchased_at ? new Date(item.purchased_at).toLocaleString() : '-'}</td>
                          <td className="px-6 py-4 text-center text-xs text-gray-700">{item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'}</td>
                          {/* <td className="px-6 py-4 text-center">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEdit(item)} 
                              disabled={isSubmitting}
                              className="hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors duration-150"
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </td> */}
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
                      {editingStock ? <Edit3 className="w-5 h-5 text-amber-600" /> : <Plus className="w-5 h-5 text-amber-600" />}
                    </div>
                    {editingStock ? "Edit Stock Item" : "Add New Stock Item"}
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
                      value={editingStock ? (stockItems.find(s => s.id === editingStock)?.ingredient?.id || "") : formData.ingredientId}
                      onValueChange={value => {
                        if (!editingStock) {
                          setFormData(prev => ({ ...prev, ingredientId: value }));
                        }
                      }}
                      disabled={!!editingStock}
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

                  {/* Quantity and Unit Row */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="purchased_quantity" className="text-sm font-semibold text-gray-700">
                        Quantity *
                      </Label>
                      <Input
                        id="purchased_quantity"
                        type="number"
                        step="1"
                        value={formData.purchased_quantity}
                        onChange={e => setFormData(prev => ({ ...prev, purchased_quantity: e.target.value }))}
                        placeholder="Enter quantity..."
                        className={`h-12 ${formErrors.purchased_quantity ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500"}`}
                      />
                      {formErrors.purchased_quantity && <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.purchased_quantity}
                      </p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit" className="text-sm font-semibold text-gray-700">
                        Unit *
                      </Label>
                      <Select value={formData.unit} onValueChange={value => setFormData(prev => ({ ...prev, unit: value }))}>
                        <SelectTrigger className={`h-12 ${formErrors.unit ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500"}`}>
                          <SelectValue placeholder="Select unit..." />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOptions.map(unit => (
                            <SelectItem key={unit} value={unit} className="py-3">{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.unit && <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.unit}
                      </p>}
                    </div>
                  </div>

                  {/* Price and Waste Row */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="purchase_price" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Purchase Price ($) *
                      </Label>
                      <Input
                        id="purchase_price"
                        type="number"
                        step="0.01"
                        value={formData.purchase_price}
                        onChange={e => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
                        placeholder="0.00"
                        className={`h-12 ${formErrors.purchase_price ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500"}`}
                      />
                      {formErrors.purchase_price && <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.purchase_price}
                      </p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="waste_percent" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Waste Percentage *
                      </Label>
                      <Input
                        id="waste_percent"
                        type="number"
                        step="0.1"
                        value={formData.waste_percent}
                        onChange={e => setFormData(prev => ({ ...prev, waste_percent: e.target.value }))}
                        placeholder="0.0"
                        className={`h-12 ${formErrors.waste_percent ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500"}`}
                      />
                      {formErrors.waste_percent && <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.waste_percent}
                      </p>}
                    </div>
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
                    {isSubmitting ? "Processing..." : editingStock ? "Update Stock" : "Add Stock"}
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