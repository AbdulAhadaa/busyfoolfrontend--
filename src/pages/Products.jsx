"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Sidebar } from "../components/Sidebar"
import { Navbar } from "../components/Navbar"

import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Search,
  TrendingUp,
  AlertTriangle,
  Coffee,
  Edit,
  Trash2,
  Calculator,
  ChevronDown,
  DollarSign,
  Package,
  ArrowRight,
  BarChart3,
  Sparkles,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  Star,
  Flame,
  ArrowUpRight,
  Shuffle,
  ArrowLeftRight,
  Info,
} from "lucide-react"

export default function Products() {
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // What-If Modal State
  const [showWhatIfModal, setShowWhatIfModal] = useState(false)
  const [whatIfProduct, setWhatIfProduct] = useState(null)
  const [whatIfPrice, setWhatIfPrice] = useState("")
  const [whatIfLoading, setWhatIfLoading] = useState(false)
  const [whatIfError, setWhatIfError] = useState("")
  const [whatIfResult, setWhatIfResult] = useState(null)

  // Milk Swap Modal State
  const [showMilkSwapModal, setShowMilkSwapModal] = useState(false)
  const [milkSwapProduct, setMilkSwapProduct] = useState(null)
  const [milkSwapLoading, setMilkSwapLoading] = useState(false)
  const [milkSwapError, setMilkSwapError] = useState("")
  const [milkSwapResult, setMilkSwapResult] = useState(null)

  // Inline What-If simulation state
  const [simProductId, setSimProductId] = useState(null)
  const [simPrice, setSimPrice] = useState("")
  const [simLoading, setSimLoading] = useState(false)
  const [simError, setSimError] = useState("")
  const [simResult, setSimResult] = useState(null)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("margin")
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showEditProduct, setShowEditProduct] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "",
    sell_price: "",
    ingredients: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [viewMode, setViewMode] = useState("cards") // cards or table
  const [showQuickWins, setShowQuickWins] = useState(true)

  // Sample products data based on the brief
  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    sell_price: "",
    ingredients: [],
  })
  const [allIngredients, setAllIngredients] = useState([])
  const [ingredients, setIngredients] = useState([]) // For table view
  const [editingIngredient, setEditingIngredient] = useState(null)
  const [ingredientEditData, setIngredientEditData] = useState({
    name: "",
    unit: "",
    cost_per_unit: "",
    cost_per_ml: "",
  })
  const [stockData, setStockData] = useState([]) // Add stock data state

  // Helper function to convert units to a common base for comparison
  const convertToBaseUnit = useCallback((quantity, unit) => {
    const qty = Number(quantity) || 0
    switch (unit?.toLowerCase()) {
      case "kg":
        return qty * 1000 // Convert kg to g
      case "l":
        return qty * 1000 // Convert L to ml
      case "g":
      case "ml":
      case "unit":
      default:
        return qty // Already in base unit
    }
  }, [])

  // Helper function to check if selected quantity exceeds available stock (with unit conversion)
  const checkStockExceeded = useCallback(
    (selectedQuantity, selectedUnit, availableStock, stockUnit) => {
      const selectedInBaseUnit = convertToBaseUnit(selectedQuantity, selectedUnit)
      const availableInBaseUnit = convertToBaseUnit(availableStock, stockUnit)
      return selectedInBaseUnit > availableInBaseUnit
    },
    [convertToBaseUnit],
  )

  // Helper function to get ingredient price - FIXED to use dynamic API values
  const getIngredientPrice = useCallback((ingredient) => {
    // Use the dynamic values from the API response
    if (ingredient.unit === "ml" || ingredient.unit === "L") {
      return Number(ingredient.cost_per_ml) || 0
    }
    if (ingredient.unit === "g" || ingredient.unit === "kg") {
      return Number(ingredient.cost_per_gram) || 0
    }
    // For other units, use cost_per_unit
    return Number(ingredient.cost_per_unit) || 0
  }, [])

  // Helper function to get available stock for an ingredient
  const getAvailableStock = useCallback(
    (ingredientId) => {
      const stock = stockData.find((s) => s.ingredient?.id === ingredientId)
      return stock ? Number(stock.remaining_quantity) || 0 : 0
    },
    [stockData],
  )

  // Helper function to get stock unit for an ingredient
  const getStockUnit = useCallback(
    (ingredientId) => {
      const stock = stockData.find((s) => s.ingredient?.id === ingredientId)
      return stock ? stock.unit || "unit" : "unit"
    },
    [stockData],
  )

  // Helper function to toggle ingredient in form data
  const toggleIngredient = useCallback((ingredient, checked) => {
    setFormData((prev) => {
      if (checked) {
        if (prev.ingredients.some((i) => i.id === ingredient.id)) return prev
        return {
          ...prev,
          ingredients: [...prev.ingredients, { ...ingredient, selectedQuantity: 1, is_optional: false }],
        }
      } else {
        return {
          ...prev,
          ingredients: prev.ingredients.filter((i) => i.id !== ingredient.id),
        }
      }
    })
  }, [])

  // Helper function to update ingredient in form data
  const updateIngredient = useCallback((ingredientId, changes) => {
    setFormData((prev) => {
      const updated = prev.ingredients.map((i) => (i.id === ingredientId ? { ...i, ...changes } : i))
      const deduped = updated.filter((ing, idx, arr) => arr.findIndex((ii) => ii.id === ing.id) === idx)
      return {
        ...prev,
        ingredients: deduped,
      }
    })
  }, [])

  // Enhanced Error Toast Component with better styling and stock info
  const ErrorToast = () => (
    <AnimatePresence>
      {showErrorToast && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 right-4 z-[60] bg-white rounded-xl shadow-2xl border-l-4 border-red-500 p-4 flex items-start gap-3 max-w-md"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Insufficient Stock</p>
            <p className="text-sm text-gray-600 mt-1">{errorMessage}</p>
            <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Quick Fix</span>
              </div>
              <p className="text-xs text-blue-700">
                • Check ingredient stock levels
                <br />• Reduce ingredient quantities
                <br />• Purchase more stock for this ingredient
              </p>
            </div>
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

  useEffect(() => {
    setIsLoadingProducts(true)
    // Fetch products and sales, then merge numberOfSales into each product
    const fetchProductsAndSales = async () => {
      const token = localStorage.getItem("accessToken")
      try {
        // Fetch products
        const productsRes = await fetch("http://localhost:3006/products", {
          headers: { Authorization: `Bearer ${token}` },
        })
        let productsData = []
        if (productsRes.ok) {
          productsData = await productsRes.json()
        }

        // Fetch sales
        const salesRes = await fetch("http://localhost:3006/sales", {
          headers: { Authorization: `Bearer ${token}` },
        })
        let salesData = []
        if (salesRes.ok) {
          salesData = await salesRes.json()
        }

        // Aggregate sales by productId
        const salesByProduct = {}
        salesData.forEach((sale) => {
          const productId = sale.product?.id
          const qty = Number(sale.quantity) || 0
          if (productId) {
            salesByProduct[productId] = (salesByProduct[productId] || 0) + qty
          }
        })

        // Inject numberOfSales into each product
        const mergedProducts = productsData.map((product) => ({
          ...product,
          numberOfSales: salesByProduct[product.id] || 0,
        }))
        setProducts(mergedProducts)
      } catch (error) {
        console.error("Error fetching products:", error)
      }
      setIsLoadingProducts(false)
    }
    fetchProductsAndSales()

    // Fetch all ingredients for selection and table
    const fetchIngredients = async () => {
      const token = localStorage.getItem("accessToken")
      try {
        const response = await fetch("http://localhost:3006/ingredients", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setAllIngredients(data)
          setIngredients(data)
        }
      } catch (error) {
        console.error("Error fetching ingredients:", error)
      }
    }
    fetchIngredients()

    // Fetch stock data
    const fetchStock = async () => {
      const token = localStorage.getItem("accessToken")
      try {
        const response = await fetch("http://localhost:3006/stock", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setStockData(data)
        }
      } catch (error) {
        console.error("Error fetching stock:", error)
      }
    }
    fetchStock()
  }, [])

  // Inline What-If handler
  const handleSimulate = async (productId) => {
    setSimLoading(true)
    setSimError("")
    setSimResult(null)
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch("http://localhost:3006/products/what-if", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productIds: [productId],
          priceAdjustment: Number(simPrice) || 0,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSimResult(Array.isArray(data) ? data[0] : data)
      } else {
        const err = await res.json()
        setSimError(err.message || "Failed to calculate what-if")
      }
    } catch (e) {
      setSimError("An error occurred. Please try again.")
    }
    setSimLoading(false)
  }

  // Enhanced error handling function
  const handleApiError = (error, response) => {
    console.log("API Error Details:", { error, response, status: response?.status })

    // Check if it's a stock-related error
    if (response?.status === 400 && error?.message) {
      const message = error.message.toLowerCase()
      if (message.includes("no available stock") || message.includes("insufficient") || message.includes("stock")) {
        setErrorMessage(error.message)
        setShowErrorToast(true)
        setTimeout(() => setShowErrorToast(false), 7000) // Show for 7 seconds
        return true // Indicates we handled the error
      }
    }
    return false // Indicates we didn't handle the error
  }

  // Milk Swap Modal Component
  const MilkSwapModal = () => {
    const [selectedOriginalIngredient, setSelectedOriginalIngredient] = useState("")
    const [selectedNewIngredient, setSelectedNewIngredient] = useState("")
    const [upcharge, setUpcharge] = useState("")
    const [localLoading, setLocalLoading] = useState(false)
    const [localError, setLocalError] = useState("")
    const [localResult, setLocalResult] = useState(null)
    const [step, setStep] = useState(0) // 0: selection, 1: result

    React.useEffect(() => {
      if (showMilkSwapModal && milkSwapProduct) {
        setSelectedOriginalIngredient("")
        setSelectedNewIngredient("")
        setUpcharge("")
        setLocalError("")
        setLocalResult(null)
        setStep(0)
      }
    }, [showMilkSwapModal, milkSwapProduct])

    const handleCalculateSwap = async () => {
      if (!milkSwapProduct || !selectedOriginalIngredient || !selectedNewIngredient) {
        setLocalError("Please select both original and new ingredients.")
        return
      }

      if (selectedOriginalIngredient === selectedNewIngredient) {
        setLocalError("Please select different ingredients for the swap.")
        return
      }

      const upchargeValue = Number.parseFloat(upcharge) || 0
      if (upchargeValue < 0) {
        setLocalError("Upcharge cannot be negative.")
        return
      }

      setLocalLoading(true)
      setLocalError("")

      try {
        const token = localStorage.getItem("accessToken")
        const res = await fetch("http://localhost:3006/products/milk-swap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: milkSwapProduct.id,
            originalIngredientId: selectedOriginalIngredient,
            newIngredientId: selectedNewIngredient,
            upcharge: upchargeValue,
          }),
        })

        if (res.ok) {
          const result = await res.json()
          setLocalResult(result)
          setStep(1)
        } else {
          const err = await res.json()
          setLocalError(err.message || "Failed to calculate milk swap analysis.")
        }
      } catch (e) {
        setLocalError("An error occurred. Please try again.")
      }

      setLocalLoading(false)
    }

    const handleClose = () => {
      setShowMilkSwapModal(false)
      setMilkSwapProduct(null)
      setSelectedOriginalIngredient("")
      setSelectedNewIngredient("")
      setUpcharge("")
      setLocalError("")
      setLocalResult(null)
      setStep(0)
    }

    if (!showMilkSwapModal || !milkSwapProduct) return null

    // Get product ingredients for selection
    const productIngredients = Array.isArray(milkSwapProduct.ingredients)
      ? milkSwapProduct.ingredients.map((i) => ({
          id: i.ingredient?.id || i.id,
          name: i.ingredient?.name || i.name,
        }))
      : []

    // Get all available ingredients for new ingredient selection
    const availableIngredients = allIngredients.filter(
      (ing) => !productIngredients.some((prodIng) => prodIng.id === ing.id),
    )

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                  <Shuffle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Ingredient Swap Analysis</h2>
                  <p className="text-sm text-gray-500">{milkSwapProduct.name}</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {step === 0 && (
              <div className="space-y-6">
                {/* Current Product Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Current Product Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Current Price:</span>
                      <p className="font-semibold text-gray-900">
                        ${Number(milkSwapProduct.sell_price || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Current Margin:</span>
                      <p
                        className={`font-semibold ${Number(milkSwapProduct.margin_percent || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {Number(milkSwapProduct.margin_percent || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ingredient Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Ingredient (to replace)
                    </label>
                    <select
                      value={selectedOriginalIngredient}
                      onChange={(e) => {
                        setSelectedOriginalIngredient(e.target.value)
                        setLocalError("")
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all bg-white"
                    >
                      <option value="">Select ingredient to replace</option>
                      {productIngredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-center py-2">
                    <ArrowLeftRight className="w-6 h-6 text-purple-600" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Ingredient (replacement)</label>
                    <select
                      value={selectedNewIngredient}
                      onChange={(e) => {
                        setSelectedNewIngredient(e.target.value)
                        setLocalError("")
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all bg-white"
                    >
                      <option value="">Select replacement ingredient</option>
                      {allIngredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} - ${getIngredientPrice(ingredient).toFixed(4)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upcharge ($) <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={upcharge}
                      onChange={(e) => {
                        setUpcharge(e.target.value)
                        setLocalError("")
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Additional charge to customer for premium ingredient</p>
                  </div>
                </div>

                {localError && <p className="text-red-500 text-sm">{localError}</p>}

                <button
                  onClick={handleCalculateSwap}
                  disabled={localLoading || !selectedOriginalIngredient || !selectedNewIngredient}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {localLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Shuffle className="w-4 h-4" />
                      Calculate Swap Impact
                    </>
                  )}
                </button>
              </div>
            )}

            {step === 1 && localResult && (
              <div className="space-y-6">
                {/* Results Header */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mx-auto mb-4">
                    <Shuffle className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Swap Analysis Complete</h3>
                  <p className="text-gray-600">Here's how the ingredient swap would affect your margins</p>
                </div>

                {/* Results Comparison */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Margin Comparison</h4>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3 border-l-4 border-gray-400">
                        <span className="text-xs text-gray-500">Original Margin</span>
                        <p className="text-lg font-bold text-gray-900">
                          {Number(localResult.originalMargin || 0).toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border-l-4 border-purple-400">
                        <span className="text-xs text-gray-500">New Margin</span>
                        <p
                          className={`text-lg font-bold ${
                            Number(localResult.newMargin || 0) >= Number(localResult.originalMargin || 0)
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {Number(localResult.newMargin || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* Upcharge Coverage */}
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Upcharge Coverage</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            localResult.upchargeCovered ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {localResult.upchargeCovered ? "Covered" : "Not Covered"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {localResult.upchargeCovered
                          ? "The upcharge is sufficient to maintain profitability"
                          : "The upcharge may not fully cover the increased cost"}
                      </p>
                    </div>
                  </div>

                  {/* Impact Summary */}
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">Impact Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-600">Margin Change:</span>
                        <span
                          className={`font-semibold ${
                            Number(localResult.newMargin || 0) - Number(localResult.originalMargin || 0) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {Number(localResult.newMargin || 0) - Number(localResult.originalMargin || 0) >= 0 ? "+" : ""}
                          {(Number(localResult.newMargin || 0) - Number(localResult.originalMargin || 0)).toFixed(2)}%
                        </span>
                      </div>
                      {upcharge && Number.parseFloat(upcharge) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-purple-600">Applied Upcharge:</span>
                          <span className="font-semibold text-gray-700">
                            +${Number.parseFloat(upcharge).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(0)}
                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Try Different Swap
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  // What-If Modal Component
  const WhatIfModal = () => {
    const [localPrice, setLocalPrice] = useState("")
    const [localLoading, setLocalLoading] = useState(false)
    const [localError, setLocalError] = useState("")
    const [localResult, setLocalResult] = useState(null)
    const [step, setStep] = useState(0) // 0: input, 1: result

    React.useEffect(() => {
      if (showWhatIfModal && whatIfProduct) {
        setLocalPrice(String(whatIfProduct.sell_price || ""))
        setLocalError("")
        setLocalResult(null)
        setStep(0)
      }
    }, [showWhatIfModal, whatIfProduct])

    const handleAnalyze = async () => {
      if (!whatIfProduct || !localPrice) {
        setLocalError("Please enter a valid price.")
        return
      }

      const newPrice = Number.parseFloat(localPrice)
      if (isNaN(newPrice) || newPrice <= 0) {
        setLocalError("Please enter a valid price greater than 0.")
        return
      }

      setLocalLoading(true)
      setLocalError("")

      try {
        const token = localStorage.getItem("accessToken")
        const res = await fetch(`http://localhost:3006/products/${whatIfProduct.id}/quick-action`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ new_sell_price: newPrice }),
        })

        if (res.ok) {
          const result = await res.json()
          setLocalResult(result)
          setStep(1)
        } else {
          const err = await res.json()
          setLocalError(err.message || "Failed to calculate what-if analysis.")
        }
      } catch (e) {
        setLocalError("An error occurred. Please try again.")
      }

      setLocalLoading(false)
    }

    const handleApplyChanges = () => {
      if (localResult) {
        // Update the product in the main products list
        setProducts((prev) => prev.map((p) => (p.id === localResult.id ? { ...p, ...localResult } : p)))
        setShowWhatIfModal(false)
        setShowSuccessToast(true)
        setTimeout(() => setShowSuccessToast(false), 3000)
      }
    }

    const handleClose = () => {
      setShowWhatIfModal(false)
      setWhatIfProduct(null)
      setLocalPrice("")
      setLocalError("")
      setLocalResult(null)
      setStep(0)
    }

    if (!showWhatIfModal || !whatIfProduct) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B4226] to-[#5a3620] flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">What-If Analysis</h2>
                  <p className="text-sm text-gray-500">{whatIfProduct.name}</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {step === 0 && (
              <div className="space-y-6">
                {/* Current Product Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Current Product Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Current Price:</span>
                      <p className="font-semibold text-gray-900">${Number(whatIfProduct.sell_price || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Cost:</span>
                      <p className="font-semibold text-gray-900">${Number(whatIfProduct.total_cost || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Current Margin:</span>
                      <p
                        className={`font-semibold ${Number(whatIfProduct.margin_amount || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        ${Number(whatIfProduct.margin_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Margin %:</span>
                      <p
                        className={`font-semibold ${Number(whatIfProduct.margin_percent || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {Number(whatIfProduct.margin_percent || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* New Price Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Sell Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={localPrice}
                    onChange={(e) => {
                      setLocalPrice(e.target.value)
                      setLocalError("")
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B4226] focus:border-transparent transition-all text-lg font-semibold"
                    placeholder="Enter new price"
                    autoFocus
                  />
                  {localError && <p className="text-red-500 text-sm mt-2">{localError}</p>}
                </div>

                {/* Price Comparison */}
                {localPrice && !isNaN(Number.parseFloat(localPrice)) && Number.parseFloat(localPrice) > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Price Change Preview</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-600">Current → New:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${Number(whatIfProduct.sell_price || 0).toFixed(2)}</span>
                        <ArrowRight className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-blue-700">${Number.parseFloat(localPrice).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-blue-600">Difference:</span>
                      <span
                        className={`font-semibold ${Number.parseFloat(localPrice) - Number(whatIfProduct.sell_price || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {Number.parseFloat(localPrice) - Number(whatIfProduct.sell_price || 0) >= 0 ? "+" : ""}$
                        {(Number.parseFloat(localPrice) - Number(whatIfProduct.sell_price || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={
                    localLoading ||
                    !localPrice ||
                    isNaN(Number.parseFloat(localPrice)) ||
                    Number.parseFloat(localPrice) <= 0
                  }
                  className="w-full bg-gradient-to-r from-[#6B4226] to-[#5a3620] text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {localLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4" />
                      Analyze Impact
                    </>
                  )}
                </button>
              </div>
            )}

            {step === 1 && localResult && (
              <div className="space-y-6">
                {/* Results Header */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Analysis Complete</h3>
                  <p className="text-gray-600">Here's how the price change would affect your product</p>
                </div>

                {/* Results Comparison */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Updated Product Metrics</h4>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3">
                        <span className="text-xs text-gray-500">New Price</span>
                        <p className="text-lg font-bold text-gray-900">
                          ${Number(localResult.sell_price || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <span className="text-xs text-gray-500">Total Cost</span>
                        <p className="text-lg font-bold text-gray-900">
                          ${Number(localResult.total_cost || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">New Profit Margin</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            localResult.status === "profitable"
                              ? "bg-green-100 text-green-700"
                              : localResult.status === "losing money"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {localResult.status}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p
                            className={`text-2xl font-bold ${Number(localResult.margin_percent || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {Number(localResult.margin_percent || 0) > 0 ? "+" : ""}
                            {Number(localResult.margin_percent || 0).toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-600">
                            ${Number(localResult.margin_amount || 0) > 0 ? "+" : ""}
                            {Number(localResult.margin_amount || 0).toFixed(2)} per sale
                          </p>
                        </div>
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              Number(localResult.margin_percent || 0) >= 0 ? "bg-green-400" : "bg-red-400"
                            }`}
                            style={{
                              width: `${Math.max(0, Math.min(100, (Number(localResult.margin_percent || 0) + 20) * 1.25))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Impact Summary */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Impact Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-600">Margin Change:</span>
                        <span
                          className={`font-semibold ${
                            Number(localResult.margin_amount || 0) - Number(whatIfProduct.margin_amount || 0) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {Number(localResult.margin_amount || 0) - Number(whatIfProduct.margin_amount || 0) >= 0
                            ? "+"
                            : ""}
                          $
                          {(Number(localResult.margin_amount || 0) - Number(whatIfProduct.margin_amount || 0)).toFixed(
                            2,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Percentage Change:</span>
                        <span
                          className={`font-semibold ${
                            Number(localResult.margin_percent || 0) - Number(whatIfProduct.margin_percent || 0) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {Number(localResult.margin_percent || 0) - Number(whatIfProduct.margin_percent || 0) >= 0
                            ? "+"
                            : ""}
                          {(
                            Number(localResult.margin_percent || 0) - Number(whatIfProduct.margin_percent || 0)
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      {whatIfProduct.numberOfSales > 0 && (
                        <div className="flex justify-between">
                          <span className="text-blue-600">Daily Impact ({whatIfProduct.numberOfSales} sales):</span>
                          <span
                            className={`font-semibold ${
                              (Number(localResult.margin_amount || 0) - Number(whatIfProduct.margin_amount || 0)) *
                                whatIfProduct.numberOfSales >=
                              0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {(Number(localResult.margin_amount || 0) - Number(whatIfProduct.margin_amount || 0)) *
                              whatIfProduct.numberOfSales >=
                            0
                              ? "+"
                              : ""}
                            $
                            {(
                              (Number(localResult.margin_amount || 0) - Number(whatIfProduct.margin_amount || 0)) *
                              whatIfProduct.numberOfSales
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(0)}
                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Try Different Price
                  </button>
                  <button
                    onClick={handleApplyChanges}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Apply Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  // PATCH and DELETE handlers for products
  const handleDeleteProduct = async (id) => {
    const token = localStorage.getItem("accessToken")
    if (!window.confirm("Are you sure you want to delete this product?")) return
    try {
      const response = await fetch(`http://localhost:3006/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id))
      } else {
        alert("Failed to delete product")
      }
    } catch (e) {
      alert("Error deleting product")
    }
  }

  // Map product ingredients to match ingredient selection UI for edit modal
  const handleEditProduct = (product) => {
    setSelectedProduct(product)
    // Map and deduplicate ingredients by id
    const rawIngredients = Array.isArray(product.ingredients)
      ? product.ingredients.map((i) => ({
          id: i.ingredient?.id || i.id,
          name: i.ingredient?.name || i.name,
          unit: i.unit || i.ingredient?.unit,
          selectedQuantity: i.selectedQuantity ?? i.quantity ?? 1,
          selectedUnit: i.selectedUnit,
          is_optional: i.is_optional || false,
        }))
      : []
    const dedupedIngredients = rawIngredients.filter((ing, idx, arr) => arr.findIndex((ii) => ii.id === ing.id) === idx)
    setEditFormData({
      name: product.name || "",
      category: product.category || "",
      sell_price: product.sell_price || "",
      ingredients: dedupedIngredients,
    })
    setShowEditProduct(true)
  }

  const handleEditIngredientCheck = (ingredient, checked) => {
    if (checked) {
      setEditFormData((prev) => ({
        ...prev,
        ingredients: [
          ...prev.ingredients,
          {
            ...ingredient,
            selectedQuantity: 1,
            is_optional: false,
          },
        ],
      }))
    } else {
      setEditFormData((prev) => ({
        ...prev,
        ingredients: prev.ingredients.filter((i) => i.id !== ingredient.id),
      }))
    }
  }

  const handleEditIngredientQuantity = (ingredientId, value) => {
    setEditFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((i) => (i.id === ingredientId ? { ...i, selectedQuantity: value } : i)),
    }))
  }

  const handleEditOptionalCheck = (ingredientId, checked) => {
    setEditFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((i) => (i.id === ingredientId ? { ...i, is_optional: checked } : i)),
    }))
  }

  const handleEditProductSubmit = async () => {
    if (!selectedProduct) return
    setIsSubmitting(true)
    const token = localStorage.getItem("accessToken")
    // Deduplicate and map to backend schema
    const seen = new Set()
    const selectedIngredients = editFormData.ingredients
      .filter((ing) => {
        if (!ing.id || seen.has(ing.id)) return false
        seen.add(ing.id)
        return true
      })
      .map((ing) => ({
        ingredientId: ing.id,
        quantity: Number(ing.selectedQuantity ?? ing.quantity ?? 1),
        unit: ing.selectedUnit || ing.unit,
        is_optional: !!ing.is_optional,
      }))
    const payload = {
      name: editFormData.name,
      category: editFormData.category,
      sell_price: Number.parseFloat(editFormData.sell_price),
      ingredients: selectedIngredients,
    }
    try {
      const response = await fetch(`http://localhost:3006/products/${selectedProduct.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const updated = await response.json()
        // Remap updated.ingredients to include full details for UI
        if (Array.isArray(updated.ingredients)) {
          updated.ingredients = updated.ingredients.map((i) => {
            return {
              id: i.ingredient?.id || i.id,
              name: i.ingredient?.name || i.name,
              unit: i.selectedUnit || i.unit || i.ingredient?.unit,
              selectedUnit: i.selectedUnit,
              selectedQuantity: i.selectedQuantity ?? i.quantity ?? 1,
              is_optional: i.is_optional || false,
              line_cost: i.line_cost,
            }
          })
        }
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        setShowEditProduct(false)
        setSelectedProduct(null)
      } else {
        const errorData = await response.json()
        // Use enhanced error handling
        if (!handleApiError(errorData, response)) {
          alert(errorData.message || "Failed to update product")
        }
      }
    } catch (error) {
      console.error("Edit product error:", error)
      alert("An error occurred. Please try again.")
    }
    setIsSubmitting(false)
  }

  // Edit Product Modal
  const EditProductModal = () => {
    const [step, setStep] = React.useState(0)
    const [search, setSearch] = React.useState("")
    const [localForm, setLocalForm] = React.useState(editFormData)
    const [error, setError] = React.useState("")
    const [success, setSuccess] = React.useState(false)

    // Sync localForm to parent state on submit
    React.useEffect(() => {
      if (showEditProduct && selectedProduct) {
        setStep(0)
        setLocalForm(editFormData)
        setError("")
        setSuccess(false)
      }
      if (!showEditProduct) {
        setStep(0)
        setLocalForm(editFormData)
        setError("")
        setSuccess(false)
      }
    }, [showEditProduct, selectedProduct, editFormData])

    // Helper to update ingredient in localForm
    const updateIngredient = (ingredientId, changes) => {
      setLocalForm((prev) => {
        // Update ingredient
        const updated = prev.ingredients.map((i) => (i.id === ingredientId ? { ...i, ...changes } : i))
        // Deduplicate by id
        const deduped = updated.filter((ing, idx, arr) => arr.findIndex((ii) => ii.id === ing.id) === idx)
        return {
          ...prev,
          ingredients: deduped,
        }
      })
    }

    // Helper to add/remove ingredient
    const toggleIngredient = (ingredient, checked) => {
      setLocalForm((prev) => {
        if (checked) {
          if (prev.ingredients.some((i) => i.id === ingredient.id)) return prev
          return {
            ...prev,
            ingredients: [
              ...prev.ingredients,
              {
                ...ingredient,
                selectedQuantity: 1,
                is_optional: false,
                selectedUnit: ingredient.unit === "L" ? "ml" : ingredient.unit === "kg" ? "g" : ingredient.unit,
              },
            ],
          }
        } else {
          return {
            ...prev,
            ingredients: prev.ingredients.filter((i) => i.id !== ingredient.id),
          }
        }
      })
    }

    if (!showEditProduct || !selectedProduct) return null

    // Step 0: Details
    const detailsStep = (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
          <input
            type="text"
            value={localForm.name}
            onChange={(e) => setLocalForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B4226] focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={localForm.category}
            onChange={(e) => setLocalForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B4226] focus:border-transparent transition-all bg-white"
          >
            <option value="">Select category</option>
            <option value="Coffee">Coffee</option>
            <option value="Food">Food</option>
            <option value="Iced Drinks">Iced Drinks</option>
            <option value="Pastries">Pastries</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sell Price ($)</label>
          <input
            type="number"
            step="0.01"
            value={localForm.sell_price}
            onChange={(e) => setLocalForm((f) => ({ ...f, sell_price: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B4226] focus:border-transparent transition-all"
          />
        </div>
      </div>
    )

    // Step 1: Ingredients (with search and stock info)
    const filteredIngredients = allIngredients.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    const ingredientsStep = (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Ingredients</label>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B4226] focus:border-transparent transition-all"
          />
        </div>
        <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50">
          {filteredIngredients.length === 0 && <div className="text-gray-400 text-sm">No ingredients found.</div>}
          {filteredIngredients.map((ingredient) => {
            const checked = localForm.ingredients.some((i) => i.id === ingredient.id)
            const selected = localForm.ingredients.find((i) => i.id === ingredient.id)
            const availableStock = getAvailableStock(ingredient.id)
            const stockUnit = getStockUnit(ingredient.id)

            return (
              <div key={ingredient.id} className="flex items-center gap-2 mb-2 p-2 bg-white rounded-lg border">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => toggleIngredient(ingredient, e.target.checked)}
                />
                <div className="flex-1">
                  <span className="text-gray-800 text-sm font-medium">{ingredient.name}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>${getIngredientPrice(ingredient).toFixed(4)}</span>
                    <span>•</span>
                    <span className={`${availableStock > 0 ? "text-green-600" : "text-red-600"}`}>
                      Stock: {availableStock} {stockUnit}
                    </span>
                  </div>
                </div>
                {checked && selected && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={selected.selectedQuantity !== undefined ? selected.selectedQuantity : ""}
                        onChange={(e) => {
                          const val = Math.max(1, Number.parseInt(e.target.value) || 1)
                          updateIngredient(ingredient.id, { selectedQuantity: val })
                        }}
                        className="w-16 px-2 py-1 border border-gray-200 rounded"
                        placeholder={ingredient.unit === "kg" ? "g" : ingredient.unit === "L" ? "ml" : ingredient.unit}
                      />
                      <span className="text-xs text-gray-500">
                        {ingredient.unit === "L"
                          ? "ml"
                          : ingredient.unit === "kg"
                            ? "g"
                            : ingredient.unit === "ml" || ingredient.unit === "g"
                              ? ingredient.unit
                              : "unit"}
                      </span>
                    </div>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={!!selected.is_optional}
                        onChange={(e) => updateIngredient(ingredient.id, { is_optional: e.target.checked })}
                      />
                      Optional
                    </label>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )

    // Step 2: Review & Save
    const reviewStep = (
      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-lg mb-2">Review Product</h3>
          <div className="mb-2">
            <span className="font-medium">Name:</span> {localForm.name}
          </div>
          <div className="mb-2">
            <span className="font-medium">Category:</span> {localForm.category}
          </div>
          <div className="mb-2">
            <span className="font-medium">Sell Price:</span> ${localForm.sell_price}
          </div>
          <div>
            <span className="font-medium">Ingredients:</span>
            <ul className="list-disc ml-6 mt-1">
              {localForm.ingredients.map((i) => {
                const availableStock = getAvailableStock(i.id)
                const stockUnit = getStockUnit(i.id)
                const willExceedStock = checkStockExceeded(
                  i.selectedQuantity,
                  i.selectedUnit || i.unit,
                  availableStock,
                  stockUnit,
                )

                return (
                  <li key={i.id} className={willExceedStock ? "text-red-600" : ""}>
                    {i.name} ({i.selectedQuantity} {i.selectedUnit || i.unit})
                    {i.is_optional && <span className="text-xs text-gray-500">(Optional)</span>}
                    {willExceedStock && (
                      <span className="text-xs text-red-500 ml-2">
                        ⚠️ Exceeds stock ({availableStock} {stockUnit} available)
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>
    )

    // Stepper UI
    const steps = ["Details", "Ingredients", "Review"]

    const handleNext = () => {
      if (step === 0) {
        if (!localForm.name || !localForm.category || !localForm.sell_price) {
          setError("Please fill all product details.")
          return
        }
      }
      if (step === 1) {
        if (localForm.ingredients.length === 0) {
          setError("Select at least one ingredient.")
          return
        }
        // Validate ingredient quantities
        const invalidQty = localForm.ingredients.some(
          (i) => isNaN(Number(i.selectedQuantity)) || Number(i.selectedQuantity) < 0.01,
        )
        if (invalidQty) {
          setError("All ingredient quantities must be at least 0.01.")
          return
        }
      }
      setError("")
      setStep((s) => s + 1)
    }
    const handleBack = () => {
      setError("")
      setStep((s) => s - 1)
    }

    const handleSubmit = async () => {
      setError("")
      setIsSubmitting(true)
      const token = localStorage.getItem("accessToken")
      // Deduplicate and map ingredients to backend schema
      const seen = new Set()
      const selectedIngredients = localForm.ingredients
        .filter((ing) => {
          if (!ing.id || seen.has(ing.id)) return false
          seen.add(ing.id)
          return true
        })
        .map((ing) => ({
          ingredientId: ing.id,
          quantity: Number(ing.selectedQuantity ?? ing.quantity ?? 1),
          unit: ing.selectedUnit || ing.unit,
          is_optional: !!ing.is_optional,
        }))
      const payload = {
        name: localForm.name,
        category: localForm.category,
        sell_price: Number.parseFloat(localForm.sell_price),
        ingredients: selectedIngredients,
      }
      try {
        const response = await fetch(`http://localhost:3006/products/${selectedProduct.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
        if (response.ok) {
          const updated = await response.json()
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          setShowEditProduct(false)
          setSelectedProduct(null)
          setSuccess(true)
          setTimeout(() => {
            setSuccess(false)
          }, 1200)
        } else {
          const errorData = await response.json()
          // Use enhanced error handling
          if (!handleApiError(errorData, response)) {
            setError(errorData.message || "Failed to update product")
          }
        }
      } catch (error) {
        console.error("Edit product error:", error)
        setError("An error occurred. Please try again.")
      }
      setIsSubmitting(false)
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
              <button
                onClick={() => {
                  setShowEditProduct(false)
                  setSelectedProduct(null)
                  setStep(0)
                  setLocalForm(editFormData)
                  setError("")
                  setSuccess(false)
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {/* Stepper */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((label, idx) => (
                <div key={label} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white transition-all ${
                      step === idx ? "bg-[#6B4226] scale-110 shadow-lg" : "bg-gray-300"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${step === idx ? "text-[#6B4226]" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            {/* Step Content */}
            <div className="min-h-[220px]">
              {step === 0 && detailsStep}
              {step === 1 && ingredientsStep}
              {step === 2 && reviewStep}
              {success && (
                <div className="flex flex-col items-center justify-center h-40">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <div className="text-green-700 font-bold text-lg">Product Updated!</div>
                </div>
              )}
            </div>
            {/* Stepper Controls */}
            {!success && (
              <div className="flex gap-3 mt-8">
                {step > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Back
                  </button>
                )}
                {step < steps.length - 1 && (
                  <button
                    onClick={handleNext}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#6B4226] to-[#5a3620] text-white rounded-xl hover:shadow-lg transition-all font-medium"
                  >
                    Next
                  </button>
                )}
                {step === steps.length - 1 && (
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#6B4226] to-[#5a3620] text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  const handleAddProduct = async () => {
    setIsSubmitting(true)
    const token = localStorage.getItem("accessToken")
    // Map to backend schema: { ingredient: id, quantity, unit, is_optional }
    const selectedIngredients = formData.ingredients.map((ing) => ({
      ingredientId: ing.id, // backend expects 'ingredientId' as string
      quantity: Number(ing.selectedQuantity ?? 1),
      unit: ing.unit,
      is_optional: !!ing.is_optional,
    }))
    const payload = {
      name: formData.name,
      category: formData.category,
      sell_price: Number.parseFloat(formData.sell_price),
      ingredients: selectedIngredients,
    }
    try {
      const response = await fetch("http://localhost:3006/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        const newProduct = await response.json()
        setProducts((prev) => [...prev, newProduct])
        setFormData({
          name: "",
          category: "",
          sell_price: "",
          ingredients: [],
        })
        setShowAddProduct(false)
        setShowSuccessToast(true)
        setTimeout(() => {
          setShowSuccessToast(false)
        }, 3000)
      } else {
        const errorData = await response.json()
        console.log("Add product error response:", errorData, "Status:", response.status)
        // Use enhanced error handling
        if (!handleApiError(errorData, response)) {
          alert(errorData.message || "Failed to add product")
        }
      }
    } catch (error) {
      console.error("Add product error:", error)
      alert("An error occurred. Please try again.")
    }
    setIsSubmitting(false)
  }

  const categories = ["all", "Coffee", "Food", "Iced Drinks", "Pastries"]
  const statuses = ["all", "profitable", "breaking even", "losing money"]

  const filteredProducts = products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterCategory === "all" || product.category === filterCategory) &&
        (filterStatus === "all" || product.status === filterStatus),
    )
    .sort((a, b) => {
      // Always use sum of sales.quantity for number of sales
      const getNumberOfSales = (product) =>
        Array.isArray(product.sales) ? product.sales.reduce((sum, sale) => sum + (Number(sale.quantity) || 0), 0) : 0
      switch (sortBy) {
        case "margin":
          return (b.margin_percent || 0) - (a.margin_percent || 0)
        case "sales": {
          return getNumberOfSales(b) - getNumberOfSales(a)
        }
        case "price":
          return (b.sell_price || 0) - (a.sell_price || 0)
        case "name":
          return a.name.localeCompare(b.name)
        case "impact": {
          // Compute impact as marginAmount * numberOfSales
          const aMarginAmount = typeof a.margin_amount === "number" ? a.margin_amount : Number(a.margin_amount) || 0
          const bMarginAmount = typeof b.margin_amount === "number" ? b.margin_amount : Number(b.margin_amount) || 0
          return Math.abs(bMarginAmount * getNumberOfSales(b)) - Math.abs(aMarginAmount * getNumberOfSales(a))
        }
        default:
          return 0
      }
    })

  const getStatusColor = (status) => {
    switch (status) {
      case "profitable":
        return "text-green-700 bg-green-100 border-green-200"
      case "breaking even":
        return "text-yellow-700 bg-yellow-100 border-yellow-200"
      case "losing money":
        return "text-red-700 bg-red-100 border-red-200"
      default:
        return "text-gray-600 bg-gray-100 border-gray-200"
    }
  }

  const getMarginIcon = (marginPercent) => {
    if (marginPercent > 50) return <TrendingUp className="w-5 h-5 text-green-600" />
    if (marginPercent > 0) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (marginPercent < 0) return <AlertCircle className="w-5 h-5 text-red-600" />
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />
  }

  const getTrendingIcon = (trending) => {
    switch (trending) {
      case "hot":
        return <Flame className="w-4 h-4 text-orange-500" />
      case "rising":
        return <ArrowUpRight className="w-4 h-4 text-green-500" />
      default:
        return null
    }
  }

  const losingMoneyProducts = products.filter((p) => p.status === "losing money")
  // Use numberOfSales for loss calculation
  // Use margin_amount (API property) instead of marginAmount
  const totalDailyLoss = losingMoneyProducts.reduce(
    (acc, p) => acc + Math.abs(Number(p.margin_amount) || 0) * (Number(p.numberOfSales) || 0),
    0,
  )

  const QuickWinsAlert = () => {
    if (!showQuickWins || losingMoneyProducts.length === 0) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -mr-16 -mt-16 opacity-20"></div>
        <button
          onClick={() => setShowQuickWins(false)}
          className="absolute top-3 right-3 p-1 hover:bg-red-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-red-600" />
        </button>

        <div className="flex items-start gap-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-red-800 mb-1">⚠️ Urgent: Products Losing Money</h3>
            <p className="text-red-700 text-sm mb-3">
              You're losing <span className="font-bold">${totalDailyLoss.toFixed(2)}</span> daily from{" "}
              {losingMoneyProducts.length} products
            </p>
            <div className="flex flex-wrap gap-2">
              {losingMoneyProducts.slice(0, 2).map((product) => {
                // Use margin_amount (API property) instead of marginAmount
                const marginAmount = Number(product.margin_amount) || 0
                const numberOfSales = Number(product.numberOfSales) || 0
                return (
                  <div key={product.id} className="bg-white rounded-lg p-3 border border-red-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-800">{product.name}</span>
                      <span className="text-red-600 font-bold text-sm">
                        -${(Math.abs(marginAmount) * numberOfSales).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      {numberOfSales} sale{numberOfSales === 1 ? "" : "s"}
                    </div>
                    {product.quickWin && <p className="text-xs text-gray-600 mb-2">{product.quickWin}</p>}
                    <button
                      className="bg-red-600 text-white text-xs px-3 py-1 rounded-full hover:bg-red-700 transition-colors"
                      onClick={() => {
                        setWhatIfProduct(product)
                        setShowWhatIfModal(true)
                      }}
                    >
                      Fix Now
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // --- AddProductModal Handlers (memoized to prevent unnecessary re-renders) ---
  const handleIngredientCheck = useCallback((ingredient, checked) => {
    setFormData((prev) => {
      if (checked) {
        if (prev.ingredients.some((i) => i.id === ingredient.id)) return prev
        return {
          ...prev,
          ingredients: [...prev.ingredients, { ...ingredient, selectedQuantity: 1, is_optional: false }],
        }
      } else {
        return {
          ...prev,
          ingredients: prev.ingredients.filter((i) => i.id !== ingredient.id),
        }
      }
    })
  }, [])

  const handleIngredientQuantity = useCallback((ingredientId, value) => {
    setFormData((prev) => {
      if (!prev.ingredients.some((i) => i.id === ingredientId)) return prev
      return {
        ...prev,
        ingredients: prev.ingredients.map((i) => (i.id === ingredientId ? { ...i, selectedQuantity: value } : i)),
      }
    })
  }, [])

  const handleOptionalCheck = useCallback((ingredientId, checked) => {
    setFormData((prev) => {
      if (!prev.ingredients.some((i) => i.id === ingredientId)) return prev
      return {
        ...prev,
        ingredients: prev.ingredients.map((i) => (i.id === ingredientId ? { ...i, is_optional: checked } : i)),
      }
    })
  }, [])

  const SuccessToast = () => (
    <AnimatePresence>
      {showSuccessToast && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 right-4 z-[60] bg-white rounded-xl shadow-2xl border-l-4 border-green-500 p-4 flex items-center gap-3 max-w-sm"
        >
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Success!</p>
            <p className="text-sm text-gray-600">Product added successfully</p>
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

  // New AddProductModal: Multi-step, modern UX with stock validation
  const AddProductModal = useCallback(() => {
    const [step, setStep] = useState(0)
    const [search, setSearch] = useState("")
    const [localForm, setLocalForm] = useState(formData)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    React.useEffect(() => {
      if (showAddProduct) {
        setStep(0)
        setLocalForm(formData)
        setError("")
        setSuccess(false)
      }
    }, [showAddProduct, formData])

    if (!showAddProduct) return null

    // Step 0: Details
    const detailsStep = (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
          <input
            type="text"
            placeholder="Enter product name"
            value={localForm.name}
            onChange={(e) => setLocalForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B4226] focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={localForm.category}
            onChange={(e) => setLocalForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B4226] focus:border-transparent transition-all bg-white"
          >
            <option value="">Select category</option>
            <option value="Coffee">Coffee</option>
            <option value="Food">Food</option>
            <option value="Iced Drinks">Iced Drinks</option>
            <option value="Pastries">Pastries</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sell Price ($)</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={localForm.sell_price}
            onChange={(e) => setLocalForm((f) => ({ ...f, sell_price: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B4226] focus:border-transparent transition-all"
          />
        </div>
      </div>
    )

    // Step 1: Ingredients (with search and stock validation)
    const filteredIngredients = allIngredients.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    const ingredientsStep = (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Ingredients</label>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B4226] focus:border-transparent transition-all"
          />
        </div>
        <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50">
          {filteredIngredients.length === 0 && <div className="text-gray-400 text-sm">No ingredients found.</div>}
          {filteredIngredients.map((ingredient) => {
            const checked = localForm.ingredients.some((i) => i.id === ingredient.id)
            const selected = localForm.ingredients.find((i) => i.id === ingredient.id)
            const availableStock = getAvailableStock(ingredient.id)
            const stockUnit = getStockUnit(ingredient.id)

            return (
              <div key={ingredient.id} className="flex items-center gap-2 mb-2 p-2 bg-white rounded-lg border">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    setLocalForm((f) => {
                      if (e.target.checked) {
                        if (f.ingredients.some((i) => i.id === ingredient.id)) return f
                        // Default to subunit if available
                        return {
                          ...f,
                          ingredients: [
                            ...f.ingredients,
                            {
                              ...ingredient,
                              selectedQuantity: 1,
                              is_optional: false,
                              selectedUnit:
                                ingredient.unit === "L" ? "ml" : ingredient.unit === "kg" ? "g" : ingredient.unit,
                            },
                          ],
                        }
                      } else {
                        return {
                          ...f,
                          ingredients: f.ingredients.filter((i) => i.id !== ingredient.id),
                        }
                      }
                    })
                  }}
                />
                <div className="flex-1">
                  <span className="text-gray-800 text-sm font-medium">{ingredient.name}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>${getIngredientPrice(ingredient).toFixed(4)}</span>
                    <span>•</span>
                    <span className={`${availableStock > 0 ? "text-green-600" : "text-red-600"}`}>
                      Stock: {availableStock} {stockUnit}
                    </span>
                  </div>
                </div>
                {checked && selected && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={selected.selectedQuantity || 1}
                        onChange={(e) => {
                          const val = Math.max(1, Number.parseInt(e.target.value) || 1)
                          setLocalForm((f) => ({
                            ...f,
                            ingredients: f.ingredients.map((i) =>
                              i.id === ingredient.id ? { ...i, selectedQuantity: val } : i,
                            ),
                          }))
                        }}
                        className="w-16 px-2 py-1 border border-gray-200 rounded"
                        placeholder="Qty"
                      />
                      <span className="text-xs text-gray-500">
                        {ingredient.unit === "L" ? "ml" : ingredient.unit === "kg" ? "g" : ingredient.unit || "unit"}
                      </span>
                    </div>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={!!selected.is_optional}
                        onChange={(e) =>
                          setLocalForm((f) => ({
                            ...f,
                            ingredients: f.ingredients.map((i) =>
                              i.id === ingredient.id ? { ...i, is_optional: e.target.checked } : i,
                            ),
                          }))
                        }
                      />
                      Optional
                    </label>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )

    // Step 2: Review & Add with FIXED stock validation
    const reviewStep = (
      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-lg mb-2">Review Product</h3>
          <div className="mb-2">
            <span className="font-medium">Name:</span> {localForm.name}
          </div>
          <div className="mb-2">
            <span className="font-medium">Category:</span> {localForm.category}
          </div>
          <div className="mb-2">
            <span className="font-medium">Sell Price:</span> ${localForm.sell_price}
          </div>
          <div>
            <span className="font-medium">Ingredients:</span>
            <ul className="list-disc ml-6 mt-1">
              {localForm.ingredients.map((i) => {
                const availableStock = getAvailableStock(i.id)
                const stockUnit = getStockUnit(i.id)
                const willExceedStock = checkStockExceeded(
                  i.selectedQuantity,
                  i.selectedUnit || i.unit,
                  availableStock,
                  stockUnit,
                )

                return (
                  <li key={i.id} className={willExceedStock ? "text-red-600" : ""}>
                    {i.name} ({i.selectedQuantity} {i.selectedUnit || i.unit})
                    {i.is_optional && <span className="text-xs text-gray-500">(Optional)</span>}
                    {willExceedStock && (
                      <span className="text-xs text-red-500 ml-2">
                        ⚠️ Exceeds stock ({availableStock} {stockUnit} available)
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>
    )

    // Stepper UI
    const steps = ["Details", "Ingredients", "Review"]

    const handleNext = () => {
      if (step === 0) {
        if (!localForm.name || !localForm.category || !localForm.sell_price) {
          setError("Please fill all product details.")
          return
        }
      }
      if (step === 1) {
        if (localForm.ingredients.length === 0) {
          setError("Select at least one ingredient.")
          return
        }
      }
      setError("")
      setStep((s) => s + 1)
    }
    const handleBack = () => {
      setError("")
      setStep((s) => s - 1)
    }

    const handleSubmit = async () => {
      setError("")
      setIsSubmitting(true)
      const token = localStorage.getItem("accessToken")
      const selectedIngredients = localForm.ingredients.map((ing) => {
        const unit = ing.selectedUnit || ing.unit
        const quantity = Number(ing.selectedQuantity ?? 1)
        return {
          ingredientId: ing.id,
          quantity,
          unit,
          is_optional: !!ing.is_optional,
        }
      })
      const payload = {
        name: localForm.name,
        category: localForm.category,
        sell_price: Number.parseFloat(localForm.sell_price),
        ingredients: selectedIngredients,
      }
      try {
        const response = await fetch("http://localhost:3006/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
        if (response.ok) {
          const newProduct = await response.json()
          setProducts((prev) => [...prev, newProduct])
          setFormData({
            name: "",
            category: "",
            sell_price: "",
            ingredients: [],
          })
          setShowAddProduct(false)
          setShowSuccessToast(true)
          setTimeout(() => {
            setShowSuccessToast(false)
          }, 3000)
        } else {
          const errorData = await response.json()
          console.log("Add product modal error:", errorData, "Status:", response.status)
          // Use enhanced error handling
          if (!handleApiError(errorData, response)) {
            setError(errorData.message || "Failed to add product")
          }
        }
      } catch (error) {
        console.error("Add product modal error:", error)
        setError("An error occurred. Please try again.")
      }
      setIsSubmitting(false)
    }
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
              <button
                onClick={() => setShowAddProduct(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {/* Stepper */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((label, idx) => (
                <div key={label} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white transition-all ${
                      step === idx ? "bg-[#6B4226] scale-110 shadow-lg" : "bg-gray-300"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${step === idx ? "text-[#6B4226]" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            {/* Step Content */}
            <div className="min-h-[220px]">
              {step === 0 && detailsStep}
              {step === 1 && ingredientsStep}
              {step === 2 && reviewStep}
              {success && (
                <div className="flex flex-col items-center justify-center h-40">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <div className="text-green-700 font-bold text-lg">Product Added!</div>
                </div>
              )}
            </div>
            {/* Stepper Controls */}
            {!success && (
              <div className="flex gap-3 mt-8">
                {step > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Back
                  </button>
                )}
                {step < steps.length - 1 && (
                  <button
                    onClick={handleNext}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#6B4226] to-[#5a3620] text-white rounded-xl hover:shadow-lg transition-all font-medium"
                  >
                    Next
                  </button>
                )}
                {step === steps.length - 1 && (
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#6B4226] to-[#5a3620] text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Adding..." : "Add Product"}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }, [
    showAddProduct,
    formData,
    isSubmitting,
    allIngredients,
    setShowAddProduct,
    setProducts,
    setFormData,
    stockData,
    getAvailableStock,
    getStockUnit,
    checkStockExceeded,
  ])

  const EnhancedProductCard = ({ product }) => {
    // Show/hide ingredients dropdown
    const [showIngredients, setShowIngredients] = useState(false)

    // Always map product.ingredients to correct display shape and deduplicate by id
    const safeIngredientsRaw = Array.isArray(product.ingredients) ? product.ingredients : []
    // Map API shape to UI shape for display, always use latest info
    const mappedIngredients = safeIngredientsRaw.map((i) => {
      return {
        id: i.ingredient?.id || i.id,
        name: i.ingredient?.name || i.name,
        unit: i.selectedUnit || i.unit || i.ingredient?.unit,
        quantity: i.selectedQuantity ?? i.quantity ?? 1,
        selectedUnit: i.selectedUnit,
        is_optional: i.is_optional || false,
        line_cost: i.line_cost,
      }
    })
    // Deduplicate by id
    const safeIngredients = mappedIngredients.filter((ing, idx, arr) => arr.findIndex((i) => i.id === ing.id) === idx)

    const toggleIngredients = () => setShowIngredients((v) => !v)

    // Use correct API property names and always coerce to number
    const sellPrice = Number(product.sell_price) || 0
    const totalCost = Number(product.total_cost) || 0
    const marginAmount = Number(product.margin_amount) || 0
    const marginPercent = Number(product.margin_percent) || 0
    // Use injected numberOfSales (from merged sales data)
    const numberOfSales = Number(product.numberOfSales) || 0

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
      >
        <div className="relative">
          <div
            className={`h-2 ${
              product.status === "profitable"
                ? "bg-green-400"
                : product.status === "losing money"
                  ? "bg-red-400"
                  : "bg-yellow-400"
            }`}
          ></div>
          <div className="p-6 pb-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#6B4226] transition-colors">
                    {product.name}
                  </h3>
                  {getTrendingIcon(product.trending)}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{product.category}</span>
                  {product.avgRating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-600">{product.avgRating}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                  onClick={() => handleEditProduct(product)}
                >
                  <Edit className="w-4 h-4 text-gray-600" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </motion.button>
              </div>
            </div>
            <div className="mb-4">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                  product.status,
                )}`}
              >
                {getMarginIcon(marginPercent)}
                {product.status ? product.status.charAt(0).toUpperCase() + product.status.slice(1) : "Unknown"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-3 border border-blue-200">
                <div className="absolute top-0 right-0 w-12 h-12 bg-blue-200 rounded-full -mr-6 -mt-6 opacity-30"></div>
                <DollarSign className="w-4 h-4 text-blue-600 mb-1" />
                <p className="text-xs font-medium text-blue-800 mb-1">Sell Price</p>
                <p className="text-lg font-bold text-blue-900">${sellPrice.toFixed(2)}</p>
              </div>
              <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-3 border border-orange-200">
                <div className="absolute top-0 right-0 w-12 h-12 bg-orange-200 rounded-full -mr-6 -mt-6 opacity-30"></div>
                <Package className="w-4 h-4 text-orange-600 mb-1" />
                <p className="text-xs font-medium text-orange-800 mb-1">Total Cost</p>
                <p className="text-lg font-bold text-orange-900">${totalCost.toFixed(2)}</p>
              </div>
            </div>
            <div className="relative bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-xl p-3 mb-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getMarginIcon(marginPercent)}
                  <span className="font-bold text-sm text-gray-800">Profit Margin</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Number of Sales</p>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-gray-400" />
                    <span className="font-bold text-sm text-gray-700">{numberOfSales}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-2xl font-bold ${marginPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {marginPercent > 0 ? "+" : ""}
                    {marginPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600">
                    ${marginAmount > 0 ? "+" : ""}
                    {marginAmount.toFixed(2)} per sale
                  </p>
                </div>
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.max(0, Math.min(100, (marginPercent + 20) * 1.25))}%`,
                    }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full rounded-full ${marginPercent >= 0 ? "bg-green-400" : "bg-red-400"}`}
                  />
                </div>
              </div>
            </div>

            {product.quickWin && product.status === "losing money" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4"
              >
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-yellow-800 mb-1">Quick Win</p>
                    <p className="text-sm text-yellow-700">{product.quickWin}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          <button
            onClick={toggleIngredients}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors border-t border-gray-100"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-700">Ingredients ({safeIngredients.length})</span>
            </div>
            <div
              style={{
                transform: showIngredients ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </div>
          </button>
          <AnimatePresence>
            {showIngredients && safeIngredients.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-gray-100"
              >
                <div className="p-4 space-y-2">
                  {safeIngredients.map((ingredient, idx) => (
                    <div
                      key={`ingredient-${ingredient.id}`}
                      className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#6B4226] rounded-full"></div>
                        <div>
                          <span className="font-medium text-sm text-gray-800">{ingredient.name ?? "Unknown"}</span>
                          <p className="text-xs text-gray-500">
                            {`${ingredient.quantity ?? 0}${ingredient.selectedUnit ?? ingredient.unit ?? ""}`}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-sm text-[#6B4226] bg-[#6B4226]/5 px-2 py-1 rounded">
                        {ingredient.line_cost !== undefined ? `$${Number(ingredient.line_cost).toFixed(2)}` : "$0.00"}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#6B4226] text-white py-2 px-4 rounded-xl text-sm font-semibold hover:bg-[#5a3620] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                onClick={() => {
                  setWhatIfProduct(product)
                  setShowWhatIfModal(true)
                }}
              >
                <Calculator className="w-4 h-4" />
                What-If
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-purple-600 text-white py-2 px-4 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                onClick={() => {
                  setMilkSwapProduct(product)
                  setShowMilkSwapModal(true)
                }}
              >
                <Shuffle className="w-4 h-4" />
                Swap
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const TableView = ({ products }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 font-semibold text-gray-700">Name</th>
              <th className="text-left p-4 font-semibold text-gray-700">Category</th>
              <th className="text-right p-4 font-semibold text-gray-700">Sell Price ($)</th>
              <th className="text-right p-4 font-semibold text-gray-700">Total Cost ($)</th>
              <th className="text-right p-4 font-semibold text-gray-700">Margin ($)</th>
              <th className="text-right p-4 font-semibold text-gray-700">Margin (%)</th>
              <th className="text-center p-4 font-semibold text-gray-700">Status</th>
              <th className="text-center p-4 font-semibold text-gray-700">Created At</th>
              <th className="text-center p-4 font-semibold text-gray-700">Sales</th>
              <th className="text-center p-4 font-semibold text-gray-700">Ingredients</th>
              <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product, index) => {
              const sellPrice =
                typeof product.sell_price === "number" ? product.sell_price : Number(product.sell_price) || 0
              const totalCost =
                typeof product.total_cost === "number" ? product.total_cost : Number(product.total_cost) || 0
              const marginAmount =
                typeof product.margin_amount === "number" ? product.margin_amount : Number(product.margin_amount) || 0
              const marginPercent =
                typeof product.margin_percent === "number"
                  ? product.margin_percent
                  : Number(product.margin_percent) || 0
              const status = product.status || ""
              const createdAt = product.created_at ? new Date(product.created_at).toLocaleString() : ""
              // Use injected numberOfSales (from merged sales data)
              const numberOfSales = Number(product.numberOfSales) || 0
              const ingredientsCount = Array.isArray(product.ingredients) ? product.ingredients.length : 0
              return (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                >
                  <td className="p-4 font-semibold text-gray-900">{product.name}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm">{product.category}</span>
                  </td>
                  <td className="p-4 text-right">${sellPrice.toFixed(2)}</td>
                  <td className="p-4 text-right text-orange-600">${totalCost.toFixed(2)}</td>
                  <td className="p-4 text-right">${marginAmount.toFixed(2)}</td>
                  <td className="p-4 text-right">{marginPercent.toFixed(2)}%</td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        status,
                      )}`}
                    >
                      {getMarginIcon(marginPercent)}
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4 text-center text-xs text-gray-500">{createdAt}</td>
                  <td className="p-4 text-center">{numberOfSales}</td>
                  <td className="p-4 text-center">
                    {ingredientsCount > 0 ? (
                      <span
                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold cursor-pointer"
                        title={product.ingredients.map((i) => i.name || (i.ingredient && i.ingredient.name)).join(", ")}
                      >
                        {ingredientsCount} {ingredientsCount === 1 ? "item" : "items"}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => {
                          setWhatIfProduct(product)
                          setShowWhatIfModal(true)
                        }}
                        title="What-If Analysis"
                      >
                        <Calculator className="w-4 h-4 text-[#6B4226]" />
                      </button>
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => {
                          setMilkSwapProduct(product)
                          setShowMilkSwapModal(true)
                        }}
                        title="Ingredient Swap"
                      >
                        <Shuffle className="w-4 h-4 text-purple-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" onClick={() => handleEditProduct(product)}>
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )

  // INGREDIENTS TABLE COMPONENT
  const handleDeleteIngredient = async (id) => {
    const token = localStorage.getItem("accessToken")
    if (!window.confirm("Are you sure you want to delete this ingredient?")) return
    try {
      const response = await fetch(`http://localhost:3006/ingredients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setIngredients((prev) => prev.filter((ing) => ing.id !== id))
        setAllIngredients((prev) => prev.filter((ing) => ing.id !== id))
      } else {
        alert("Failed to delete ingredient")
      }
    } catch (e) {
      alert("Error deleting ingredient")
    }
  }

  const handleEditIngredient = (ingredient) => {
    setEditingIngredient(ingredient.id)
    setIngredientEditData({
      name: ingredient.name,
      unit: ingredient.unit,
      cost_per_unit: ingredient.cost_per_unit,
      cost_per_ml: ingredient.cost_per_ml,
    })
  }

  const handleSaveIngredient = async (id) => {
    const token = localStorage.getItem("accessToken")
    try {
      const response = await fetch(`http://localhost:3006/ingredients/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ingredientEditData),
      })
      if (response.ok) {
        const updated = await response.json()
        setIngredients((prev) => prev.map((ing) => (ing.id === id ? updated : ing)))
        setAllIngredients((prev) => prev.map((ing) => (ing.id === id ? updated : ing)))
        setEditingIngredient(null)
      } else {
        alert("Failed to update ingredient")
      }
    } catch (e) {
      alert("Error updating ingredient")
    }
  }

  const IngredientsTable = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Ingredients</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Unit</th>
              <th className="p-3 text-right">Cost per Unit</th>
              <th className="p-3 text-right">Cost per mL</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ingredient) => (
              <tr key={ingredient.id} className="border-b border-gray-100">
                <td className="p-3">
                  {editingIngredient === ingredient.id ? (
                    <input
                      value={ingredientEditData.name}
                      onChange={(e) =>
                        setIngredientEditData((d) => ({
                          ...d,
                          name: e.target.value,
                        }))
                      }
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    ingredient.name
                  )}
                </td>
                <td className="p-3">
                  {editingIngredient === ingredient.id ? (
                    <input
                      value={ingredientEditData.unit}
                      onChange={(e) =>
                        setIngredientEditData((d) => ({
                          ...d,
                          unit: e.target.value,
                        }))
                      }
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    ingredient.unit
                  )}
                </td>
                <td className="p-3 text-right">
                  {editingIngredient === ingredient.id ? (
                    <input
                      type="number"
                      value={ingredientEditData.cost_per_unit}
                      onChange={(e) =>
                        setIngredientEditData((d) => ({
                          ...d,
                          cost_per_unit: e.target.value,
                        }))
                      }
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    `$${Number(ingredient.cost_per_unit || 0).toFixed(2)}`
                  )}
                </td>
                <td className="p-3 text-right">
                  {editingIngredient === ingredient.id ? (
                    <input
                      type="number"
                      value={ingredientEditData.cost_per_ml}
                      onChange={(e) =>
                        setIngredientEditData((d) => ({
                          ...d,
                          cost_per_ml: e.target.value,
                        }))
                      }
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    `$${Number(ingredient.cost_per_ml || 0).toFixed(4)}`
                  )}
                </td>
                <td className="p-3 text-center">
                  {editingIngredient === ingredient.id ? (
                    <>
                      <button
                        onClick={() => handleSaveIngredient(ingredient.id)}
                        className="text-green-600 font-bold mr-2"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingIngredient(null)} className="text-gray-500">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditIngredient(ingredient)} className="text-blue-600 font-bold mr-2">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteIngredient(ingredient.id)} className="text-red-600 font-bold">
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // --- Main Render ---
  return (
    <>
      <SuccessToast />
      <ErrorToast />

      <div className="flex min-h-screen bg-gradient-to-br from-[#FAF8F5] via-white to-[#F5F3F0] overflow-x-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col w-full md:ml-64">
          <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
          <main className="p-4 sm:p-6 space-y-6 overflow-x-hidden w-full min-h-screen">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#6B4226] to-[#8B4513] bg-clip-text text-transparent">
                  Products
                </h1>
                <p className="text-gray-600 text-sm mt-1">Smart margin tracking for your coffee shop</p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddProduct(true)}
                  className="bg-gradient-to-r from-[#6B4226] to-[#5a3620] text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </motion.button>
              </div>
            </motion.div>
            <QuickWinsAlert />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {[
                {
                  icon: Coffee,
                  label: "Total Products",
                  value: products.length,
                  color: "from-[#6B4226] to-[#5a3620]",
                  bgColor: "from-[#6B4226]/10 to-[#5a3620]/10",
                  change: "+2 this week",
                },
                {
                  icon: TrendingUp,
                  label: "Profitable",
                  value: products.filter((p) => p.status === "profitable").length,
                  color: "from-green-600 to-green-700",
                  bgColor: "from-green-50 to-emerald-50",
                  change: "+1 today",
                },
                {
                  icon: AlertCircle,
                  label: "Losing Money",
                  value: products.filter((p) => p.status === "losing money").length,
                  color: "from-red-600 to-red-700",
                  bgColor: "from-red-50 to-pink-50",
                  change: "Fix these!",
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -2 }}
                  className={`bg-gradient-to-br ${stat.bgColor} p-5 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-all`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color}`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-full">{stat.change}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products, ingredients, or categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B4226] focus:border-transparent transition-all placeholder-gray-400 text-sm"
                  />
                </div>
                <div className="flex gap-3 flex-wrap lg:flex-nowrap">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B4226] focus:border-transparent text-sm min-w-[140px] bg-white"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B4226] focus:border-transparent text-sm min-w-[130px] bg-white"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B4226] focus:border-transparent text-sm min-w-[140px] bg-white"
                  >
                    <option value="margin">Sort by Margin</option>
                    <option value="sales">Sort by Sales</option>
                    <option value="price">Sort by Price</option>
                    <option value="name">Sort by Name</option>
                    <option value="impact">Sort by Impact</option>
                  </select>
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode("cards")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === "cards" ? "bg-white text-[#6B4226] shadow-sm" : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Cards
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === "table" ? "bg-white text-[#6B4226] shadow-sm" : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Table
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
            {isLoadingProducts ? (
              viewMode === "cards" ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse flex flex-col gap-4"
                    >
                      <div className="h-4 w-1/3 bg-gray-200 rounded mb-2" />
                      <div className="h-6 w-2/3 bg-gray-200 rounded mb-4" />
                      <div className="h-4 w-1/2 bg-gray-100 rounded mb-2" />
                      <div className="h-4 w-1/4 bg-gray-100 rounded mb-2" />
                      <div className="h-8 w-full bg-gray-100 rounded mb-2" />
                      <div className="h-4 w-1/3 bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-1/2 bg-gray-100 rounded" />
                    </div>
                  ))}
                </motion.div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
                  <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex gap-4 mb-3">
                      <div className="h-4 w-1/4 bg-gray-100 rounded" />
                      <div className="h-4 w-1/4 bg-gray-100 rounded" />
                      <div className="h-4 w-1/4 bg-gray-100 rounded" />
                      <div className="h-4 w-1/4 bg-gray-100 rounded" />
                    </div>
                  ))}
                </div>
              )
            ) : viewMode === "cards" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {filteredProducts.map((product) => (
                    <EnhancedProductCard key={product.id} product={product} />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <TableView products={filteredProducts} />
            )}
            {filteredProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 bg-white rounded-2xl border border-gray-100"
              >
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Coffee className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchTerm || filterCategory !== "all" || filterStatus !== "all"
                    ? "Try adjusting your search terms or filters to find what you're looking for."
                    : "Start by adding your first product to track margins and optimize profitability."}
                </p>
                <div className="flex gap-3 justify-center">
                  {(searchTerm || filterCategory !== "all" || filterStatus !== "all") && (
                    <button
                      onClick={() => {
                        setSearchTerm("")
                        setFilterCategory("all")
                        setFilterStatus("all")
                      }}
                      className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="bg-gradient-to-r from-[#6B4226] to-[#5a3620] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Your First Product
                  </button>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>
      <AnimatePresence>
        {showAddProduct && <AddProductModal />}
        {showEditProduct && <EditProductModal />}
        {showWhatIfModal && <WhatIfModal />}
        {showMilkSwapModal && <MilkSwapModal />}
      </AnimatePresence>
    </>
  )
}
