import React, { useEffect, useState } from 'react';
import { 
  Package,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  Search,
  Filter,
  Loader2,
  Save,
  Upload,
  DollarSign,
  Package2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  getAllProducts,
  createProduct,
  updateProductStock,
  toggleProductActive,
  deleteProduct
} from '../../api/api';

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Helper function to resolve image URLs
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/300x200?text=No+Image';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const BASE_URL = import.meta.env.VITE_API_URL || "https://ai-pet-wellness-management-system.onrender.com";
    return `${BASE_URL}${imageUrl}`;
  };
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  
  // Selected product
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  
  // Stock update
  const [stockValue, setStockValue] = useState('');
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'

  // Load products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getAllProducts();
      setProducts(response.data || []);
    } catch (error) {
      toast.error('Failed to load products');
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.name || !formData.description || !formData.price || !formData.stock) {
    toast.error('Please fill all required fields');
    return;
  }

  if (!formData.image) {
    toast.error('Please select an image');
    return;
  }

  try {
    await createProduct(formData); // ✅ PASS OBJECT
    toast.success('Product created successfully!');
    resetForm();
    setShowAddModal(false);
    fetchProducts();
  } catch (error) {
    toast.error(error.response?.data || 'Failed to create product');
  }
};


  const handleStockUpdate = async () => {
    if (!stockValue || isNaN(stockValue)) {
      toast.error('Please enter a valid stock number');
      return;
    }

    try {
      await updateProductStock(selectedProduct.id, parseInt(stockValue));
      toast.success('Stock updated successfully!');
      setShowStockModal(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to update stock');
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await toggleProductActive(product.id);
      toast.success(`Product ${product.active ? 'disabled' : 'enabled'} successfully!`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product status');
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      await deleteProduct(product.id);
      toast.success('Product deleted successfully!');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      image: null
    });
    setImagePreview(null);
  };

  // Filter products based on search and status
  const filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus = product.active === true;
    } else if (filterStatus === 'inactive') {
      matchesStatus = product.active === false;
    }
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto">
            <Loader2 className="w-6 h-6 mx-auto mt-3 text-purple-600" />
          </div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-purple-600" />
            Product Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your product inventory and stock
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
        >
          <Plus size={16} />
          Add New Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
              <option value="all">All Products</option>
              <option value="active">Active Only</option>
              <option value="inactive">Disabled Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="space-y-6">
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Package size={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Products Found
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'No products match your filters' 
                : 'Get started by adding your first product'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Product Image */}
                <div className="mb-4">
                  <div className="relative h-48 w-full rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(product.imageUrl)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.active 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-3 mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <DollarSign className="text-purple-600" size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="font-bold text-gray-800">₹{product.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package2 className="text-blue-600" size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Stock</p>
                        <p className={`font-bold ${
                          product.stock > 10 ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {product.stock}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setStockValue(product.stock.toString());
                      setShowStockModal(true);
                    }}
                    className="flex-1 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                  >
                    Update Stock
                  </button>
                  
                  <button
                    onClick={() => handleToggleActive(product)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title={product.active ? 'Disable Product' : 'Enable Product'}
                  >
                    {product.active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  
                  <button
                    onClick={() => handleDelete(product)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Add New Product
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter product name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Enter product description"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        rows={4}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (₹) *
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stock *
                        </label>
                        <input
                          type="number"
                          name="stock"
                          value={formData.stock}
                          onChange={handleInputChange}
                          placeholder="Quantity"
                          min="0"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Image Upload */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Image *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="image-upload"
                          required
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center">
                            <Upload className="w-12 h-12 text-gray-400 mb-3" />
                            <p className="text-sm font-medium text-gray-700">
                              Click to upload image
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG, JPG, JPEG up to 5MB
                            </p>
                          </div>
                        </label>
                      </div>
                      
                      {formData.image && (
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-500" />
                          Selected: {formData.image.name}
                        </p>
                      )}
                    </div>

                    {imagePreview && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preview
                        </label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    Create Product
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Update Stock
                </h2>
                <button
                  onClick={() => setShowStockModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {selectedProduct.name}
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <p className="text-lg font-bold text-gray-800">
                        {selectedProduct.stock}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className={`text-sm font-medium ${
                        selectedProduct.stock > 10 
                          ? 'text-emerald-600' 
                          : 'text-amber-600'
                      }`}>
                        {selectedProduct.stock > 10 ? 'In Stock' : 'Low Stock'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={stockValue}
                    onChange={(e) => setStockValue(e.target.value)}
                    min="0"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStockModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStockUpdate}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;