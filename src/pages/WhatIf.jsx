import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, TrendingDown, AlertTriangle, Check, X, RefreshCw } from 'lucide-react';

const WhatIfAnalyzer = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState('amount'); // 'amount' or 'percentage'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
  };

  // Create headers with authorization
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:3006/products', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please login again.');
        }
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error('Products data is not an array:', data);
        setProducts([]);
        setError('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message);
      setProducts([]); // Set empty array on error
    } finally {
      setInitialLoad(false);
    }
  };

  const handleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const calculateAdjustment = (currentPrice) => {
    if (adjustmentType === 'percentage') {
      return (currentPrice * priceAdjustment) / 100;
    }
    return priceAdjustment;
  };

  const runWhatIfAnalysis = async () => {
    if (selectedProducts.length === 0 || priceAdjustment === 0) {
      setError('Please select products and enter a price adjustment');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3006/products/what-if', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productIds: selectedProducts,
          priceAdjustment: priceAdjustment
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please login again.');
        }
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        console.error('What-if results data is not an array:', data);
        setResults([]);
        setError('Invalid analysis results received from server');
      }
    } catch (error) {
      console.error('Error running what-if analysis:', error);
      setError(error.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const applyQuickAction = async (productId, newPrice) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:3006/products/${productId}/quick-action`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          new_sell_price: newPrice
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please login again.');
        }
        throw new Error(`Failed to apply price change: ${response.status}`);
      }

      // Refresh products after successful update
      await fetchProducts();
      // Clear results to show updated data
      setResults([]);
      setSelectedProducts([]);
      setPriceAdjustment(0);
      
      // Show success message
      alert('Price updated successfully!');
    } catch (error) {
      console.error('Error applying quick action:', error);
      setError(error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'profitable': return 'text-green-600 bg-green-50';
      case 'breaking even': return 'text-yellow-600 bg-yellow-50';
      case 'losing money': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getMarginIcon = (margin) => {
    if (margin > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (margin < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  };

  if (initialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">What-If Price Analysis</h1>
          </div>
          <p className="text-gray-600">Test price changes before implementing them to see the impact on your margins</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
            {error.includes('Unauthorized') && (
              <p className="text-red-600 text-sm mt-2">
                Please check your login status and try again.
              </p>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Setup */}
          <div className="space-y-6">
            {/* Price Adjustment Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Price Adjustment</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjustment Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAdjustmentType('amount')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        adjustmentType === 'amount'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Amount (£)
                    </button>
                    <button
                      onClick={() => setAdjustmentType('percentage')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        adjustmentType === 'percentage'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Percentage (%)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {adjustmentType === 'amount' ? 'Price Change (£)' : 'Percentage Change (%)'}
                  </label>
                  <input
                    type="number"
                    value={priceAdjustment}
                    onChange={(e) => setPriceAdjustment(parseFloat(e.target.value) || 0)}
                    step={adjustmentType === 'amount' ? '0.10' : '1'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={adjustmentType === 'amount' ? '0.50' : '10'}
                  />
                </div>

                <button
                  onClick={runWhatIfAnalysis}
                  disabled={selectedProducts.length === 0 || priceAdjustment === 0 || loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Calculator className="w-4 h-4" />
                  )}
                  {loading ? 'Calculating...' : 'Run Analysis'}
                </button>
              </div>
            </div>

            {/* Product Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Select Products</h2>
                {products.length > 0 && (
                  <button
                    onClick={selectAllProducts}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No products available</p>
                  <button
                    onClick={fetchProducts}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedProducts.includes(product.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleProductSelection(product.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{product.name || 'Unnamed Product'}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                              {product.status || 'unknown'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>£{(product.sell_price || 0).toFixed(2)}</span>
                            <span className="flex items-center gap-1">
                              {getMarginIcon(product.margin_percent || 0)}
                              {(product.margin_percent || 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedProducts.includes(product.id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedProducts.includes(product.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Analysis Results</h2>

            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select products and run analysis to see results</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result) => {
                  const product = products.find(p => p.id === result.productId);
                  if (!product) return null;

                  const currentPrice = product.sell_price || 0;
                  const adjustment = calculateAdjustment(currentPrice);
                  const newPrice = currentPrice + adjustment;
                  const marginChange = (result.newMargin || 0) - (product.margin_percent || 0);

                  return (
                    <div key={result.productId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{product.name || 'Unnamed Product'}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.newStatus)}`}>
                          {result.newStatus || 'unknown'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Current Price</p>
                          <p className="font-medium">£{currentPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">New Price</p>
                          <p className="font-medium">£{newPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Current Margin</p>
                          <p className="font-medium">{(product.margin_percent || 0).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">New Margin</p>
                          <p className={`font-medium ${(result.newMargin || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(result.newMargin || 0).toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {marginChange > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${marginChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {marginChange > 0 ? '+' : ''}{marginChange.toFixed(1)}% margin change
                            </span>
                          </div>
                          
                          <button
                            onClick={() => applyQuickAction(result.productId, newPrice)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-6 pt-4 border-t">
                  <button
                    onClick={() => {
                      setResults([]);
                      setSelectedProducts([]);
                      setPriceAdjustment(0);
                      setError(null);
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear Results
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatIfAnalyzer;