import React, { useState, useEffect } from "react"
import { Sidebar } from "../components/Sidebar"
import { Navbar } from "../components/Navbar"

import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowDown, 
  ArrowUp, 
  Sparkles, 
  Coffee, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Package,
  Users,
  Clock,
  Target,
  Lightbulb,
  Star,
  ChevronRight,
  Info
} from "lucide-react"

export default function BusyFoolDashboard() {
  const [activeTab, setActiveTab] = useState("losing")
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showAlert, setShowAlert] = useState(true)
  // Sidebar mobile state
 const [sidebarOpen, setSidebarOpen] = useState(false);

  // Enhanced business data based on the brief
  const todaysSummary = {
    revenue: 1847,
    costs: 1426,
    profit: 421,
    profitMargin: 23,
    transactions: 187,
    avgTransaction: 9.87,
    wasteValue: 23.40
  }

  const topAlerts = [
    {
      type: "price_increase",
      message: "Oat milk supplier increased price by 15% - affects 12 products",
      impact: "$47/day potential loss",
      urgent: true
    },
    {
      type: "missing_recipe",
      message: "Found 23 sales of 'Maple Oat Latte' with no recipe defined",
      impact: "Unknown margins",
      urgent: false
    }
  ]

  const detailedSections = {
    losing: [
      { 
        name: "Rose Latte", 
        loss: -0.47, 
        soldToday: 23,
        totalLoss: 10.81,
        ingredients: ["Rose syrup ($0.25)", "Oat milk ($0.18)", "Coffee ($0.12)"],
        sellPrice: 4.50,
        cost: 4.97,
        popularity: "High",
        suggestion: "Remove edible flower (-$0.40) or raise price by $1"
      },
      { 
        name: "Lavender Honey Latte", 
        loss: -0.23, 
        soldToday: 18,
        totalLoss: 4.14,
        ingredients: ["Lavender syrup ($0.15)", "Honey ($0.08)", "Whole milk ($0.12)"],
        sellPrice: 4.20,
        cost: 4.43,
        popularity: "Medium",
        suggestion: "Reduce lavender portion by 20% (-$0.03)"
      },
      { 
        name: "Turmeric Golden Latte", 
        loss: -0.35, 
        soldToday: 12,
        totalLoss: 4.20,
        ingredients: ["Turmeric powder ($0.22)", "Coconut milk ($0.15)", "Honey ($0.08)"],
        sellPrice: 4.80,
        cost: 5.15,
        popularity: "Low",
        suggestion: "Consider discontinuing or raise to $5.50"
      }
    ],
    winners: [
      { 
        name: "Cold Brew", 
        profit: 3.20, 
        soldToday: 34,
        totalProfit: 108.80,
        ingredients: ["Cold brew coffee ($0.45)", "Ice ($0.05)"],
        sellPrice: 3.70,
        cost: 0.50,
        popularity: "Very High",
        margin: 86.5,
        suggestion: "Push this more - highest margin drink"
      },
      { 
        name: "Flat White", 
        profit: 2.10, 
        soldToday: 45,
        totalProfit: 94.50,
        ingredients: ["Double shot ($0.24)", "Whole milk ($0.16)"],
        sellPrice: 2.50,
        cost: 0.40,
        popularity: "Very High",
        margin: 84.0,
        suggestion: "Perfect profit margins - keep promoting"
      },
      { 
        name: "Americano", 
        profit: 1.85, 
        soldToday: 28,
        totalProfit: 51.80,
        ingredients: ["Double shot ($0.24)", "Hot water ($0.01)"],
        sellPrice: 2.10,
        cost: 0.25,
        popularity: "High",
        margin: 88.1,
        suggestion: "Consider upselling to larger size"
      }
    ],
    quickwins: [
      { 
        name: "Standardize 'dollop' portions", 
        tip: "Save $12-18/day on inconsistent portions",
        effort: "Low",
        impact: "Medium",
        timeframe: "This week",
        icon: Package
      },
      { 
        name: "Reduce oat milk waste", 
        tip: "Currently 15% waste - target 8%",
        effort: "Medium",
        impact: "High",
        timeframe: "2 weeks",
        icon: TrendingDown
      },
      { 
        name: "Push Cold Brew at 3PM", 
        tip: "86% margin vs 23% average",
        effort: "Low",
        impact: "High",
        timeframe: "Today",
        icon: TrendingUp
      },
      { 
        name: "Smaller cup option for Rose Latte", 
        tip: "Reduce ingredient cost by 25%",
        effort: "Low",
        impact: "Medium",
        timeframe: "Next week",
        icon: Coffee
      }
    ]
  }

  const liveInsights = [
    { 
      title: "Matcha Coconut Latte", 
      subtitle: "New recipe suggestion",
      gain: "+$1.85 profit margin", 
      confidence: 94,
      description: "Based on trending ingredients & your supplier costs"
    },
    { 
      title: "Iced Vanilla Cortado", 
      subtitle: "Summer variant",
      gain: "+$1.40 profit margin", 
      confidence: 87,
      description: "Cold drinks have 15% higher margins"
    },
    { 
      title: "Cinnamon Oat Flat White", 
      subtitle: "Upgrade existing winner",
      gain: "+$0.65 profit boost", 
      confidence: 91,
      description: "Minimal cost increase, premium pricing opportunity"
    }
  ]

  const wasteTracking = {
    oatMilk: { bought: 40, used: 34, waste: 15, cost: 12.60 },
    wholeMilk: { bought: 60, used: 57, waste: 5, cost: 8.40 },
    syrups: { bought: 20, used: 18, waste: 10, cost: 15.20 }
  }

  // Auto-rotate insights
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % liveInsights.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const TabButton = ({ id, label, badge, active, onClick }) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`text-sm font-medium px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 ${
        active
          ? "bg-[#6B4226] text-white shadow-lg"
          : "text-[#6B4226] hover:bg-[#F5F2EE] bg-white border border-gray-200"
      }`}
    >
      {label}
      {badge && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          active ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
        }`}>
          {badge}
        </span>
      )}
    </motion.button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br bg-white ">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 space-y-6">
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F5] to-[#F5F2EE] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-[#6B4226] flex items-center gap-3">
              <Coffee className="w-8 h-8" />
              Today's Reality Check
            </h1>
            <div className="text-right">
              <p className="text-sm text-gray-500">Sunday, July 27, 2025</p>
              <p className="text-xs text-gray-400">Live data · Updates every 5min</p>
            </div>
          </div>
          <p className="text-gray-600">
            Your coffee shop's true profitability revealed - including waste, customizations, and hidden costs.
          </p>
        </motion.div>

        {/* Alert Banner */}
        <AnimatePresence>
          {showAlert && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-800 mb-1">Price Alert</h3>
                  <p className="text-orange-700 text-sm mb-2">{topAlerts[0].message}</p>
                  <p className="text-orange-600 text-xs font-medium">{topAlerts[0].impact}</p>
                </div>
                <button 
                  onClick={() => setShowAlert(false)}
                  className="text-orange-400 hover:text-orange-600"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { 
              label: "Revenue", 
              value: todaysSummary.revenue, 
              color: "text-[#6B4226]",
              bgColor: "from-[#6B4226]/10 to-[#6B4226]/5",
              icon: DollarSign,
              subtitle: `${todaysSummary.transactions} transactions`,
              change: "+12%"
            },
            { 
              label: "True Costs", 
              value: todaysSummary.costs, 
              color: "text-orange-500",
              bgColor: "from-orange-100 to-orange-50",
              icon: Package,
              subtitle: `Inc. $${todaysSummary.wasteValue} waste`,
              change: "+8%"
            },
            { 
              label: "Real Profit", 
              value: todaysSummary.profit, 
              color: "text-green-600",
              bgColor: "from-green-100 to-green-50",
              icon: TrendingUp,
              subtitle: `${todaysSummary.profitMargin}% margin`,
              change: "+15%"
            },
            { 
              label: "Avg Transaction", 
              value: todaysSummary.avgTransaction, 
              color: "text-blue-600",
              bgColor: "from-blue-100 to-blue-50",
              icon: Users,
              subtitle: "Per customer",
              change: "+3%"
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -2 }}
              className={`bg-gradient-to-br ${item.bgColor} p-6 rounded-2xl shadow-sm border border-white/50 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <item.icon className={`w-6 h-6 ${item.color}`} />
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  {item.change}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{item.label}</p>
              <h3 className={`text-3xl font-bold ${item.color} mb-1`}>
                ${typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
              </h3>
              <p className="text-xs text-gray-500">{item.subtitle}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced Tab Navigation */}
        <div className="flex gap-3 flex-wrap mb-6">
          <TabButton
            id="losing"
            label="Losing Money"
            badge="3"
            active={activeTab === "losing"}
            onClick={() => setActiveTab("losing")}
          />
          <TabButton
            id="winners"
            label="Your Winners"
            active={activeTab === "winners"}
            onClick={() => setActiveTab("winners")}
          />
          <TabButton
            id="quickwins"
            label="Quick Wins"
            badge="4"
            active={activeTab === "quickwins"}
            onClick={() => setActiveTab("quickwins")}
          />
        </div>

        {/* Enhanced Product Cards */}
        <motion.div
          layout
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-8"
        >
          <AnimatePresence mode="wait">
            {detailedSections[activeTab].map((item, idx) => (
              <motion.div
                key={`${activeTab}-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-[#6B4226] text-lg mb-1">{item.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      {activeTab === "losing" || activeTab === "winners" 
                        ? `Sold today: ${item.soldToday}`
                        : `Effort: ${item.effort}`
                      }
                    </div>
                  </div>

                  {activeTab === "losing" && (
                    <div className="text-right">
                      <div className="text-red-500 font-bold flex items-center gap-1">
                        <ArrowDown className="w-4 h-4" />
                        ${Math.abs(item.loss).toFixed(2)}
                      </div>
                      <div className="text-xs text-red-400">
                        -${item.totalLoss.toFixed(2)} today
                      </div>
                    </div>
                  )}

                  {activeTab === "winners" && (
                    <div className="text-right">
                      <div className="text-green-600 font-bold flex items-center gap-1">
                        <ArrowUp className="w-4 h-4" />
                        ${item.profit.toFixed(2)}
                      </div>
                      <div className="text-xs text-green-400">
                        +${item.totalProfit.toFixed(2)} today
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.margin.toFixed(1)}% margin
                      </div>
                    </div>
                  )}

                  {activeTab === "quickwins" && (
                    <div className="flex items-center gap-2">
                      <item.icon className="w-5 h-5 text-yellow-500" />
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{item.timeframe}</div>
                        <div className="text-xs font-medium text-green-600">{item.impact} impact</div>
                      </div>
                    </div>
                  )}
                </div>

                {(activeTab === "losing" || activeTab === "winners") && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Main ingredients:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.ingredients.slice(0, 3).map((ing, i) => (
                        <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {ing.split(' (')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {item.suggestion || item.tip}
                    </p>
                  </div>
                </div>

                {(activeTab === "losing" || activeTab === "winners") && (
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Sell: ${item.sellPrice.toFixed(2)}</span>
                      <span>Cost: ${item.cost.toFixed(2)}</span>
                      <span className={item.popularity === "Very High" ? "text-green-600" : 
                                     item.popularity === "High" ? "text-blue-600" : 
                                     item.popularity === "Medium" ? "text-yellow-600" : "text-red-600"}>
                        {item.popularity}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Live Product Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-[#6B4226] flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              AI-Powered Product Suggestions
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Live suggestions
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveInsights.map((suggestion, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-[#6B4226] text-lg mb-1">{suggestion.title}</h4>
                    <p className="text-sm text-gray-500">{suggestion.subtitle}</p>
                  </div>
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>

                <div className="mb-4">
                  <div className="text-green-600 font-bold text-lg mb-1">{suggestion.gain}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${suggestion.confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{suggestion.confidence}%</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{suggestion.description}</p>

                <button className="w-full bg-[#6B4226] text-white py-2 px-4 rounded-xl hover:bg-[#5A3620] transition-colors flex items-center justify-center gap-2 group">
                  Test Recipe
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Waste Tracking Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-xl font-bold text-[#6B4226] mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Monthly Waste Reconciliation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(wasteTracking).map(([item, data]) => (
              <div key={item} className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-2 capitalize">
                  {item.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bought:</span>
                    <span>{data.bought}L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Used:</span>
                    <span>{data.used}L</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Waste:</span>
                    <span>{data.waste}% (${data.cost.toFixed(2)})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">Intelligence Insight</h4>
                <p className="text-blue-700 text-sm">
                  You bought 40L oat milk but only sold 30L worth of drinks. 
                  This suggests 25% waste - higher than the industry average of 15%.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
    </main>
    </div>
     </div>
  )
}