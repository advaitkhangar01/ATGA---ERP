import React, { useState, useMemo } from 'react';
import { useStore, Product } from '../store/useStore';
import { Card, CardContent } from '../components/ui/card';
import { Dialog } from '../components/ui/dialog';
import { BarcodeGenerator } from '../components/ui/barcode-generator';
import { 
  Plus, 
  Search, 
  Tag, 
  Archive, 
  Power, 
  Copy, 
  Edit3, 
  Download, 
  Upload, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle,
  Eye
} from 'lucide-react';

function generateRandomBarcode(): string {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

export default function Products() {
  const { products, addProduct, editProduct, archiveProduct, deactivateProduct, duplicateProduct, setView } = useStore();
  
  // Grid / Catalog Search State
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedGlass, setSelectedGlass] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProd, setSelectedProd] = useState<Product | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  
  // Form values
  const [formBrand, setFormBrand] = useState('Saint Gobain');
  const [formCarBrand, setFormCarBrand] = useState('Maruti');
  const [formCarModel, setFormCarModel] = useState('Swift');
  const [formGlassType, setFormGlassType] = useState('Windshield');
  const [formSKU, setFormSKU] = useState('');
  const [formCompatibles, setFormCompatibles] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formThreshold, setFormThreshold] = useState(10);
  const [formBarcode, setFormBarcode] = useState('');

  // Dropdown list sets
  const brands = ['Saint Gobain', 'Clarion', 'XYG'];
  const carBrands = ['Maruti', 'Honda', 'Hyundai', 'Toyota', 'Tata', 'Mahindra'];
  const glassTypes = ['Windshield', 'Rear Glass', 'Door Glass', 'Quarter Glass'];

  // Handle SKU Generation helpers
  const handleAutoGenerateSKU = () => {
    const brandAbbr = formBrand.toUpperCase().slice(0,3);
    const carBrandAbbr = formCarBrand.toUpperCase().slice(0,3);
    const modelAbbr = formCarModel.toUpperCase().replace(/\s+/g, '').slice(0,4);
    const typeAbbr = formGlassType.toUpperCase().slice(0,2);
    const generated = `${brandAbbr}-${carBrandAbbr}-${modelAbbr}-${typeAbbr}-STD`;
    setFormSKU(generated);

    // Also auto barcode
    const randomBar = generateRandomBarcode();
    setFormBarcode(randomBar);
  };

  // Open Edit Dialog
  const handleOpenEdit = (prod: Product) => {
    setSelectedProd(prod);
    setFormBrand(prod.brand);
    setFormCarBrand(prod.carBrand);
    setFormCarModel(prod.carModel);
    setFormGlassType(prod.glassType);
    setFormSKU(prod.sku);
    setFormCompatibles(prod.compatibleModels.join(', '));
    setFormDesc(prod.description);
    setFormThreshold(prod.lowStockThreshold);
    setFormBarcode(prod.barcode);
    setIsEditOpen(true);
  };

  // Submit Add form
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSKU) return;
    
    addProduct({
      sku: formSKU,
      brand: formBrand,
      carBrand: formCarBrand,
      carModel: formCarModel,
      glassType: formGlassType,
      description: formDesc || `${formBrand} ${formGlassType} for ${formCarBrand} ${formCarModel}`,
      compatibleModels: formCompatibles.split(',').map(s => s.trim()).filter(Boolean),
      status: 'active',
      lowStockThreshold: formThreshold,
      barcode: formBarcode || generateRandomBarcode(),
    });

    setIsAddOpen(false);
    resetForm();
  };

  // Submit Edit form
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProd) return;

    editProduct(selectedProd.id, {
      sku: formSKU,
      brand: formBrand,
      carBrand: formCarBrand,
      carModel: formCarModel,
      glassType: formGlassType,
      description: formDesc,
      compatibleModels: formCompatibles.split(',').map(s => s.trim()).filter(Boolean),
      lowStockThreshold: formThreshold,
      barcode: formBarcode,
    });

    setIsEditOpen(false);
    setSelectedProd(null);
    resetForm();
  };

  const resetForm = () => {
    setFormBrand('Saint Gobain');
    setFormCarBrand('Maruti');
    setFormCarModel('Swift');
    setFormGlassType('Windshield');
    setFormSKU('');
    setFormCompatibles('');
    setFormDesc('');
    setFormThreshold(10);
    setFormBarcode('');
  };

  // Filter Catalog
  const processedProducts = useMemo(() => {
    let list = [...products];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => 
        p.sku.toLowerCase().includes(q) || 
        p.carModel.toLowerCase().includes(q) || 
        p.carBrand.toLowerCase().includes(q) ||
        p.barcode.includes(q)
      );
    }

    // Dropdown filters
    if (selectedBrand !== 'All') {
      list = list.filter(p => p.brand === selectedBrand);
    }
    if (selectedGlass !== 'All') {
      list = list.filter(p => p.glassType === selectedGlass);
    }
    if (selectedStatus !== 'All') {
      list = list.filter(p => p.status === selectedStatus);
    }

    return list;
  }, [products, search, selectedBrand, selectedGlass, selectedStatus]);

  // Paginated Catalog
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedProducts.slice(start, start + itemsPerPage);
  }, [processedProducts, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedBrand, selectedGlass, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-zinc-800 dark:text-zinc-100">Product SKU Catalog</h2>
          <p className="text-zinc-500 text-xs dark:text-zinc-400">Configure catalog specifications, auto-generate parts codes, and manage safety thresholds.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setView('sku-engine')}
            className="border border-indigo-500/25 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-3 py-2 rounded-lg active:scale-95 transition-all"
          >
            SKU Engine Rule Generator
          </button>
          <button 
            onClick={() => setIsBulkOpen(true)}
            className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-bold px-3 py-2 rounded-lg hover:bg-zinc-50 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Upload className="h-4 w-4" />
            Bulk Import CSV
          </button>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
          >
            <Plus className="h-4 w-4" />
            Add SKU Catalog
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search catalog by SKU, car model, barcode digits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 text-xs">
              <span className="text-zinc-400 font-medium">Mfg:</span>
              <select 
                value={selectedBrand} 
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-transparent py-1.5 focus:outline-none font-bold text-zinc-700 dark:text-zinc-300"
              >
                <option value="All">All Brands</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 text-xs">
              <span className="text-zinc-400 font-medium">Glass:</span>
              <select 
                value={selectedGlass} 
                onChange={(e) => setSelectedGlass(e.target.value)}
                className="bg-transparent py-1.5 focus:outline-none font-bold text-zinc-700 dark:text-zinc-300"
              >
                <option value="All">All Types</option>
                {glassTypes.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 text-xs">
              <span className="text-zinc-400 font-medium">Status:</span>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent py-1.5 focus:outline-none font-bold text-zinc-700 dark:text-zinc-300"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Catalog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {paginatedProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 text-sm font-semibold bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            No matching products catalog entries.
          </div>
        ) : (
          paginatedProducts.map((prod) => (
            <Card key={prod.id} className="relative overflow-hidden group hover:shadow-md transition-shadow h-full flex flex-col">
              <CardContent className="p-4 flex flex-col justify-between flex-1 space-y-4">
                {/* SKU Code & Label */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400">
                      {prod.brand}
                    </span>
                    <span className={`h-2 w-2 rounded-full ${
                      prod.status === 'active' ? 'bg-emerald-500' : prod.status === 'deactivated' ? 'bg-amber-500' : 'bg-zinc-400'
                    }`} title={`Status: ${prod.status}`} />
                  </div>
                  
                  <h3 className="font-black text-sm text-zinc-900 dark:text-white mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate" title={prod.sku}>
                    {prod.sku}
                  </h3>
                  <div className="h-8 mt-1 overflow-hidden">
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold line-clamp-2 leading-relaxed" title={prod.description}>
                      {prod.description}
                    </p>
                  </div>
                </div>

                {/* Info Metadata */}
                <div className="text-[10px] space-y-1 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-150 dark:border-zinc-850">
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-zinc-400 shrink-0">Model:</span>
                    <span className="font-bold truncate max-w-[130px]" title={`${prod.carBrand} ${prod.carModel}`}>{prod.carBrand} {prod.carModel}</span>
                  </div>
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-zinc-400 shrink-0">Type:</span>
                    <span className="font-bold truncate max-w-[130px]">{prod.glassType}</span>
                  </div>
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-zinc-400 shrink-0">Alert Min:</span>
                    <span className="font-bold text-amber-500 shrink-0">{prod.lowStockThreshold} units</span>
                  </div>
                </div>

                {/* Operations Actions Overlay */}
                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3 text-[10px] font-bold">
                  <button 
                    onClick={() => handleOpenEdit(prod)}
                    className="flex items-center gap-1 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button 
                    onClick={() => duplicateProduct(prod.id)}
                    className="flex items-center gap-1 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Clone
                  </button>
                  {prod.status === 'active' ? (
                    <button 
                      onClick={() => deactivateProduct(prod.id)}
                      className="flex items-center gap-1 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-500"
                    >
                      <Power className="h-3.5 w-3.5" />
                      Deact
                    </button>
                  ) : (
                    <button 
                      onClick={() => archiveProduct(prod.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination control */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs">
        <span className="text-zinc-500 font-semibold">Showing page {currentPage} of {totalPages} ({processedProducts.length} items cataloged)</span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-850 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-850 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ADD DIALOG MODAL */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Catalog Product">
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-zinc-400 font-bold mb-1">Manufacturer Brand</label>
              <select 
                value={formBrand} 
                onChange={(e) => setFormBrand(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2.5 rounded-lg focus:outline-none font-bold"
              >
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 font-bold mb-1">Glass Category</label>
              <select 
                value={formGlassType} 
                onChange={(e) => setFormGlassType(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2.5 rounded-lg focus:outline-none font-bold"
              >
                {glassTypes.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-zinc-400 font-bold mb-1">Car Brand Make</label>
              <select 
                value={formCarBrand} 
                onChange={(e) => setFormCarBrand(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2.5 rounded-lg focus:outline-none font-bold"
              >
                {carBrands.map(cb => <option key={cb} value={cb}>{cb}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 font-bold mb-1">Car Model fitment</label>
              <input 
                type="text" 
                value={formCarModel} 
                onChange={(e) => setFormCarModel(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2 rounded-lg focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
            <div className="text-zinc-500">
              <p className="font-bold">Auto Rule Builder</p>
              <p className="text-[9px]">Apply default naming templates to build SKU code format.</p>
            </div>
            <button 
              type="button" 
              onClick={handleAutoGenerateSKU}
              className="bg-indigo-150 hover:bg-indigo-200 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-bold transition-colors"
            >
              Generate Code
            </button>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 font-bold mb-1">SKU Code Format</label>
            <input 
              type="text" 
              required
              placeholder="e.g., SG-MARUTI-SWIFT-WS"
              value={formSKU} 
              onChange={(e) => setFormSKU(e.target.value.toUpperCase())}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2 rounded-lg font-mono font-bold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-zinc-400 font-bold mb-1">Barcode Value (12 Digit)</label>
              <input 
                type="text" 
                value={formBarcode} 
                onChange={(e) => setFormBarcode(e.target.value)}
                placeholder="Auto-assigned if left blank"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2 rounded-lg font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 font-bold mb-1">Low Stock Threshold alert</label>
              <input 
                type="number" 
                min={1}
                value={formThreshold} 
                onChange={(e) => setFormThreshold(parseInt(e.target.value) || 1)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2 rounded-lg font-bold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 font-bold mb-1">Compatible Facelifts / Remarks</label>
            <input 
              type="text" 
              placeholder="e.g., Swift 2018, Swift 2022, Dzire Facelift"
              value={formCompatibles} 
              onChange={(e) => setFormCompatibles(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 font-bold mb-1">Product Description</label>
            <textarea 
              rows={2}
              value={formDesc} 
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Detailed attributes: green tint, solar PVB acoustic, ADAS camera bracket..."
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2 rounded-lg focus:outline-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-md shadow-indigo-600/10"
          >
            Create Product Entry
          </button>
        </form>
      </Dialog>

      {/* EDIT DIALOG MODAL */}
      <Dialog isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setSelectedProd(null); }} title="Modify Catalog SKU Specs">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] text-zinc-400 font-bold mb-1">SKU Identifier</label>
            <input 
              type="text" 
              required
              readOnly
              value={formSKU} 
              className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2 rounded-lg font-mono font-bold text-zinc-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-zinc-400 font-bold mb-1">Brand Manufacturer</label>
              <select 
                value={formBrand} 
                onChange={(e) => setFormBrand(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2.5 rounded-lg focus:outline-none font-bold"
              >
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 font-bold mb-1">Glass Segment</label>
              <select 
                value={formGlassType} 
                onChange={(e) => setFormGlassType(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2.5 rounded-lg focus:outline-none font-bold"
              >
                {glassTypes.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-zinc-400 font-bold mb-1">Car fitment Make</label>
              <input 
                type="text" 
                value={`${formCarBrand} ${formCarModel}`}
                readOnly
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2 rounded-lg text-zinc-500 font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 font-bold mb-1">Alert Threshold Limit</label>
              <input 
                type="number" 
                min={1}
                value={formThreshold} 
                onChange={(e) => setFormThreshold(parseInt(e.target.value) || 1)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2 rounded-lg font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] text-zinc-400 font-bold mb-1">Barcode Label ID</label>
              <input 
                type="text" 
                value={formBarcode} 
                onChange={(e) => setFormBarcode(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2 rounded-lg font-mono focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 font-bold mb-1">Compatible Facelifts / Interchange Codes</label>
            <input 
              type="text" 
              value={formCompatibles} 
              onChange={(e) => setFormCompatibles(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 font-bold mb-1">Product Description</label>
            <textarea 
              rows={2.5}
              value={formDesc} 
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 p-2 rounded-lg focus:outline-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-md shadow-indigo-600/10"
          >
            Save Changes
          </button>
        </form>
      </Dialog>

      {/* BULK CSV IMPORT MOCK MODAL */}
      <Dialog isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} title="Bulk Import Catalog (CSV)">
        <div className="space-y-4 text-xs text-center">
          <p className="text-zinc-500">Upload a CSV containing products list mapping columns: Brand, CarBrand, CarModel, GlassType, SKU, lowStockThreshold, Barcode.</p>
          
          <div className="h-32 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all bg-zinc-50/50 dark:bg-zinc-900/50 group">
            <Upload className="h-8 w-8 text-zinc-400 group-hover:text-indigo-500 mb-2" />
            <span className="font-bold">Drag & Drop Catalog CSV file here</span>
            <span className="text-[10px] text-zinc-400 mt-1">Maximum file size 4MB</span>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setIsBulkOpen(false)}
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 py-2 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                setIsBulkOpen(false);
                // Trigger fake import notification
                useStore.getState().addNotification('success', 'Bulk Import Success', 'Processed 42 new catalog SKU records.');
                useStore.getState().logActivity('Imported 42 catalog SKU records via CSV bulk loader', 'Products');
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-bold shadow-md shadow-indigo-600/10"
            >
              Simulate File Import
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
