import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Package, DollarSign, BarChart3, ShoppingCart, AlertTriangle, CheckCircle, Coffee, Zap, Target } from 'lucide-react';
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
const Dashboard = () => {
     const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("accessToken");
      const response = await fetch('https://busy-fool-backend.vercel.app/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

 
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'profitable': return 'text-green-600 bg-green-50 border-green-200';
      case 'breaking even': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'losing money': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getMarginColor = (margin) => {
    if (margin >= 70) return 'text-green-600';
    if (margin >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading your coffee shop insights...</p>
        </div>
      </div>
      </main>
        </div>
          </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">Failed to connect to the API: {error}</p>
          <button
            onClick={fetchData}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 space-y-6">
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
   

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Reality Check Section */}
        <div className="mb-8 animate-fade-in-up">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <Target className="h-6 w-6 mr-2" />
                 Reality Check Dashboard
              </h2>
              <div className="text-sm opacity-80">Live Data</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatCurrency(data?.overview?.totalSales || 0)}</div>
                <div className="text-sm opacity-80">Sales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatCurrency(data?.overview?.totalPurchasesCost || 0)}</div>
                <div className="text-sm opacity-80">Costs</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${data?.overview?.totalProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {formatCurrency(data?.overview?.totalProfit || 0)}
                </div>
                <div className="text-sm opacity-80">Profit</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getMarginColor(data?.overview?.avgMarginPercent || 0)}`}>
                  {(data?.overview?.avgMarginPercent || 0).toFixed(1)}%
                </div>
                <div className="text-sm opacity-80">Margin</div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{data?.analytics?.salesCount || 0}</span>
            </div>
            <h3 className="font-semibold text-gray-700">Total Sales</h3>
            <p className="text-sm text-gray-500 mt-1">Items sold today</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{data?.analytics?.totalStock?.toFixed(1) || 0}</span>
            </div>
            <h3 className="font-semibold text-gray-700">Total Stock</h3>
            <p className="text-sm text-gray-500 mt-1">Units remaining</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-lg">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{data?.products?.length || 0}</span>
            </div>
            <h3 className="font-semibold text-gray-700">Products</h3>
            <p className="text-sm text-gray-500 mt-1">In your menu</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{data?.analytics?.lowStockCount || 0}</span>
            </div>
            <h3 className="font-semibold text-gray-700">Low Stock</h3>
            <p className="text-sm text-gray-500 mt-1">Items need restocking</p>
          </div>
        </div>

        {/* Products & Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Products Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Coffee className="h-5 w-5 mr-2 text-amber-600" />
                Your Products
              </h2>
              <span className="text-sm text-gray-500">{data?.products?.length || 0} items</span>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {data?.products?.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200" style={{animationDelay: `${0.6 + index * 0.1}s`}}>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 capitalize">{product.name}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600">Sell: {formatCurrency(product.sellPrice)}</span>
                      <span className="text-sm text-gray-600">Cost: {formatCurrency(product.totalCost)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getMarginColor(product.margin)}`}>
                      {product.margin.toFixed(1)}%
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!data?.products || data.products.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Coffee className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No products found. Add your first product to get started!</p>
                </div>
              )}
            </div>
          </div>

          {/* Ingredients Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2 text-green-600" />
                Ingredients
              </h2>
              <span className="text-sm text-gray-500">{data?.ingredients?.length || 0} items</span>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {data?.ingredients?.map((ingredient, index) => (
                <div key={ingredient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200" style={{animationDelay: `${0.7 + index * 0.1}s`}}>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 capitalize">{ingredient.name}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      {ingredient.quantity} {ingredient.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(ingredient.purchasePrice)}
                    </div>
                    <div className="text-xs text-gray-500">Purchase price</div>
                  </div>
                </div>
              ))}
              {(!data?.ingredients || data.ingredients.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No ingredients found. Add ingredients to track costs!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stock Brief & Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stock Brief */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-fade-in-up" style={{animationDelay: '0.7s'}}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Stock Status
              </h2>
            </div>
            <div className="space-y-4">
              {data?.stockBrief?.map((stock, index) => {
                const ingredient = data.ingredients.find(ing => ing.id === stock.ingredientId);
                const usagePercent = ((stock.purchasedQuantity - stock.remainingQuantity) / stock.purchasedQuantity) * 100;
                return (
                  <div key={stock.id} className="p-4 bg-gray-50 rounded-lg" style={{animationDelay: `${0.8 + index * 0.1}s`}}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-900 capitalize">{ingredient?.name}</h3>
                      <span className="text-sm text-gray-600">{stock.remainingQuantity.toFixed(2)} {stock.unit} left</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-1000" 
                        style={{width: `${100 - usagePercent}%`}}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Used: {(stock.purchasedQuantity - stock.remainingQuantity).toFixed(2)} {stock.unit}</span>
                      <span>{(100 - usagePercent).toFixed(1)}% remaining</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Smart Suggestions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                Smart Suggestions
              </h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-green-800">Stock Management</h3>
                    <p className="text-sm text-green-700 mt-1">{data?.suggestions?.stockManagement}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <DollarSign className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-blue-800">Price Optimization</h3>
                    <p className="text-sm text-blue-700 mt-1">{data?.suggestions?.priceOptimization}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                <div className="flex items-start">
                  <TrendingUp className="h-5 w-5 text-amber-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-amber-800">Sales Boost</h3>
                    <p className="text-sm text-amber-700 mt-1">{data?.suggestions?.salesBoost}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .animate-fade-in-left {
          animation: fade-in-left 0.8s ease-out forwards;
        }
      `}</style>
    </div>
    </main>
     </div>
      </div>
  );
};

export default Dashboard;
