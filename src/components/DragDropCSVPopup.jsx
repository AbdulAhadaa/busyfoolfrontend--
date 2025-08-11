import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet, ArrowDown, Save, RefreshCw, Tag, Database, CheckCircle, X } from 'lucide-react';

const DragDropCSVPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [mappings, setMappings] = useState({});
  const [draggedHeader, setDraggedHeader] = useState(null);
  const fileInputRef = useRef(null);

  // System fields that need to be mapped
  const systemFields = [
    { key: 'product_name', label: 'Product Name', required: true, description: 'Name of the product' },
    { key: 'quantity', label: 'Quantity', required: true, description: 'Stock quantity or sale quantity' },
    { key: 'price', label: 'Price', required: false, description: 'Product price' },
    { key: 'category', label: 'Category', required: false, description: 'Product category' },
    { key: 'sku', label: 'SKU', required: false, description: 'Stock keeping unit' },
    { key: 'supplier', label: 'Supplier', required: false, description: 'Product supplier' },
    { key: 'description', label: 'Description', required: false, description: 'Product description' }
  ];

  // Sample CSV headers for demonstration
  const sampleHeaders = [
    'Product Title', 'Item Name', 'Stock Count', 'Units Available', 'Retail Price', 
    'Cost', 'Product Category', 'Type', 'Item Code', 'Vendor', 'Supplier Name', 'Notes'
  ];

  const loadSampleHeaders = () => {
    setCsvHeaders(sampleHeaders);
    setMappings({});
  };

  const handleCSVImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target.result;
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) return;

      // Parse only the headers (first line)
      const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
      setCsvHeaders(headers);
      setMappings({});
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleDragStart = (e, header) => {
    setDraggedHeader(header);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e, systemFieldKey) => {
    e.preventDefault();
    
    if (!draggedHeader) return;

    setMappings(prev => ({
      ...prev,
      [systemFieldKey]: draggedHeader
    }));

    setDraggedHeader(null);
  };

  const removeMappingForField = (systemFieldKey) => {
    setMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[systemFieldKey];
      return newMappings;
    });
  };

  const clearAllMappings = () => {
    setMappings({});
  };

  const saveMappings = () => {
    const mappingConfig = {
      timestamp: new Date().toISOString(),
      csvHeaders: csvHeaders,
      mappings: mappings,
      requiredFieldsMapped: systemFields.filter(field => field.required).every(field => mappings[field.key])
    };

    console.log('Column Mapping Configuration:', mappingConfig);
    
    // Here you would typically save to your backend
    alert(`Mapping saved!\n\nMapped ${Object.keys(mappings).length} fields:\n${Object.entries(mappings).map(([system, csv]) => `${system} → ${csv}`).join('\n')}`);
  };

  const isRequiredFieldMapped = () => {
    return systemFields.filter(field => field.required).every(field => mappings[field.key]);
  };

  const renderCsvHeaders = () => {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              CSV Headers
            </span>
            <span className="text-sm font-normal text-gray-500">
              ({csvHeaders.length} columns)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {csvHeaders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileSpreadsheet className="w-12 h-12 mb-3 opacity-50 mx-auto" />
              <p className="text-lg font-medium">No CSV headers loaded</p>
              <p className="text-sm">Import a CSV file or load sample data to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {csvHeaders.map((header, index) => (
                <div
                  key={`csv-${header}-${index}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, header)}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg cursor-move hover:bg-green-100 transition-all hover:shadow-md group"
                  title={`Drag "${header}" to map it to a system field`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-green-800 truncate">{header}</div>
                      <div className="text-xs text-green-600">Column {index + 1}</div>
                    </div>
                  </div>
                  <div className="text-xs text-green-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Drag to map →
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSystemFields = () => {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              System Fields
            </span>
            <span className="text-sm font-normal text-gray-500">
              Map CSV columns here
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemFields.map((field) => {
              const mappedHeader = mappings[field.key];
              const isMapped = Boolean(mappedHeader);
              
              return (
                <div
                  key={field.key}
                  className={`p-4 border-2 border-dashed rounded-lg transition-all ${
                    isMapped 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, field.key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {field.label}
                        </span>
                        {field.required && (
                          <span className="text-red-500 text-sm">*</span>
                        )}
                        {isMapped && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{field.description}</p>
                      
                      {isMapped ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md border">
                            <Tag className="w-3 h-3 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              {mappedHeader}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeMappingForField(field.key)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          Drop a CSV header here to map it
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">CSV Column Mapper</h1>
          <p className="text-gray-600 mb-6">Import CSV headers and map them to your system fields</p>
          <Button
            onClick={() => setShowPopup(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            Open Column Mapper
          </Button>
        </div>

        <Dialog open={showPopup} onOpenChange={setShowPopup}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                CSV Column Mapper
              </DialogTitle>
            </DialogHeader>

            {/* Control Panel */}
            <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </Button>
              
              <Button
                onClick={loadSampleHeaders}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Load Sample Headers
              </Button>

              <Button
                onClick={clearAllMappings}
                variant="outline"
                disabled={Object.keys(mappings).length === 0}
                className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <RefreshCw className="w-4 h-4" />
                Clear Mappings
              </Button>

              <div className="ml-auto text-sm text-gray-600 flex items-center">
                💡 Drag CSV headers to system fields below
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />

            {/* CSV Headers Section */}
            {renderCsvHeaders()}

            {/* Arrow Indicator */}
            <div className="flex items-center justify-center my-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <ArrowDown className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            {/* System Fields Section */}
            {renderSystemFields()}

            <DialogFooter className="pt-6">
              <div className="flex justify-between w-full">
                <div className="text-sm text-gray-600">
                  Mapped: {Object.keys(mappings).length} of {systemFields.length} fields
                  {!isRequiredFieldMapped() && (
                    <span className="text-red-600 ml-2">
                      (Required fields missing)
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowPopup(false)}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveMappings}
                    disabled={Object.keys(mappings).length === 0}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Mapping ({Object.keys(mappings).length})
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DragDropCSVPopup;