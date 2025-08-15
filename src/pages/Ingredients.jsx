"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertTriangle,
  Pencil,
  Trash2,
  Plus,
  Search,
  Download,
  Package,
  AlertCircle,
  CheckCircle,
  X,
  Upload,
  Loader2,
} from "lucide-react"
import { Sidebar } from "../components/Sidebar"
import { Navbar } from "../components/Navbar"

// Waste presets by category
const wastePresets = {
  Dairy: 8,
  Syrups: 3,
  Coffee: 5,
  "Baked Goods": 12,
  "Fresh Items": 15,
  "Dry Goods": 2,
  Beverages: 4,
}

const supplierOptions = [
  "Main Supplier",
  "Local Dairy",
  "Wholesaler",
  "Flavor Co.",
  "Sweet Syrups Inc.",
  "Coffee Roasters Ltd",
  "Fresh Foods Co",
]

const unitOptions = ["L", "kg", "unit"]

const categoryOptions = Object.keys(wastePresets)

// No mock data, only dynamic data from API
const initialIngredients = []

export default function BusyFoolIngredients() {
  const [isLoading, setIsLoading] = useState(true)
  const [csvImporting, setCsvImporting] = useState(false)
  const [ingredients, setIngredients] = useState(initialIngredients)
  const [filteredIngredients, setFilteredIngredients] = useState(initialIngredients)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState(null)
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Toast states
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // Form state for add/edit modal
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    quantity: "",
    purchase_price: "",
    waste_percent: "",
    supplier: "",
  })

  // Toast helper functions
  const showSuccessMessage = (message) => {
    setSuccessMessage(message)
    setShowSuccessToast(true)
    setTimeout(() => {
      setShowSuccessToast(false)
      setSuccessMessage("")
    }, 4000)
  }

  const showErrorMessage = (message) => {
    setErrorMessage(message)
    setShowErrorToast(true)
    setTimeout(() => {
      setShowErrorToast(false)
      setErrorMessage("")
    }, 6000)
  }

  // Success Toast Component
  const SuccessToast = () => (
    <AnimatePresence>
      {showSuccessToast && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed top-4 right-4 z-[60] bg-white rounded-xl shadow-2xl border-l-4 border-green-500 p-4 flex items-center gap-3 max-w-sm"
        >
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Success!</p>
            <p className="text-sm text-gray-600">{successMessage}</p>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Error Toast Component
  const ErrorToast = () => (
    <AnimatePresence>
      {showErrorToast && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed top-4 right-4 z-[60] bg-white rounded-xl shadow-2xl border-l-4 border-red-500 p-4 flex items-start gap-3 max-w-md"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Error</p>
            <p className="text-sm text-gray-600 mt-1">{errorMessage}</p>
          </div>
          <button
            onClick={() => setShowErrorToast(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Calculate costs including waste
  const calculateCosts = (purchasePrice, packageSize, wastePercent, unit) => {
    const wasteMultiplier = 1 + wastePercent / 100
    const baseCost = purchasePrice / (packageSize || 1)
    const trueCost = baseCost * wasteMultiplier

    return {
      cost_per_unit: trueCost,
      cost_per_ml: unit === "L" ? trueCost / 1000 : trueCost,
      cost_per_gram: unit === "kg" ? trueCost / 1000 : trueCost,
    }
  }

  useEffect(() => {
    const fetchIngredients = async () => {
      setIsLoading(true)
      const token = localStorage.getItem("accessToken")
      try {
        const response = await fetch("https://busy-fool-backend.vercel.app/ingredients", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          // Remove duplicates based on name (case-insensitive) and keep the first occurrence
          const uniqueData = data.filter(
            (ingredient, index, self) =>
              index === self.findIndex((ing) => ing.name.toLowerCase() === ingredient.name.toLowerCase()),
          )
          setIngredients(uniqueData)
        }
      } catch (error) {
        showErrorMessage("Failed to load ingredients. Please refresh the page.")
      }
      setIsLoading(false)
    }
    fetchIngredients()
  }, [])

  // Filter and search logic
  useEffect(() => {
    const filtered = ingredients.filter((ingredient) => ingredient.name.toLowerCase().includes(search.toLowerCase()))
    filtered.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1
    })
    setFilteredIngredients(filtered)
  }, [search, selectedCategory, ingredients, sortBy, sortOrder])

  // Form validation
  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = "Name is required"

    // Check for duplicate names (case-insensitive)
    const duplicateIngredient = ingredients.find(
      (ing) =>
        ing.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        (!editingIngredient || ing.id !== editingIngredient.id),
    )
    if (duplicateIngredient) {
      errors.name = "An ingredient with this name already exists"
    }

    if (!formData.unit) errors.unit = "Unit is required"
    if (!formData.quantity || formData.quantity <= 0) errors.quantity = "Valid quantity is required"
    if (!formData.purchase_price || formData.purchase_price <= 0)
      errors.purchase_price = "Valid purchase price is required"
    if (formData.waste_percent === "" || formData.waste_percent < 0)
      errors.waste_percent = "Waste percentage is required"
    if (!formData.supplier) errors.supplier = "Supplier is required"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setIsSubmitting(true)
    const token = localStorage.getItem("accessToken")

    // Double-check for duplicates before submitting
    const duplicateCheck = ingredients.find(
      (ing) =>
        ing.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        (!editingIngredient || ing.id !== editingIngredient.id),
    )

    if (duplicateCheck) {
      showErrorMessage("An ingredient with this name already exists")
      setIsSubmitting(false)
      return
    }

    const payload = {
      name: formData.name.trim(),
      unit: formData.unit,
      quantity: Number.parseFloat(formData.quantity),
      purchase_price: Number.parseFloat(formData.purchase_price),
      waste_percent: Number.parseFloat(formData.waste_percent),
      supplier: formData.supplier,
    }

    try {
      let response, updatedIngredient
      if (editingIngredient) {
        // PATCH for editing
        response = await fetch(`https://busy-fool-backend.vercel.app/ingredients/${editingIngredient.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
        if (response.ok) {
          updatedIngredient = await response.json()
          setIngredients((prev) => prev.map((ing) => (ing.id === editingIngredient.id ? updatedIngredient : ing)))
          resetForm()
          showSuccessMessage("Ingredient updated successfully!")
        } else {
          const errorData = await response.json()
          showErrorMessage(errorData.message || "Failed to update ingredient")
        }
      } else {
        // POST for adding
        response = await fetch("https://busy-fool-backend.vercel.app/ingredients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
        if (response.ok) {
          const newIngredient = await response.json()
          // Ensure no duplicates in local state
          setIngredients((prev) => {
            const exists = prev.find((ing) => ing.name.toLowerCase() === newIngredient.name.toLowerCase())
            if (exists) return prev
            return [...prev, newIngredient]
          })
          resetForm()
          showSuccessMessage("Ingredient added successfully!")
        } else {
          const errorData = await response.json()
          showErrorMessage(errorData.message || "Failed to add ingredient")
        }
      }
    } catch (error) {
      showErrorMessage("An error occurred. Please try again.")
    }
    setIsSubmitting(false)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      unit: "",
      quantity: "",
      purchase_price: "",
      waste_percent: "",
      supplier: "",
    })
    setFormErrors({})
    setShowAddModal(false)
    setEditingIngredient(null)
  }

  const handleEdit = (ingredient) => {
    setEditingIngredient(ingredient)
    setFormData({
      name: ingredient.name,
      unit: ingredient.unit,
      quantity: ingredient.quantity?.toString() || "",
      purchase_price: ingredient.purchase_price.toString(),
      waste_percent: ingredient.waste_percent.toString(),
      supplier: ingredient.supplier,
    })
    setShowAddModal(true)
  }

  const getCostValue = (ingredient) => {
    if (ingredient.unit === "ml" || ingredient.unit === "L") {
      return ingredient.cost_per_ml !== null ? `$${ingredient.cost_per_ml}` : "-"
    }
    if (ingredient.unit === "g" || ingredient.unit === "kg") {
      return ingredient.cost_per_gram !== null ? `$${ingredient.cost_per_gram}` : "-"
    }
    return ingredient.cost_per_unit !== null ? `$${ingredient.cost_per_unit}` : "-"
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this ingredient?")) {
      setIsSubmitting(true)
      const token = localStorage.getItem("accessToken")
      try {
        await fetch(`https://busy-fool-backend.vercel.app/ingredients/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setIngredients((prev) => prev.filter((ing) => ing.id !== id))
        showSuccessMessage("Ingredient deleted successfully!")
      } catch (error) {
        showErrorMessage("Failed to delete ingredient.")
      }
      setIsSubmitting(false)
    }
  }

  const handleCategoryChange = (category) => {
    setFormData((prev) => ({
      ...prev,
      category,
      waste_percent: wastePresets[category]?.toString() || "",
    }))
  }

  const getStockStatus = (level) => {
    if (level <= 5) return { color: "destructive", text: "Low Stock", icon: AlertTriangle }
    if (level <= 10) return { color: "default", text: "Medium", icon: AlertCircle }
    return { color: "secondary", text: "Good", icon: Package }
  }

  const exportToCSV = async () => {
    setIsSubmitting(true)
    showSuccessMessage("Exporting CSV...")
    await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate async operation

    const headers = ["Name", "Unit", "Quantity", "Purchase Price", "Waste %", "Supplier", "Cost Per Subunit"]

    const csvContent = [
      headers.join(","),
      ...ingredients.map((ing) => {
        // Calculate the cost per subunit using the same logic as getCostValue
        let costPerSubunit = ""
        if (ing.unit === "ml" || ing.unit === "L") {
          costPerSubunit = ing.cost_per_ml !== null && ing.cost_per_ml !== undefined ? ing.cost_per_ml.toFixed(4) : ""
        } else if (ing.unit === "g" || ing.unit === "kg") {
          costPerSubunit =
            ing.cost_per_gram !== null && ing.cost_per_gram !== undefined ? ing.cost_per_gram.toFixed(4) : ""
        } else {
          costPerSubunit =
            ing.cost_per_unit !== null && ing.cost_per_unit !== undefined ? ing.cost_per_unit.toFixed(4) : ""
        }

        return [
          ing.name ?? "",
          ing.unit ?? "",
          ing.quantity ?? "", // Changed from ing.package_size to ing.quantity
          ing.purchase_price ?? "",
          ing.waste_percent ?? "",
          ing.supplier ?? "",
          costPerSubunit,
        ]
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(",")
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "busy-fool-ingredients.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setIsSubmitting(false)
    showSuccessMessage("CSV exported successfully!")
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  }

  const handleImportCSV = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  setCsvImporting(true)
  showSuccessMessage("Importing CSV... Please wait.")
  const token = localStorage.getItem("accessToken")
  const formData = new FormData()
  formData.append("file", file)
  // Log FormData for debugging
  console.log("CSV Import FormData:", formData.get("file"))

    try {
      const response = await fetch("https://busy-fool-backend.vercel.app/ingredients/import-csv", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      if (response.ok) {
        const result = await response.json()
        if (result.importedIngredients) {
          // Filter out duplicates based on name (case-insensitive)
          const existingNames = ingredients.map((ing) => ing.name.toLowerCase())
          const uniqueImports = result.importedIngredients.filter(
            (newIng) => !existingNames.includes(newIng.name.toLowerCase()),
          )

          if (uniqueImports.length > 0) {
            setIngredients((prev) => [...prev, ...uniqueImports])
            showSuccessMessage(
              `Imported ${uniqueImports.length} unique ingredients. ${result.importedIngredients.length - uniqueImports.length} duplicates were skipped.`,
            )
          } else {
            showSuccessMessage("No new ingredients imported. All ingredients already exist.")
          }
        } else {
          showErrorMessage("No ingredients imported.")
        }
      } else {
        const errorData = await response.json()
        showErrorMessage(errorData.message || "Failed to import CSV.")
      }
    } catch (error) {
      showErrorMessage("An error occurred during import.")
    }
    setCsvImporting(false)
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } },
  }

  return (
    <TooltipProvider>
      <SuccessToast />
      <ErrorToast />
      <div className="min-h-screen bg-gradient-to-br bg-white ">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="md:pl-64 flex flex-col min-h-screen">
          <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 space-y-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
              >
                <div>
                  <h1 className="text-3xl font-bold text-amber-900 tracking-tight">Ingredient Management</h1>
                  <p className="text-amber-700 mt-1 text-sm">Optimize your coffee shop's inventory with ease</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#6B4226] to-[#5a3620] text-white px-6 py-2 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all shadow-sm"
                    disabled={isSubmitting}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Ingredient
                  </Button>

                  {/* Export CSV Button */}
                  <Button
                    onClick={exportToCSV}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#6B4226] to-[#5a3620] text-white px-6 py-2 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all shadow-sm"
                    disabled={isSubmitting}
                    type="button"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export CSV
                  </Button>

                  {/* Import CSV Button */}
                  <input
                    type="file"
                    accept=".csv"
                    style={{ display: "none" }}
                    onChange={handleImportCSV}
                    disabled={csvImporting}
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="w-full sm:w-auto cursor-pointer">
                    <Button
                      className="w-full sm:w-auto bg-gradient-to-r from-[#55341E] to-[#6B4226] text-white px-6 py-2 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all shadow-sm"
                      disabled={csvImporting}
                      type="button"
                      asChild
                    >
                      <span>
                        {csvImporting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {csvImporting ? "Importing..." : "Import CSV"}
                      </span>
                    </Button>
                  </label>
                </div>
              </motion.div>

              {/* Filters */}
              <Card className="mb-6 bg-white/90 backdrop-blur-md sticky top-0 z-10 border-amber-100">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
                        <Input
                          placeholder="Search ingredients..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-10 border-amber-200 focus:ring-amber-500 transition-all duration-200 hover:border-amber-300"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card className="bg-white/90 backdrop-blur-md border-amber-100">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-amber-100/50 border-b sticky top-0 z-10">
                        <tr>
                          {[
                            "Name",
                            "Unit",
                            "Quantity",
                            "Purchase Price",
                            "Waste %",
                            "Supplier",
                            "Cost Per Subunit",
                            "Actions",
                          ].map((header) => (
                            <th key={header} className="text-left p-4 font-semibold text-amber-900 tracking-tight">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {isLoading ? (
                            <tr>
                              <td colSpan={8} className="px-6 py-12 text-center">
                                <div className="flex items-center justify-center gap-3">
                                  <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                                  <span className="text-gray-600">Loading ingredients...</span>
                                </div>
                              </td>
                            </tr>
                          ) : filteredIngredients.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-10 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <Package className="w-10 h-10 text-gray-400 mb-1" strokeWidth={1.5} />
                                  <span className="text-lg font-semibold text-gray-700">No ingredients found</span>
                                  <span className="text-amber-600 text-sm">
                                    Add your first ingredient to get started!
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredIngredients.map((ingredient) => (
                              <motion.tr
                                key={ingredient.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="border-b hover:bg-amber-50/30 transition-all duration-200"
                              >
                                <td className="p-4 font-medium text-gray-900">{ingredient.name}</td>
                                <td className="p-4">{ingredient.unit}</td>
                                <td className="p-4">{ingredient.quantity}</td>
                                <td className="p-4">${ingredient.purchase_price}</td>
                                <td className="p-4">{ingredient.waste_percent}%</td>
                                <td className="p-4">{ingredient.supplier}</td>
                                <td className="p-4">{getCostValue(ingredient)}</td>
                                <td className="p-4">
                                  <div className="flex justify-center gap-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit(ingredient)}
                                            disabled={isSubmitting}
                                            className="hover:bg-amber-100"
                                          >
                                            <Pencil className="w-4 h-4 text-amber-600" />
                                          </Button>
                                        </motion.div>
                                      </TooltipTrigger>
                                      <TooltipContent>Edit ingredient</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDelete(ingredient.id)}
                                            disabled={isSubmitting}
                                            className="hover:bg-red-100"
                                          >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                          </Button>
                                        </motion.div>
                                      </TooltipTrigger>
                                      <TooltipContent>Delete ingredient</TooltipContent>
                                    </Tooltip>
                                  </div>
                                </td>
                              </motion.tr>
                            ))
                          )}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Add/Edit Modal */}
              <AnimatePresence>
                {showAddModal && (
                  <Dialog open={showAddModal} onOpenChange={(open) => !open && resetForm()}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md border-amber-100">
                      <DialogHeader>
                        <DialogTitle className="text-amber-900 text-xl tracking-tight">
                          {editingIngredient ? "Edit Ingredient" : "Add New Ingredient"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-5 py-4">
                        <div>
                          <Label htmlFor="name" className="text-amber-900 font-medium">
                            Name *
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Oat Milk"
                            className={`mt-1 ${formErrors.name ? "border-red-500" : "border-amber-200 focus:ring-amber-500"} transition-all duration-200`}
                          />
                          {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                        </div>
                        <div>
                          <Label htmlFor="unit" className="text-amber-900 font-medium">
                            Unit *
                          </Label>
                          <Select
                            value={formData.unit}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
                          >
                            <SelectTrigger
                              className={`mt-1 ${formErrors.unit ? "border-red-500" : "border-amber-200 focus:ring-amber-500"}`}
                            >
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {unitOptions.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formErrors.unit && <p className="text-red-500 text-xs mt-1">{formErrors.unit}</p>}
                        </div>
                        <div>
                          <Label htmlFor="quantity" className="text-amber-900 font-medium">
                            Quantity *
                          </Label>
                          <Input
                            id="quantity"
                            type="number"
                            step="1"
                            value={formData.quantity}
                            onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                            placeholder="e.g., 2"
                            className={`mt-1 ${formErrors.quantity ? "border-red-500" : "border-amber-200 focus:ring-amber-500"}`}
                          />
                          {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
                        </div>
                        <div>
                          <Label htmlFor="purchase_price" className="text-amber-900 font-medium">
                            Purchase Price ($) *
                          </Label>
                          <Input
                            id="purchase_price"
                            type="number"
                            step="0.01"
                            value={formData.purchase_price}
                            onChange={(e) => setFormData((prev) => ({ ...prev, purchase_price: e.target.value }))}
                            placeholder="0.00"
                            className={`mt-1 ${formErrors.purchase_price ? "border-red-500" : "border-amber-200 focus:ring-amber-500"}`}
                          />
                          {formErrors.purchase_price && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.purchase_price}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="waste_percent" className="text-amber-900 font-medium">
                            Waste % *
                          </Label>
                          <Input
                            id="waste_percent"
                            type="number"
                            step="0.1"
                            value={formData.waste_percent}
                            onChange={(e) => setFormData((prev) => ({ ...prev, waste_percent: e.target.value }))}
                            placeholder="0"
                            className={`mt-1 ${formErrors.waste_percent ? "border-red-500" : "border-amber-200 focus:ring-amber-500"}`}
                          />
                          {formErrors.waste_percent && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.waste_percent}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="supplier" className="text-amber-900 font-medium">
                            Supplier *
                          </Label>
                          <Select
                            value={formData.supplier}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, supplier: value }))}
                          >
                            <SelectTrigger
                              className={`mt-1 ${formErrors.supplier ? "border-red-500" : "border-amber-200 focus:ring-amber-500"}`}
                            >
                              <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                            <SelectContent>
                              {supplierOptions.map((supplier) => (
                                <SelectItem key={supplier} value={supplier}>
                                  {supplier}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formErrors.supplier && <p className="text-red-500 text-xs mt-1">{formErrors.supplier}</p>}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={resetForm}
                          className="border-amber-300 hover:bg-amber-100 transition-all duration-200 bg-transparent"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          className="bg-amber-600 hover:bg-amber-700 transition-all duration-200"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            `${editingIngredient ? "Update" : "Add"} Ingredient`
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
