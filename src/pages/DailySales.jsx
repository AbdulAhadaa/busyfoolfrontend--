"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Sidebar } from "../components/Sidebar"
import { Navbar } from "../components/Navbar"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select"
import {
  Upload,
  FileText,
  DollarSign,
  Calendar,
  Percent,
  ListFilter,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Download,
  User,
} from "lucide-react"

const API_BASE = "https://busy-fool-backend.vercel.app"

// Only these 4 expected fields per your requirement
const dailyFields = [
  { key: "productName", label: "Product", required: true, description: "Name of the product" },
  { key: "quantitySold", label: "Quantity", required: true, description: "Number sold" },
  { key: "salePrice", label: "Sale Price", required: false, description: "Price per unit (optional)" },
  { key: "saleDate", label: "Sale Date", required: false, description: "Date of sale (optional)" },
]

// Local cache keys
const DAILY_CACHE_KEY = "bf:daily:last" // stores { insights, rows }
const DAILY_PAGE_SIZE_KEY = "bf:daily:pageSize"
const DAILY_QUERY_KEY = "bf:daily:query"
const MAP_PREFIX = "bf:daily:mappings"

function norm(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
}
function headerSignature(headers) {
  return (headers || []).map(norm).sort().join("|")
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

export default function DailySales() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Profile
  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentUserName, setCurrentUserName] = useState("")

  // Data displayed on page
  const [insights, setInsights] = useState({ totalSales: 0, totalProfit: 0, avgProfitMargin: 0 })
  const [rows, setRows] = useState([])

  // UI state
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("") // success | warning | error
  const [isProcessing, setIsProcessing] = useState(false)

  // Filters and pagination for main table
  const [query, setQuery] = useState(() => localStorage.getItem(DAILY_QUERY_KEY) || "")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem(DAILY_PAGE_SIZE_KEY)
    return saved ? Number(saved) : 20
  })

  // Modals
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [showMappingModal, setShowMappingModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // CSV & mapping state
  const [csvFile, setCsvFile] = useState(null)
  const [csvHeaders, setCsvHeaders] = useState([])
  const [headerSig, setHeaderSig] = useState(null)

  const [draggedHeader, setDraggedHeader] = useState(null)
  const [dragOverField, setDragOverField] = useState(null)
  const [mappings, setMappings] = useState({
    productName: null,
    quantitySold: null,
    salePrice: null,
    saleDate: null,
  })

  // Preview pagination inside modal
  const [previewPage, setPreviewPage] = useState(1)
  const [previewPageSize, setPreviewPageSize] = useState(20)
  const previewRows = rows
  const previewTotalPages = Math.max(1, Math.ceil((previewRows?.length || 0) / previewPageSize))
  const previewStart = (previewPage - 1) * previewPageSize
  const previewEnd = Math.min(previewStart + previewPageSize, previewRows.length)
  const paginatedPreviewRows = useMemo(
    () => previewRows.slice(previewStart, previewEnd),
    [previewRows, previewStart, previewEnd],
  )
  useEffect(() => setPreviewPage(1), [previewRows.length, previewPageSize])

  // Idempotency/in-flight (if later needed)
  const importingRef = useRef(false)

  // Helpers
  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("accessToken")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const loadProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken")
      if (token) {
        const res = await fetch(`${API_BASE}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          const uid = data?.id || data?.user?.id
          const name = data?.name || data?.user?.name || data?.username || ""
          if (uid) {
            setCurrentUserId(uid)
            localStorage.setItem("userId", uid)
          }
          if (name) {
            setCurrentUserName(name)
            localStorage.setItem("userName", name)
          }
          return { uid, name }
        }
      }
    } catch {}
    try {
      const uid = localStorage.getItem("userId")
      const userStr = localStorage.getItem("user")
      const storedName = localStorage.getItem("userName")
      let name = storedName || ""
      if (!name && userStr) {
        const u = JSON.parse(userStr)
        name = u?.name || u?.user?.name || u?.username || ""
      }
      if (uid) setCurrentUserId(uid)
      if (name) setCurrentUserName(name)
      return { uid, name }
    } catch {
      return { uid: null, name: "" }
    }
  }, [])

  // Initial restore
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DAILY_CACHE_KEY) || "{}")
      if (saved && typeof saved === "object") {
        if (saved.insights) {
          const i = saved.insights
          setInsights({
            totalSales: Number(i.totalSales) || 0,
            totalProfit: Number(i.totalProfit) || 0,
            avgProfitMargin: Number(i.avgProfitMargin) || 0,
          })
        }
        if (Array.isArray(saved.rows)) setRows(saved.rows)
      }
    } catch {}
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    localStorage.setItem(DAILY_QUERY_KEY, query)
  }, [query])

  useEffect(() => {
    localStorage.setItem(DAILY_PAGE_SIZE_KEY, String(pageSize))
  }, [pageSize])

  useEffect(() => {
    try {
      const payload = { insights, rows }
      localStorage.setItem(DAILY_CACHE_KEY, JSON.stringify(payload))
    } catch {}
  }, [insights, rows])

  // Filtering and pagination for main table
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      String(r.productName || "")
        .toLowerCase()
        .includes(q),
    )
  }, [rows, query])
  const totalPages = Math.max(1, Math.ceil((filteredRows?.length || 0) / pageSize))
  const startIdx = (page - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, filteredRows.length)
  const paginatedRows = useMemo(() => filteredRows.slice(startIdx, endIdx), [filteredRows, startIdx, endIdx])
  useEffect(() => setPage(1), [filteredRows.length, pageSize])

  // Drag & drop mapping helpers
  const getAvailableHeaders = useCallback(() => {
    const mapped = Object.values(mappings).filter(Boolean)
    return csvHeaders.filter((h) => !mapped.includes(h))
  }, [csvHeaders, mappings])

  const handleDragStart = useCallback((e, header) => {
    setDraggedHeader(header)
    e.dataTransfer.effectAllowed = "move"
  }, [])
  const handleDragOver = useCallback((e, fieldKey) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverField(fieldKey)
  }, [])
  const handleDragLeave = useCallback(() => setDragOverField(null), [])
  const handleDrop = useCallback(
    (e, fieldKey) => {
      e.preventDefault()
      if (draggedHeader) setMappings((prev) => ({ ...prev, [fieldKey]: draggedHeader }))
      setDraggedHeader(null)
      setDragOverField(null)
    },
    [draggedHeader],
  )
  const removeMappingForField = useCallback((fieldKey) => {
    setMappings((prev) => ({ ...prev, [fieldKey]: null }))
  }, [])

  // Mapping local storage (per userName + headerSig)
  const saveMappingLocal = useCallback((userName, sig, mappingObject, headers) => {
    if (!userName || !sig || !mappingObject) return
    const key = `${MAP_PREFIX}:${userName}:${sig}`
    const value = { savedAt: new Date().toISOString(), headers, mappings: mappingObject }
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [])
  const loadMappingLocal = useCallback((userName, sig) => {
    if (!userName || !sig) return null
    try {
      const raw = localStorage.getItem(`${MAP_PREFIX}:${userName}:${sig}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  // Save mapping on server
  const saveMappingSilent = useCallback(
    async (uid, mappingObject) => {
      const mappingArray = Object.entries(mappingObject)
        .filter(([, v]) => v !== null)
        .map(([fieldKey, posHeader]) => ({ busyfoolColumn: fieldKey, posColumnName: posHeader }))
      const res = await fetch(`${API_BASE}/csv-mappings/save-mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ userId: uid, mappings: mappingArray }),
      })
      return res.ok
    },
    [authHeaders],
  )

  // CSV Upload -> detect headers -> try auto mapping -> open mapping or preview
  const handleCsvUpload = useCallback(
    async (file) => {
      if (!file) return
      setIsProcessing(true)
      setMessage("")
      setMessageType("")
      try {
        const form = new FormData()
        form.append("file", file)
        const { uid, name } = (await loadProfile()) || {}
        if (uid) form.append("userId", uid)

        const res = await fetch(`${API_BASE}/csv-mappings/upload-temp`, {
          method: "POST",
          headers: { ...authHeaders() },
          body: form,
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
          setIsProcessing(false)
          return
        }

        setCsvHeaders(headers)
        setCsvFile(file)
        const sig = headerSignature(headers)
        setHeaderSig(sig)

        const previous = loadMappingLocal(name || "unknown", sig)
        if (previous?.mappings) {
          setMappings(previous.mappings)

          // Check required fields
          const set = new Set(headers.map((h) => String(h)))
          const hasReq = dailyFields
            .filter((f) => f.required)
            .every((f) => previous.mappings[f.key] && set.has(previous.mappings[f.key]))
          if (hasReq) {
            const synced = await saveMappingSilent(uid, previous.mappings)
            if (synced) {
              setShowCsvModal(false)
              setShowMappingModal(false)
              setMessage("Found previous mapping. Auto-applied and generating preview...")
              setMessageType("success")
              await previewDaily(file)
              setIsProcessing(false)
              return
            }
          }
        }

        setShowCsvModal(false)
        setShowMappingModal(true)
        setMessage("CSV uploaded. Please map the columns.")
        setMessageType("success")
      } catch (e) {
        setMessage(e?.message || "Network error uploading CSV.")
        setMessageType("error")
      }
      setIsProcessing(false)
    },
    [authHeaders, loadProfile, loadMappingLocal, saveMappingSilent],
  )

  const saveMappings = useCallback(async () => {
    const missing = dailyFields.filter((f) => f.required && !mappings[f.key])
    if (missing.length) {
      setMessage(`Please map required fields: ${missing.map((f) => f.label).join(", ")}`)
      setMessageType("error")
      return
    }

    setIsProcessing(true)
    try {
      const { uid, name } = (await loadProfile()) || {}
      if (!uid) {
        setMessage("Could not determine user. Please log in again.")
        setMessageType("error")
        setIsProcessing(false)
        return
      }
      // Persist mapping locally and on server
      saveMappingLocal(name || "unknown", headerSig, mappings, csvHeaders)
      const ok = await saveMappingSilent(uid, mappings)
      if (!ok) throw new Error("Failed to save mappings on server.")
      setShowMappingModal(false)
      setMessage("Mappings saved. Generating preview...")
      setMessageType("success")
      setTimeout(() => previewDaily(csvFile), 80)
    } catch (e) {
      setMessage(e?.message || "Network error saving mappings.")
      setMessageType("error")
    }
    setIsProcessing(false)
  }, [csvFile, csvHeaders, headerSig, mappings, loadProfile, saveMappingLocal, saveMappingSilent])

  const previewDaily = useCallback(
    async (fileOverride = null) => {
      const fileToUse = fileOverride || csvFile
      if (!fileToUse) {
        setMessage("No CSV file selected. Please upload again.")
        setMessageType("error")
        return
      }
      setIsProcessing(true)
      try {
        const { uid } = (await loadProfile()) || {}
        if (!uid) throw new Error("Could not determine user. Please log in again.")

        const form = new FormData()
        form.append("file", fileToUse)
        form.append("confirm", "false")
        form.append("userId", uid)

        const res = await fetch(`${API_BASE}/csv-mappings/import-daily-sales`, {
          method: "POST",
          headers: { ...authHeaders() },
          body: form,
        })
        if (!res.ok) {
          const t = await res.text()
          throw new Error(t || "Failed to preview import.")
        }
        const data = await res.json()
        const mappedRows = Array.isArray(data.rows)
          ? data.rows.map((r) => ({
              ...r,
              amount:
                r.amount ??
                (r.quantitySold != null && (r.salePrice != null || r.unitPrice != null)
                  ? Number(r.quantitySold) * Number(r.salePrice ?? r.unitPrice)
                  : r.amount),
            }))
          : []
        setInsights({
          totalSales: Number(data.totalSales) || 0,
          totalProfit: Number(data.totalProfit) || 0,
          avgProfitMargin: Number(data.avgProfitMargin ?? data.averageProfitMargin) || 0,
        })
        setRows(mappedRows)
        setShowPreviewModal(true)
        setMessage("Preview generated successfully.")
        setMessageType("success")
        try {
          localStorage.setItem(
            DAILY_CACHE_KEY,
            JSON.stringify({
              insights: {
                totalSales: Number(data.totalSales) || 0,
                totalProfit: Number(data.totalProfit) || 0,
                avgProfitMargin: Number(data.avgProfitMargin ?? data.averageProfitMargin) || 0,
              },
              rows: mappedRows,
            }),
          )
        } catch {}
      } catch (e) {
        setMessage(e?.message || "Network error generating preview.")
        setMessageType("error")
      }
      setIsProcessing(false)
    },
    [authHeaders, csvFile, loadProfile],
  )

  const confirmDaily = useCallback(async () => {
    if (!csvFile) return
    if (importingRef.current) return
    importingRef.current = true
    setIsProcessing(true)
    try {
      const { uid } = (await loadProfile()) || {}
      if (!uid) throw new Error("Could not determine user. Please log in again.")

      const form = new FormData()
      form.append("file", csvFile)
      form.append("confirm", "true")
      form.append("userId", uid)

      const res = await fetch(`${API_BASE}/csv-mappings/import-daily-sales`, {
        method: "POST",
        headers: { ...authHeaders() },
        body: form,
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || "Failed to import daily sales.")
      }
      const data = await res.json()
      setInsights({
        totalSales: Number(data.totalSales) || insights.totalSales,
        totalProfit: Number(data.totalProfit) || insights.totalProfit,
        avgProfitMargin: Number(data.avgProfitMargin) || insights.avgProfitMargin,
      })
      setRows(Array.isArray(data.rows) ? data.rows : rows)
      setShowPreviewModal(false)
      setMessage("Import saved successfully.")
      setMessageType("success")
      try {
        localStorage.setItem(
          DAILY_CACHE_KEY,
          JSON.stringify({ insights: { ...data }, rows: Array.isArray(data.rows) ? data.rows : [] }),
        )
      } catch {}
    } catch (e) {
      setMessage(e?.message || "Network error importing daily sales.")
      setMessageType("error")
    } finally {
      setIsProcessing(false)
      importingRef.current = false
    }
  }, [authHeaders, csvFile, insights, loadProfile, rows])

  const exportCSV = useCallback(() => {
    if (!filteredRows.length) return
    const headers = ["productName", "quantitySold", "unitPrice", "salePrice", "amount", "profit", "saleDate"]
    const csv = [
      headers.join(","),
      ...filteredRows.map((r) => {
        const qty = r.quantitySold
        const unit = r.unitPrice
        const price = r.salePrice
        const amount =
          r.amount ?? (qty != null && (price != null || unit != null) ? Number(qty) * Number(price ?? unit) : "")
        return [r.productName, qty, unit, price, amount, r.profit, r.saleDate]
          .map((v) => {
            if (v == null) return ""
            const s = String(v)
            if (s.includes(",") || s.includes('"') || s.includes("\n")) {
              return `"${s.replace(/"/g, '""')}"`
            }
            return s
          })
          .join(",")
      }),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "daily-sales.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [filteredRows])

  const resetCsvState = useCallback(() => {
    setCsvFile(null)
    setCsvHeaders([])
    setHeaderSig(null)
    setMappings({ productName: null, quantitySold: null, salePrice: null, saleDate: null })
    setDraggedHeader(null)
    setDragOverField(null)
    setPreviewPage(1)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 space-y-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-amber-900 tracking-tight">Daily Sales</h1>
                <p className="text-amber-700 mt-1 text-sm">Upload and review your daily sales insights</p>
                {currentUserName ? (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    User: {currentUserName}
                  </p>
                ) : (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Could not determine user. Please log in.
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={exportCSV}
                  className="bg-gradient-to-r from-gray-600 to-amber-900 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all shadow-sm"
                  type="button"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => setShowCsvModal(true)}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all shadow-sm"
                  disabled={isProcessing}
                  type="button"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
              </div>
            </div>

            {/* Message */}
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

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                  <CardTitle className="text-sm font-semibold text-gray-700">Total Sales</CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-amber-600" />
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(insights.totalSales)}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                  <CardTitle className="text-sm font-semibold text-gray-700">Total Profit</CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-amber-600" />
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(insights.totalProfit)}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                  <CardTitle className="text-sm font-semibold text-gray-700">Avg Profit Margin</CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex items-center gap-3">
                  <Percent className="w-6 h-6 text-amber-600" />
                  <div className="text-2xl font-bold text-gray-900">{formatPercent2(insights.avgProfitMargin)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Report Table */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl mt-6">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  Daily Sales Report
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ListFilter className="w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search product..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="h-9 w-56"
                    />
                  </div>
                  <div className="hidden sm:flex items-center text-sm text-gray-600">
                    <span className="mr-2">Rows per page:</span>
                    <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
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
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Product</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Qty</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Unit Price</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Sale Price</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Amount</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Profit</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center align-middle min-h-[300px]">
                            <div className="flex flex-col items-center justify-center gap-3 min-h-[220px] h-full w-full">
                              <DollarSign className="w-12 h-12 text-gray-300 mb-2" />
                              <div className="flex flex-col items-center">
                                <p className="text-gray-500 font-medium text-center">No data</p>
                                <p className="text-gray-400 text-sm text-center">Import a CSV to see the report</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedRows.map((r, idx) => {
                          const qty = r.quantitySold
                          const unit = r.unitPrice
                          const price = r.salePrice
                          const amount =
                            r.amount ??
                            (qty != null && (price != null || unit != null)
                              ? Number(qty) * Number(price ?? unit)
                              : null)
                          return (
                            <tr
                              key={`${r.productName}-${idx}`}
                              className="hover:bg-gray-50/50 transition-colors duration-150 bg-white"
                            >
                              <td className="px-6 py-4 font-medium text-gray-900">{r.productName || "-"}</td>
                              <td className="px-6 py-4 text-right font-semibold text-gray-900">{qty ?? "-"}</td>
                              <td className="px-6 py-4 text-right text-gray-900">
                                {unit != null ? formatCurrency(unit) : "-"}
                              </td>
                              <td className="px-6 py-4 text-right text-gray-900">
                                {price != null ? formatCurrency(price) : "-"}
                              </td>
                              <td className="px-6 py-4 text-right text-gray-900">
                                {amount != null ? formatCurrency(amount) : "-"}
                              </td>
                              <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(r.profit)}</td>
                              <td className="px-6 py-4 text-left text-sm text-gray-700">
                                {r.saleDate ? new Date(r.saleDate).toLocaleString() : "-"}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination controls */}
                <div className="flex items-center justify-between p-4">
                  <div className="text-xs sm:text-sm text-gray-600">
                    {filteredRows.length === 0 ? "0 of 0" : `${startIdx + 1}-${endIdx} of ${filteredRows.length}`}
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
              </CardContent>
            </Card>

            {/* CSV Upload Modal */}
            <Dialog open={showCsvModal} onOpenChange={(open) => !open && setShowCsvModal(false)}>
              <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                <DialogHeader className="pb-6">
                  <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Upload className="w-5 h-5 text-green-600" />
                    </div>
                    Import Daily Sales from CSV
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
                      disabled={isProcessing}
                    />
                    {isProcessing && (
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
                      <p>• Sale Price - Price per unit (optional)</p>
                      <p>• Sale Date - Date of sale (optional)</p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-6">
                  <Button variant="outline" onClick={() => setShowCsvModal(false)} disabled={isProcessing}>
                    Cancel
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
                      Drag CSV headers from the left and drop them onto the fields on the right. Required fields must be
                      mapped to proceed.
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
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Daily Fields
                      </h3>

                      <div className="space-y-3">
                        {dailyFields.map((field) => (
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
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveMappings}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    {isProcessing && (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    )}
                    {isProcessing ? "Processing..." : "Save Mappings & Preview"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Preview Modal */}
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

                {rows && (
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
                                {formatCurrency(insights.totalSales || 0)}
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
                                {formatCurrency(insights.totalProfit || 0)}
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
                                {formatPercent2(insights.avgProfitMargin || 0)}
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

                    {/* Preview Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Rows ({previewRows.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto max-h-[60vh]">
                          <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Qty</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Unit Price</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Sale Price</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Profit</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {paginatedPreviewRows.map((r, i) => {
                                const qty = r.quantitySold
                                const unit = r.unitPrice
                                const price = r.salePrice
                                const amount =
                                  r.amount ??
                                  (qty != null && (price != null || unit != null)
                                    ? Number(qty) * Number(price ?? unit)
                                    : null)
                                return (
                                  <tr key={`${previewStart}-${i}`} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">{r.productName}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{qty}</td>
                                    <td className="px-4 py-3 text-sm text-right">
                                      {unit != null ? formatCurrency(unit) : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right">
                                      {price != null ? formatCurrency(price) : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right">
                                      {amount != null ? formatCurrency(amount) : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(r.profit)}</td>
                                    <td className="px-4 py-3 text-sm">
                                      {r.saleDate ? new Date(r.saleDate).toLocaleString() : "-"}
                                    </td>
                                  </tr>
                                )
                              })}
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
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    Change Mapping
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPreviewModal(false)
                      resetCsvState()
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDaily}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  >
                    {isProcessing && (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    )}
                    {isProcessing ? "Importing..." : "Confirm Import"}
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
