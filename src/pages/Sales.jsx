"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select"
import { Sidebar } from "../components/Sidebar"
import { Navbar } from "../components/Navbar"
import { Info } from "lucide-react"
import {
  Plus,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Upload,
  FileText,
  Eye,
  GripVertical,
  X,
  User,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Percent,
  Download,
} from "lucide-react"

const API_BASE = "https://busy-fool-backend-2-0.onrender.com"

const IDEMP_STORE_KEY = "bf:idempotency:imports"
const IDEMP_TTL_MS = 30 * 60 * 1000 // 30 minutes
const SALES_STATS_KEY = "bf:sales:last-stats"

function toHex(buffer) {
  const bytes = new Uint8Array(buffer)
  let hex = ""
  for (let i = 0; i < bytes.length; i++) {
    const h = bytes[i].toString(16).padStart(2, "0")
    hex += h
  }
  return hex
}
function formatCurrency(n) {
  const num = Number(n ?? 0)
  if (Number.isNaN(num)) return "$0.00"
  return num.toLocaleString(undefined, { style: "currency", currency: "USD" })
}
function formatPercent2(n) {
  const num = Number(n ?? 0)
  if (Number.isNaN(num)) return "0.00%"
  return `${num.toFixed(2)}%`
}

function readImportMap() {
  try {
    const raw = localStorage.getItem(IDEMP_STORE_KEY)
    const map = raw ? JSON.parse(raw) : {}
    const now = Date.now()
    for (const [k, v] of Object.entries(map)) {
      if (!v || typeof v !== "object" || typeof v.ts !== "number") {
        delete map[k]
        continue
      }
      if (now - v.ts > IDEMP_TTL_MS) {
        delete map[k]
      }
    }
    if (raw) localStorage.setItem(IDEMP_STORE_KEY, JSON.stringify(map))
    return map
  } catch {
    return {}
  }
}
function writeImportMap(map) {
  try {
    localStorage.setItem(IDEMP_STORE_KEY, JSON.stringify(map))
  } catch {}
}
async function computeIdempotencyKey(file, mappings, userId) {
  try {
    const buf = await file.arrayBuffer()
    const fileHash = await crypto.subtle.digest("SHA-256", buf)
    const mappingSorted = Object.keys(mappings || {})
      .sort()
      .reduce((acc, k) => {
        acc[k] = mappings[k] ?? null
        return acc
      }, {})
    const meta = `${userId}|${file.name}|${file.size}|${file.type}|${JSON.stringify(mappingSorted)}`
    const metaHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(meta))
    return `v1-${toHex(fileHash)}-${toHex(metaHash)}`
  } catch {
    return `fallback-${userId || "nouser"}-${file.name}-${file.size}-${Date.now()}`
  }
}
function dedupeSalesArray(arr) {
  if (!Array.isArray(arr)) return []
  const out = []
  const seenId = new Set()
  const seenSig = new Set()
  for (const s of arr) {
    const id = s?.id
    if (id && !seenId.has(id)) {
      seenId.add(id)
      out.push(s)
      continue
    }
    const sig = JSON.stringify([
      s?.product?.id ?? null,
      s?.product?.name ?? s?.product_name ?? "",
      s?.quantity ?? null,
      s?.user?.id ?? null,
      s?.user?.name ?? "",
      s?.created_at ?? s?.sale_date ?? s?.date ?? "",
    ])
    if (!seenSig.has(sig)) {
      seenSig.add(sig)
      out.push(s)
    }
  }
  return out
}

export default function Sales() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false)

  // Data lists
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])

  // Loading flags
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingCsv, setIsProcessingCsv] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [currentImportKey, setCurrentImportKey] = useState(null)
  const importingRef = useRef(false)

  // Notifications
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  // Modals
  const [showModal, setShowModal] = useState(false)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [showMappingModal, setShowMappingModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Manual add sale form
  const [formData, setFormData] = useState({ productId: "", quantity: "" })
  const [formErrors, setFormErrors] = useState({})

  // CSV state
  const [csvFile, setCsvFile] = useState(null)
  const [csvHeaders, setCsvHeaders] = useState([])
  const [headerSignature, setHeaderSignature] = useState(null)

  // Mapping state (Sales fields)
  const busyfoolFields = useMemo(
    () => [
      { key: "product_name", label: "Product Name", required: true, description: "Name of the product being sold" },
      { key: "quantity_sold", label: "Quantity Sold", required: true, description: "Number of items sold" },
      { key: "sale_price", label: "Sale Price", required: false, description: "Price per unit " },
      { key: "sale_date", label: "Sale Date", required: false, description: "Date of sale (optional)" },
    ],
    [],
  )
  const [mappings, setMappings] = useState({
    product_name: null,
    quantity_sold: null,
    sale_price: null,
    sale_date: null,
  })
  const [draggedHeader, setDraggedHeader] = useState(null)
  const [dragOverField, setDragOverField] = useState(null)

  // Preview result (now compatible with import-daily-sales JSON)
  const [previewData, setPreviewData] = useState(null)

  // Sales page summary stats (persisted from last preview)
  const [salesStats, setSalesStats] = useState(() => {
    try {
      const raw = localStorage.getItem(SALES_STATS_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  // Preview pagination
  const [previewPage, setPreviewPage] = useState(1)
  const [previewPageSize, setPreviewPageSize] = useState(20)
  const previewRows = previewData?.sales || []
  const previewTotalPages = Math.max(1, Math.ceil(previewRows.length / previewPageSize))
  const previewStart = (previewPage - 1) * previewPageSize
  const previewEnd = Math.min(previewStart + previewPageSize, previewRows.length)
  const paginatedPreviewRows = useMemo(
    () => previewRows.slice(previewStart, previewEnd),
    [previewRows, previewStart, previewEnd],
  )
  useEffect(() => setPreviewPage(1), [previewRows.length, previewPageSize])

  // User
  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentUserName, setCurrentUserName] = useState("")

  // Sales History pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalPages = Math.max(1, Math.ceil((sales?.length || 0) / pageSize))
  const startIdx = (page - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, sales?.length || 0)
  const paginatedSales = useMemo(() => sales.slice(startIdx, endIdx), [sales, startIdx, endIdx])
  useEffect(() => setPage(1), [sales, pageSize])

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("accessToken")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const loadUserId = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken")
      if (token) {
        const res = await fetch(`${API_BASE}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          const uid = data?.id || data?.user?.id
          if (uid) {
            localStorage.setItem("userId", uid)
            setCurrentUserId(uid)
            const name = data?.name || data?.user?.name || data?.username
            if (name) {
              localStorage.setItem("userName", name)
              setCurrentUserName(name)
            }
            return uid
          }
        }
      }
    } catch {}
    try {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        const uid = user?.id || user?.user?.id
        if (uid) {
          localStorage.setItem("userId", uid)
          setCurrentUserId(uid)
          const name = user?.name || user?.user?.name || user?.username
          if (name) {
            localStorage.setItem("userName", name)
            setCurrentUserName(name)
          }
          return uid
        }
      }
    } catch {}
    const existing = localStorage.getItem("userId")
    if (existing) {
      setCurrentUserId(existing)
      return existing
    }
    setCurrentUserId(null)
    return null
  }, [])

  const LOCAL_KEY_PREFIX = "bf:mappings"
  const getHeaderSignature = useCallback((headers) => {
    if (!headers || !headers.length) return null
    return headers
      .map((h) => String(h).trim().toLowerCase())
      .sort()
      .join("|")
  }, [])
  const hasRequiredMappings = useCallback(
    (currentHeaders, mappingObject) => {
      if (!mappingObject) return false
      const headerSet = new Set(currentHeaders.map((h) => String(h).trim()))
      const requiredFields = busyfoolFields.filter((f) => f.required).map((f) => f.key)
      return requiredFields.every((key) => {
        const mapped = mappingObject[key]
        return typeof mapped === "string" && mapped.length > 0 && headerSet.has(mapped)
      })
    },
    [busyfoolFields],
  )
  const saveMappingLocal = useCallback((userId, headerSig, mappingObject, headers) => {
    if (!userId || !headerSig || !mappingObject) return
    const key = `${LOCAL_KEY_PREFIX}:${userId}:${headerSig}`
    const value = { savedAt: new Date().toISOString(), headers, mappings: mappingObject }
    localStorage.setItem(key, JSON.stringify(value))
  }, [])
  const loadMappingLocal = useCallback((userId, headerSig) => {
    if (!userId || !headerSig) return null
    try {
      const raw = localStorage.getItem(`${LOCAL_KEY_PREFIX}:${userId}:${headerSig}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])
  const saveMappingSilent = useCallback(
    async (uid, mappingObject) => {
      const mappingArray = Object.entries(mappingObject)
        .filter(([, value]) => value !== null)
        .map(([busyfoolColumn, posColumnName]) => ({ busyfoolColumn, posColumnName }))
      const res = await fetch(`${API_BASE}/csv-mappings/save-mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ userId: uid, mappings: mappingArray }),
      })
      return res.ok
    },
    [authHeaders],
  )

  useEffect(() => {
    ;(async () => {
      await loadUserId()
      await fetchProducts()
      await fetchSales()
    })()
  }, [loadUserId])

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`, { headers: { ...authHeaders() } })
      if (res.ok) {
        const data = await res.json()
        setProducts(Array.isArray(data) ? data : [])
      } else {
        setProducts([])
      }
    } catch {
      setProducts([])
    }
  }
  const fetchSales = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/sales`, { headers: { ...authHeaders() } })
      if (res.ok) {
        const data = await res.json()
        const arr = Array.isArray(data) ? data : []
        const deduped = dedupeSalesArray(arr)
        setSales(deduped)
      } else {
        setSales([])
      }
    } catch {
      setSales([])
    } finally {
      setIsLoading(false)
    }
  }

  // Manual add sale
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setMessage("")
    const errors = {}
    if (!formData.productId) errors.productId = "Required"
    if (!formData.quantity) errors.quantity = "Required"
    setFormErrors(errors)
    if (Object.keys(errors).length) {
      setIsSubmitting(false)
      return
    }
    try {
      const selectedProduct = products.find((p) => p.id === formData.productId)
      const payload = {
        productId: formData.productId,
        product_name: selectedProduct?.name || "",
        quantity: Number(formData.quantity),
      }
      const res = await fetch(`${API_BASE}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setMessage("Sale added successfully.")
        setMessageType("success")
        setShowModal(false)
        setFormData({ productId: "", quantity: "" })
        fetchSales()
      } else {
        let errorMsg = "Failed to add sale."
        try {
          const contentType = res.headers.get("content-type") || ""
          if (contentType.includes("application/json")) {
            const json = await res.json()
            if (json?.message) errorMsg = json.message
          } else {
            const text = await res.text()
            if (text) errorMsg = text
          }
        } catch {}
        setMessage(errorMsg)
        setMessageType("error")
      }
    } catch {
      setMessage("Error adding sale.")
      setMessageType("error")
    }
    setIsSubmitting(false)
  }

  // CSV upload -> headers
  const handleCsvUpload = async (file) => {
    if (!file) return
    setIsProcessingCsv(true)
    setMessage("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const uid = currentUserId || (await loadUserId())
      if (uid) formData.append("userId", uid)
      const res = await fetch(`${API_BASE}/csv-mappings/upload-temp`, {
        method: "POST",
        headers: { ...authHeaders() },
        body: formData,
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || "Failed to upload CSV.")
      }
      const data = await res.json()
      let headers = []
      if (Array.isArray(data)) headers = data
      else if (Array.isArray(data?.headers)) headers = data.headers
      else if (Array.isArray(data?.data?.headers)) headers = data.data.headers
      else if (Array.isArray(data?.csvHeaders)) headers = data.csvHeaders

      if (!headers.length) {
        setMessage("No headers found in CSV. Ensure the first row contains header names.")
        setMessageType("error")
        setIsProcessingCsv(false)
        return
      }

      setCsvHeaders(headers)
      setCsvFile(file)
      const sig = getHeaderSignature(headers)
      setHeaderSignature(sig)

      const uid2 = currentUserId || (await loadUserId())
      const previous = loadMappingLocal(uid2, sig)
      if (previous && hasRequiredMappings(headers, previous.mappings)) {
        setMappings(previous.mappings)
        const ok = await saveMappingSilent(uid2, previous.mappings)
        if (ok) {
          setShowCsvModal(false)
          setShowMappingModal(false)
          setMessage("Found previous mapping. Auto-applied and generating preview...")
          setMessageType("success")
          await previewImport(file) // using daily endpoint for preview JSON
          setIsProcessingCsv(false)
          return
        } else {
          setMessage("Found previous mapping but server sync failed. Please review and save again.")
          setMessageType("warning")
          setShowCsvModal(false)
          setShowMappingModal(true)
          setIsProcessingCsv(false)
          return
        }
      }

      if (previous?.mappings) setMappings(previous.mappings)
      setShowCsvModal(false)
      setShowMappingModal(true)
      setMessage("CSV uploaded. Please map the columns.")
      setMessageType("success")
    } catch (e) {
      setMessage(e?.message || "Network error uploading CSV.")
      setMessageType("error")
    }
    setIsProcessingCsv(false)
  }

  // Drag and drop mapping handlers
  const handleDragStart = (e, header) => {
    setDraggedHeader(header)
    e.dataTransfer.effectAllowed = "move"
  }
  const handleDragOver = (e, fieldKey) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverField(fieldKey)
  }
  const handleDragLeave = () => setDragOverField(null)
  const handleDrop = (e, fieldKey) => {
    e.preventDefault()
    if (draggedHeader) setMappings((prev) => ({ ...prev, [fieldKey]: draggedHeader }))
    setDraggedHeader(null)
    setDragOverField(null)
  }
  const removeMappingForField = (fieldKey) => setMappings((prev) => ({ ...prev, [fieldKey]: null }))
  const getAvailableHeaders = () => {
    const mapped = Object.values(mappings).filter(Boolean)
    return csvHeaders.filter((h) => !mapped.includes(h))
  }
  const resetCsvState = () => {
    setCsvFile(null)
    setCsvHeaders([])
    setHeaderSignature(null)
    setMappings({ product_name: null, quantity_sold: null, sale_price: null, sale_date: null })
    setPreviewData(null)
    setDraggedHeader(null)
    setDragOverField(null)
    setPreviewPage(1)
    importingRef.current = false
    setIsImporting(false)
    setCurrentImportKey(null)
  }

  // Save mappings then preview
  const saveMappings = async () => {
    const required = busyfoolFields.filter((f) => f.required)
    const missing = required.filter((f) => !mappings[f.key])
    if (missing.length) {
      setMessage(`Please map required fields: ${missing.map((f) => f.label).join(", ")}`)
      setMessageType("error")
      return
    }
    const mappingArray = Object.entries(mappings)
      .filter(([, value]) => value !== null)
      .map(([busyfoolColumn, posColumnName]) => ({ busyfoolColumn, posColumnName }))
    if (!mappingArray.length) {
      setMessage("Please map at least one field.")
      setMessageType("error")
      return
    }
    const uid = currentUserId || (await loadUserId())
    if (!uid) {
   
      setMessageType("error")
      return
    }
    const sig = headerSignature || getHeaderSignature(csvHeaders)
    setIsProcessingCsv(true)
    try {
      const res = await fetch(`${API_BASE}/csv-mappings/save-mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ userId: uid, mappings: mappingArray }),
      })
      if (res.ok) {
        saveMappingLocal(uid, sig, mappings, csvHeaders)
        setShowMappingModal(false)
        setMessage("Mappings saved. Generating preview...")
        setMessageType("success")
        setTimeout(() => previewImport(csvFile), 80)
      } else {
        const t = await res.text()
        setMessage(t || "Failed to save mappings.")
        setMessageType("error")
      }
    } catch {
      setMessage("Network error saving mappings.")
      setMessageType("error")
    }
    setIsProcessingCsv(false)
  }

  // PREVIEW: Use /csv-mappings/import-sales per your response shape
  const previewImport = async (fileOverride = null) => {
    const fileToUse = fileOverride || csvFile
    if (!fileToUse) {
      setMessage("No CSV file selected. Please upload again.")
      setMessageType("error")
      return
    }
    const uid = currentUserId || (await loadUserId())
    if (!uid) {
      setMessage("Could not determine user ID. Please log in again.")
      setMessageType("error")
      return
    }
    setIsProcessingCsv(true)
    try {
      const formData = new FormData()
      formData.append("file", fileToUse)
      formData.append("confirm", "false")
      formData.append("userId", uid)

      const res = await fetch(`${API_BASE}/csv-mappings/import-sales`, {
        method: "POST",
        headers: { ...authHeaders() },
        body: formData,
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || "Failed to preview import.")
      }
      const data = await res.json()

      const normalized = {
        totalSales: Number(data.totalSales) || 0,
        totalProfit: Number(data.totalProfit) || 0,
        avgProfitMargin: Number(data.avgProfitMargin ?? data.averageProfitMargin) || 0,
        sales: Array.isArray(data.rows)
          ? data.rows.map((r) => ({
              ...r,
              amount:
                r.amount ??
                (r.quantitySold != null && (r.salePrice != null || r.unitPrice != null)
                  ? Number(r.quantitySold) * Number(r.salePrice ?? r.unitPrice)
                  : r.amount),
            }))
          : [],
      }

      setPreviewData(normalized)
      setPreviewPage(1)
      setShowPreviewModal(true)
      setMessage("Preview generated successfully.")
      setMessageType("success")

      // Persist stats to show above Sales History
      try {
        localStorage.setItem(
          SALES_STATS_KEY,
          JSON.stringify({
            totalSales: normalized.totalSales,
            totalProfit: normalized.totalProfit,
            avgProfitMargin: normalized.avgProfitMargin,
          }),
        )
        setSalesStats({
          totalSales: normalized.totalSales,
          totalProfit: normalized.totalProfit,
          avgProfitMargin: normalized.avgProfitMargin,
        })
      } catch {}
    } catch (e) {
      setMessage(e?.message || "Network error generating preview.")
      setMessageType("error")
    }
    setIsProcessingCsv(false)
  }

  // CONFIRM: keep using /csv-mappings/import-sales to actually insert Sales history
  const [currentImportKeyState, setCurrentImportKeyState] = useState(null)
  const confirmImport = async () => {
    if (!csvFile) return
    if (importingRef.current) return
    importingRef.current = true
    setIsImporting(true)
    setIsProcessingCsv(true)

    try {
      const uid = currentUserId || (await loadUserId())
      if (!uid) {

        setMessageType("error")
        return
      }

      const idKey = await computeIdempotencyKey(csvFile, mappings, uid)
      setCurrentImportKeyState(idKey)

      const map = readImportMap()
      const existing = map[idKey]
      if (existing && existing.status === "pending") {
        setMessage("This CSV import is already in progress. Please wait...")
        setMessageType("warning")
        return
      }
      map[idKey] = { status: "pending", ts: Date.now() }
      writeImportMap(map)

      const formData = new FormData()
      formData.append("file", csvFile)
      formData.append("confirm", "true")
      formData.append("userId", uid)
      formData.append("idempotencyKey", idKey)

      const res = await fetch(`${API_BASE}/csv-mappings/import-sales`, {
        method: "POST",
        headers: { ...authHeaders() },
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        const importedCount = data.importedCount || data.rows?.length || data.sales?.length || 0
        const mapDone = readImportMap()
        mapDone[idKey] = { status: "done", ts: Date.now() }
        writeImportMap(mapDone)
        setShowPreviewModal(false)
        setMessage(`Successfully imported ${importedCount} sales`)
        setMessageType("success")
        resetCsvState()
        fetchSales()
      } else {
        const text = await res.text()
        const mapFail = readImportMap()
        delete mapFail[idKey]
        writeImportMap(mapFail)
        setMessage(text || "Failed to import sales.")
        setMessageType("error")
      }
    } catch (e) {
      try {
        if (currentImportKey) {
          const mapErr = readImportMap()
          delete mapErr[currentImportKey]
          writeImportMap(mapErr)
        }
      } catch {}
      setMessage(
        "Network error importing CSV. If this is a CORS issue, allow your origin and methods on https://busy-fool-backend-2-0.onrender.com.",
      )
      setMessageType("error")
    } finally {
      setIsProcessingCsv(false)
      setIsImporting(false)
      importingRef.current = false
    }
  }

  // Export sales to CSV (now includes amount if present)
  const exportSalesToCSV = () => {
    if (!sales || sales.length === 0) return
    const headers = ["Product", "Quantity", "User"]
    const csvRows = [
      headers.join(","),
      ...sales.map((sale) => {
        const product = sale.product?.name ?? sale.product_name ?? ""
        const qty = sale.quantity ?? sale.quantitySold ?? ""
        const user = sale.user?.name ?? ""
        return [product, qty, user]
          .map((val) => {
            const s = String(val ?? "")
            if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`
            return s
          })
          .join(",")
      }),
    ]
    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "busy-fool-sales.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
                <p className="text-amber-700 mt-1 text-sm">Track and import your product sales</p>
                {currentUserName ? (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    User: {currentUserName}
                  </p>
                ) : currentUserId ? (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    User ID: {currentUserId}
                  </p>
                ) : (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                   loading.
                  </p>
                )}
              </div>
           <div className="flex gap-2 flex-wrap">
  <Button
    onClick={() => setShowGuidelinesModal(true)}
    variant="outline"
    className="bg-white/80 hover:bg-white text-amber-700 border-amber-200 hover:border-amber-300 px-4 py-2 rounded-xl flex items-center gap-2 hover:shadow-md transition-all"
    type="button"
  >
    <Info className="w-4 h-4" />
    CSV Guidelines
  </Button>
  
  <Button
    onClick={exportSalesToCSV}
    className="bg-gradient-to-r from-[#6B4226] to-[#5a3620] text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all shadow-sm"
    type="button"
  >
    <Download className="w-4 h-4 mr-2" />
    Export CSV
  </Button>

  <Button
    onClick={() => setShowCsvModal(true)}
    className="bg-gradient-to-r from-[#6B4226] to-[#5a3620] text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all shadow-sm"
    disabled={isProcessingCsv}
    type="button"
  >
    <Upload className="w-4 h-4 mr-2" />
    Import CSV
  </Button>

  <Button
    onClick={() => setShowModal(true)}
    className="bg-gradient-to-r from-[#6B4226] to-[#5a3620] text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all shadow-sm"
    disabled={isSubmitting}
    type="button"
  >
    <Plus className="w-4 h-4 mr-2" />
    Add Sale
  </Button>
</div>
            </div>

            {message && (
              <div
                className={`mb-6 px-4 py-3 rounded-lg border-l-4 flex items-center gap-3 ${
                  messageType === "success"
                    ? "bg-green-50 text-green-800 border-green-400"
                    : messageType === "warning"
                      ? "bg-yellow-50 text-yellow-800 border-yellow-400"
                      : "bg-red-50 text-red-800 border-red-400"
                }`}
              >
                {messageType === "success" ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : messageType === "warning" ? (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">{message}</span>
              </div>
            )}

            {/* Show last preview stats above Sales History, as requested */}
       {salesStats ? (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {/* Total Sales Card - Always Blue (Neutral) */}
    <Card className="group relative bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">Total Sales</p>
            <p className="text-xs text-slate-500 mb-3">last preview</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(salesStats.totalSales)}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"></div>
      </CardContent>
    </Card>

    {/* Total Profit Card - Green if positive, Red if negative */}
    <Card className={`group relative bg-white/95 backdrop-blur-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      salesStats.totalProfit >= 0 
        ? 'border-emerald-200/60 shadow-lg shadow-emerald-100/20' 
        : 'border-red-200/60 shadow-lg shadow-red-100/20'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">Total Profit</p>
            <p className="text-xs text-slate-500 mb-3">last preview</p>
            <p className={`text-2xl font-bold ${
              salesStats.totalProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {formatCurrency(salesStats.totalProfit)}
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${
            salesStats.totalProfit >= 0 
              ? 'bg-emerald-50 border-emerald-100' 
              : 'bg-red-50 border-red-100'
          }`}>
            <DollarSign className={`w-5 h-5 ${
              salesStats.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`} />
          </div>
        </div>
        <div className={`mt-4 h-1 rounded-full ${
          salesStats.totalProfit >= 0 
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
            : 'bg-gradient-to-r from-red-500 to-red-400'
        }`}></div>
      </CardContent>
    </Card>

    {/* Profit Margin Card - Green if positive, Red if negative */}
    <Card className={`group relative bg-white/95 backdrop-blur-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      salesStats.avgProfitMargin >= 0 
        ? 'border-emerald-200/60 shadow-lg shadow-emerald-100/20' 
        : 'border-red-200/60 shadow-lg shadow-red-100/20'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">Avg Profit Margin</p>
            <p className="text-xs text-slate-500 mb-3">last preview</p>
            <p className={`text-2xl font-bold ${
              salesStats.avgProfitMargin >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {formatPercent2(salesStats.avgProfitMargin)}
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${
            salesStats.avgProfitMargin >= 0 
              ? 'bg-emerald-50 border-emerald-100' 
              : 'bg-red-50 border-red-100'
          }`}>
            <Percent className={`w-5 h-5 ${
              salesStats.avgProfitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`} />
          </div>
        </div>
        <div className={`mt-4 h-1 rounded-full ${
          salesStats.avgProfitMargin >= 0 
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
            : 'bg-gradient-to-r from-red-500 to-red-400'
        }`}></div>
      </CardContent>
    </Card>
  </div>
) : null}
<Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                    Sales History
                  </CardTitle>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center text-sm text-gray-600">
                      <span className="mr-2">Rows per page:</span>
                      <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                        <SelectTrigger className="h-8 w-[82px]">
                          <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 10, 20, 50, 100].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-xs sm:text-sm text-gray-600">
                      {sales.length === 0 ? "0 of 0" : `${startIdx + 1}-${endIdx} of ${sales.length}`}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="h-8"
                        aria-label="Previous page"
                        type="button"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="h-8"
                        aria-label="Next page"
                        type="button"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Product</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Quantity</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Date</th>
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
                      ) : (
                        paginatedSales.map((sale) => {
                          const product = sale.product?.name || sale.product_name || "-"
                          const qty = sale.quantity ?? sale.quantitySold ?? ""
                          const date = sale.saleDate || sale.sale_date || sale.date
                          let formattedDate;
      if (date) {
        formattedDate = new Date(date).toLocaleDateString();
      } else {
        // Show only today's date (not time) if no date is provided
        const today = new Date();
        formattedDate = today.toLocaleDateString();
      }
      return (
        <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors duration-150 bg-white">
          <td className="px-6 py-4 font-medium text-gray-900">{product}</td>
          <td className="px-6 py-4 text-right font-semibold text-gray-900">{qty}</td>
          <td className="px-6 py-4 text-center text-xs text-gray-700">{formattedDate}</td>
          <td className="px-6 py-4 text-center text-xs text-gray-700">{sale.user?.name || "-"}</td>
        </tr>
      )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Manual Add Sale Modal */}
            <Dialog open={showModal} onOpenChange={(open) => !open && setShowModal(false)}>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                <DialogHeader className="pb-6">
                  <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Plus className="w-5 h-5 text-amber-600" />
                    </div>
                    Add Sale
                  </DialogTitle>
                </DialogHeader>

                {message && messageType === "error" && (
                  <div className="mb-4 px-4 py-3 rounded-lg border-l-4 flex items-center gap-3 bg-red-50 text-red-800 border-red-400">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium">{message}</span>
                  </div>
                )}

                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="productId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Product *
                    </Label>
                    <Select
                      value={formData.productId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, productId: value }))}
                    >
                      <SelectTrigger
                        className={`h-12 ${formErrors.productId ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500"}`}
                      >
                        <SelectValue placeholder="Choose a product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id} className="py-3">
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.productId && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.productId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700">
                      Quantity *
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Enter quantity..."
                      className={`h-12 ${formErrors.quantity ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500"}`}
                    />
                    {formErrors.quantity && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.quantity}
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter className="pt-6 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 hover:bg-gray-50"
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
                    type="button"
                  >
                    {isSubmitting && (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    )}
                    {isSubmitting ? "Processing..." : "Add Sale"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* CSV Upload Modal */}
            <Dialog open={showCsvModal} onOpenChange={(open) => !open && setShowCsvModal(false)}>
              <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                <DialogHeader className="pb-6">
                  <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Upload className="w-5 h-5 text-green-600" />
                    </div>
                    Import Sales from CSV
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Select a CSV file to upload</p>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleCsvUpload(file)
                      }}
                      className="max-w-xs mx-auto"
                      disabled={isProcessingCsv}
                    />
                    {isProcessingCsv && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                        <span className="text-sm text-gray-600">Processing CSV...</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Expected CSV Format:</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• Product - Name of the product (required)</p>
                      <p>• Quantity - Number sold (required)</p>
                      <p>• Sale Price - Price per unit (required)</p>
                      <p>• Sale Date - Date of sale (optional)</p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowCsvModal(false)}
                    disabled={isProcessingCsv}
                    type="button"
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

{/* CSV Import Guidelines Modal */}
<Dialog open={showGuidelinesModal} onOpenChange={(open) => !open && setShowGuidelinesModal(false)}>
  <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border-0 shadow-2xl">
    <DialogHeader className="pb-6">
      <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent flex items-center gap-3">
        <div className="p-3 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl shadow-sm">
          <Info className="w-6 h-6 text-amber-600" />
        </div>
        CSV Upload Guidelines
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-8 py-4">
      {/* Key Guidelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-900 text-lg mb-2">Match Product Names</h3>
                <p className="text-emerald-800 text-sm leading-relaxed">
                  Use <strong>exact product names</strong> from your existing BusyFool products to ensure accurate reporting and profit calculations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-lg mb-2">Required Columns</h3>
                <div className="text-blue-800 text-sm space-y-1">
                  <p><code className="bg-blue-200 px-2 py-1 rounded">Item name</code> - Product identifier</p>
                  <p><code className="bg-blue-200 px-2 py-1 rounded">Quantity</code> - Number of items sold</p>
                  <p><code className="bg-blue-200 px-2 py-1 rounded">Amount</code> - Total sale value</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 text-lg mb-2">Amount Guidelines</h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Enter the <strong>total sale amount</strong> for the quantity, not the unit price. 
                  <br />Example: 10 items × $3.50 = $35.00
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-purple-900 text-lg mb-2">Avoid New Products</h3>
                <p className="text-purple-800 text-sm leading-relaxed">
                  Unknown products default to <strong>zero cost</strong>, which affects profit calculations. Ensure all items exist in your inventory first.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optional Column */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Optional Column</h3>
              <p className="text-gray-700 text-sm">
                <code className="bg-gray-200 px-2 py-1 rounded mr-2">Date</code>
                If missing, the system will use the filename date for daily sales tracking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supported Formats */}
      <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Upload className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="font-bold text-teal-900 text-lg">Supported Formats</h3>
          </div>
          <div className="flex gap-3">
            <span className="px-3 py-2 bg-teal-100 text-teal-800 rounded-lg text-sm font-semibold">.csv</span>
         </div> 
        </CardContent>
      </Card>

      {/* Example Section */}
      <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl shadow-sm">
              <Eye className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-xl">Example CSV Format</h3>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-200 overflow-hidden shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Item name</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Quantity</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-100">
                  <tr className="hover:bg-indigo-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 font-medium">Latte</td>
                    <td className="px-4 py-3 text-center text-gray-700">10</td>
                    <td className="px-4 py-3 text-right text-gray-700 font-semibold">35.00</td>
                    <td className="px-4 py-3 text-center text-gray-600 text-sm">2025-08-06</td>
                  </tr>
                  <tr className="hover:bg-indigo-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 font-medium">Cappuccino</td>
                    <td className="px-4 py-3 text-center text-gray-700">5</td>
                    <td className="px-4 py-3 text-right text-gray-700 font-semibold">22.50</td>
                    <td className="px-4 py-3 text-center text-gray-600 text-sm">2025-08-06</td>
                  </tr>
                  <tr className="hover:bg-indigo-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 font-medium">Croissant</td>
                    <td className="px-4 py-3 text-center text-gray-700">15</td>
                    <td className="px-4 py-3 text-right text-gray-700 font-semibold">67.50</td>
                    <td className="px-4 py-3 text-center text-gray-600 text-sm">2025-08-06</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
        
        </CardContent>
      </Card>
    </div>

    <DialogFooter className="pt-8 border-t border-gray-200">
      <Button
        onClick={() => setShowGuidelinesModal(false)}
        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
        type="button"
      >
        Got it! Let's Import
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
            {/* Drag & Drop Column Mapping Modal */}
            <Dialog open={showMappingModal} onOpenChange={(open) => !open && setShowMappingModal(false)}>
              <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                <DialogHeader className="pb-6">
                  <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    Map CSV Columns (Drag & Drop)
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-amber-800 font-medium mb-2">Instructions:</p>
                    <p className="text-amber-700 text-sm">
                      Drag CSV headers from the left and drop them onto the BusyFool fields on the right. Required
                      fields must be mapped to proceed.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* CSV Headers (Draggable) */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        CSV Columns ({csvHeaders.length})
                      </h3>

                      {csvHeaders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p>No CSV headers found</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {getAvailableHeaders().map((header, index) => (
                            <div
                              key={`${header}-${index}`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, header)}
                              className={`p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-move hover:bg-blue-100 transition-colors flex items-center gap-2 ${
                                draggedHeader === header ? "opacity-50" : ""
                              }`}
                            >
                              <GripVertical className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-blue-900">{header}</span>
                            </div>
                          ))}

                          {getAvailableHeaders().length === 0 && csvHeaders.length > 0 && (
                            <div className="text-center py-4 text-gray-500">
                              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                              <p className="text-sm">All columns have been mapped!</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* System Fields (Drop Zones) */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        BusyFool Fields
                      </h3>

                      <div className="space-y-3">
                        {busyfoolFields.map((field) => (
                          <div
                            key={field.key}
                            onDragOver={(e) => handleDragOver(e, field.key)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, field.key)}
                            className={`p-4 border-2 border-dashed rounded-lg transition-all min-h-[80px] ${
                              dragOverField === field.key
                                ? "border-green-400 bg-green-50"
                                : mappings[field.key]
                                  ? "border-green-300 bg-green-50"
                                  : field.required
                                    ? "border-red-300 bg-red-50"
                                    : "border-gray-300 bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-900">{field.label}</span>
                                  {field.required && <span className="text-red-500 text-sm">*</span>}
                                </div>
                                <p className="text-xs text-gray-600">{field.description}</p>
                              </div>

                              {mappings[field.key] && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMappingForField(field.key)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                  type="button"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>

                            {mappings[field.key] ? (
                              <div className="mt-2 p-2 bg-white border border-green-200 rounded flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-900">{mappings[field.key]}</span>
                              </div>
                            ) : (
                              <div className="mt-2 text-center text-gray-500 text-sm">
                                {dragOverField === field.key ? "Drop here" : "Drag a CSV column here"}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-6 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowMappingModal(false)
                      resetCsvState()
                    }}
                    disabled={isProcessingCsv}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveMappings}
                    disabled={isProcessingCsv}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    type="button"
                  >
                    {isProcessingCsv && (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    )}
                    {isProcessingCsv ? "Processing..." : "Save Mappings & Preview"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Preview Modal (using daily JSON) */}
            <Dialog open={showPreviewModal} onOpenChange={(open) => !open && setShowPreviewModal(false)}>
              <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                <DialogHeader className="pb-6">
                  <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Eye className="w-5 h-5 text-purple-600" />
                    </div>
                    Preview Import
                  </DialogTitle>
                </DialogHeader>

                {previewData && (
                  <div className="space-y-6 py-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <DollarSign className="w-8 h-8 text-green-600" />
                            <div>
                              <p className="text-sm text-green-700">Total Sales</p>
                              <p className="text-2xl font-bold text-green-900">
                                {formatCurrency(previewData.totalSales || 0)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <DollarSign className="w-8 h-8 text-blue-600" />
                            <div>
                              <p className="text-sm text-blue-700">Total Profit</p>
                              <p className="text-2xl font-bold text-blue-900">
                                {formatCurrency(previewData.totalProfit || 0)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Percent className="w-8 h-8 text-purple-600" />
                            <div>
                              <p className="text-sm text-purple-700">Avg Profit Margin</p>
                              <p className="text-2xl font-bold text-purple-900">
                                {formatPercent2(previewData.avgProfitMargin || 0)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Preview pagination controls */}
                    <div className="flex items-center justify-between px-2">
                      <div className="text-sm text-gray-600">
                        {previewRows.length === 0
                          ? "0 of 0"
                          : `${previewStart + 1}-${previewEnd} of ${previewRows.length}`}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center text-sm text-gray-600">
                          <span className="mr-2">Rows per page:</span>
                          <Select value={String(previewPageSize)} onValueChange={(v) => setPreviewPageSize(Number(v))}>
                            <SelectTrigger className="h-8 w-[82px]">
                              <SelectValue placeholder="20" />
                            </SelectTrigger>
                            <SelectContent>
                              {[10, 20, 50, 100].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                            disabled={previewPage <= 1}
                            className="h-8"
                            aria-label="Previous preview page"
                            type="button"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewPage((p) => Math.min(previewTotalPages, p + 1))}
                            disabled={previewPage >= previewTotalPages}
                            className="h-8"
                            aria-label="Next preview page"
                            type="button"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Preview Table (with Unit Price and Amount now visible) */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Sales Preview ({previewRows.length} rows)</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto max-h-[60vh]">
                          <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Quantity</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Unit Price</th>
                              
                                <th className="px-4 py-3 text-right textsm font-semibold text-gray-700">Amount</th>
                              
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Profit</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {paginatedPreviewRows.map((sale, index) => (
                                <tr key={`${previewStart}-${index}`} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{sale.productName}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{sale.quantitySold}</td>
                                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(sale.unitPrice)}</td>
                                 
                                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(sale.amount)}</td>
                                 
                                  <td className="px-4 py-3 text-sm text-right">
                                    <span
                                      className={`font-medium ${
                                        Number(sale.profit || 0) >= 0 ? "text-green-600" : "text-red-600"
                                      }`}
                                    >
                                      {formatCurrency(sale.profit)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <DialogFooter className="pt-6 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPreviewModal(false)
                      setShowMappingModal(true)
                    }}
                    disabled={isProcessingCsv || isImporting}
                    className="flex items-center gap-2"
                    type="button"
                  >
                    <Edit3 className="w-4 h-4" />
                    Change Mapping
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPreviewModal(false)
                      resetCsvState()
                    }}
                    disabled={isProcessingCsv || isImporting}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmImport}
                    disabled={isProcessingCsv || isImporting}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    type="button"
                  >
                    {(isProcessingCsv || isImporting) && (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    )}
                    {isImporting ? "Importing..." : "Confirm Import"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}
