import React, { useEffect, useState } from 'react';
import { 
  Package,
  ShoppingCart,
  Search,
  Filter,
  Loader2,
  Plus,
  Minus,
  Star,
  ShoppingBag,
  DollarSign,
  Package2,
  Check,
  X,
  Heart,
  TrendingUp,
  Eye
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  getActiveProducts,
  addToCart,
  getCart
} from '../../api/api';

const Shop = () => {
  const userId = localStorage.getItem("userId");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState({});
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [category, setCategory] = useState('all');
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Load products and cart
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productsRes, cartRes] = await Promise.all([
          getActiveProducts(),
          userId ? getCart(userId) : Promise.resolve(null)
        ]);
        
        setProducts(productsRes.data || []);
        setCart(cartRes?.data || null);
      } catch (error) {
        toast.error('Failed to load products');
        console.error('Error loading shop:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [userId]);

  // Check if product is in cart
  const isInCart = (productId) => {
    if (!cart || !cart.items) return false;
    return cart.items.some(item => item.product?.id === productId);
  };

  // Get cart quantity for product
  const getCartQuantity = (productId) => {
    if (!cart || !cart.items) return 0;
    const item = cart.items.find(item => item.product?.id === productId);
    return item ? item.quantity : 0;
  };

  // Handle add to cart
  const handleAddToCart = async (product) => {
    if (!userId) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (product.stock < quantity) {
      toast.error(`Only ${product.stock} items available in stock`);
      return;
    }

    setAddingToCart(prev => ({ ...prev, [product.id]: true }));
    
    try {
      const response = await addToCart(userId, product.id, quantity);
      setCart(response.data);
      toast.success(`${product.name} added to cart!`);
      setQuantity(1);
    } catch (error) {
      toast.error(error.response?.data || 'Failed to add to cart');
    } finally {
      setAddingToCart(prev => ({ ...prev, [product.id]: false }));
    }
  };

  // Handle quick view
  const handleQuickView = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShowQuickView(true);
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Price filter
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      // Stock filter
      const matchesStock = !inStockOnly || product.stock > 0;
      
      // Category filter (you might want to add categories to your Product model)
      const matchesCategory = category === 'all' || 
        (category === 'in-stock' && product.stock > 0) ||
        (category === 'out-of-stock' && product.stock === 0);
      
      return matchesSearch && matchesPrice && matchesStock && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock-high':
          return b.stock - a.stock;
        default:
          return 0;
      }
    });

  // Calculate cart total items
  const cartTotalItems = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  // Calculate cart total price
  const cartTotalPrice = cart?.items?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;

  // Helper function to resolve image URLs
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/300x300?text=No+Image';
    // Check if it's already an absolute URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // Otherwise prepend the backend URL for relative paths
    return `http://https://ai-pet-wellness-management-system.onrender.com${imageUrl}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
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
            <ShoppingBag className="text-purple-600" />
            Pet Care Shop
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Find the best products for your furry friends
          </p>
        </div>
        
        {/* Cart Summary */}
        {userId && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Your Cart</p>
              <p className="font-semibold text-gray-800">
                {cartTotalItems} items • {formatPrice(cartTotalPrice)}
              </p>
            </div>
            <a 
              href="/dashboard/owner/cart"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
            >
              <ShoppingCart size={16} />
              View Cart
            </a>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
          </div>
          
          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
              <option value="default">Sort by</option>
              <option value="name">Name (A-Z)</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="stock-high">Stock: High to Low</option>
            </select>
          </div>
          
          {/* Category */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
              <option value="all">All Products</option>
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>
        
        {/* Price Range & Stock Filter */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
            </label>
            <input
              type="range"
              min="0"
              max="10000"
              step="100"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="sr-only"
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${inStockOnly ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${inStockOnly ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Show in-stock only
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="space-y-6">
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Package size={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Products Found
            </h3>
            <p className="text-gray-500">
              {searchTerm || category !== 'all' || inStockOnly 
                ? 'No products match your filters. Try adjusting your search.' 
                : 'No products available at the moment.'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                Showing <span className="font-semibold">{filteredProducts.length}</span> products
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => {
                const inCart = isInCart(product.id);
                const cartQty = getCartQuantity(product.id);
                
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 group"
                  >
                    {/* Product Image */}
                    <div className="relative h-56 w-full rounded-xl overflow-hidden mb-4">
                      <img
                        src={getImageUrl(product.imageUrl)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                        }}
                      />
                      
                      {/* Stock Badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          product.stock > 10 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : product.stock > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      
                      {/* Quick View Button */}
                      <button
                        onClick={() => handleQuickView(product)}
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <span className="px-4 py-2 bg-white text-gray-800 rounded-lg font-medium">
                          Quick View
                        </span>
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg truncate">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2 min-h-[2.5rem]">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-gray-800">
                            {formatPrice(product.price)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.stock} in stock
                          </p>
                        </div>
                        
                        {/* Rating (optional - you can add rating to your Product model) */}
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={`${
                                i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        {inCart ? (
                          <div className="flex-1">
                            <a
                              href="/dashboard/owner/cart"
                              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                              <Check size={16} />
                              {cartQty} in Cart • View
                            </a>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <button
                                onClick={() => handleAddToCart(product)}
                                disabled={product.stock === 0 || addingToCart[product.id]}
                                className={`w-full py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                                  product.stock === 0
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                                }`}
                              >
                                {addingToCart[product.id] ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Adding...
                                  </>
                                ) : product.stock === 0 ? (
                                  'Out of Stock'
                                ) : (
                                  <>
                                    <ShoppingCart size={16} />
                                    Add to Cart
                                  </>
                                )}
                              </button>
                            </div>
                            
                            <button
                              onClick={() => handleQuickView(product)}
                              className="px-4 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                              title="Quick View"
                            >
                              <Eye size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Quick View Modal */}
      {showQuickView && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedProduct.name}
                </h2>
                <button
                  onClick={() => setShowQuickView(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="relative">
                  <img
                    src={getImageUrl(selectedProduct.imageUrl)}
                    alt={selectedProduct.name}
                    className="w-full h-80 object-cover rounded-2xl"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/500x500?text=No+Image';
                    }}
                  />
                  
                  {/* Stock Status */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedProduct.stock > 10 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : selectedProduct.stock > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedProduct.stock > 10 ? 'In Stock' : selectedProduct.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {selectedProduct.name}
                    </h3>
                    <p className="text-gray-600">
                      {selectedProduct.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="text-3xl font-bold text-gray-800">
                          {formatPrice(selectedProduct.price)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Available</p>
                        <p className={`text-lg font-semibold ${
                          selectedProduct.stock > 10 ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {selectedProduct.stock} items
                        </p>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg"
                            disabled={quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={selectedProduct.stock}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, Math.min(selectedProduct.stock, parseInt(e.target.value) || 1)))}
                            className="w-16 text-center py-2 border-x border-gray-300 outline-none"
                          />
                          <button
                            onClick={() => setQuantity(prev => Math.min(selectedProduct.stock, prev + 1))}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                            disabled={quantity >= selectedProduct.stock}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          Max: {selectedProduct.stock}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      {isInCart(selectedProduct.id) ? (
                        <div className="flex-1">
                          <a
                            href="/dashboard/owner/cart"
                            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 text-lg"
                          >
                            <Check size={20} />
                            {getCartQuantity(selectedProduct.id)} in Cart • View Cart
                          </a>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <button
                              onClick={() => handleAddToCart(selectedProduct)}
                              disabled={selectedProduct.stock === 0 || addingToCart[selectedProduct.id]}
                              className={`w-full py-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-lg ${
                                selectedProduct.stock === 0
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                              }`}
                            >
                              {addingToCart[selectedProduct.id] ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  Adding...
                                </>
                              ) : selectedProduct.stock === 0 ? (
                                'Out of Stock'
                              ) : (
                                <>
                                  <ShoppingCart size={20} />
                                  Add to Cart
                                </>
                              )}
                            </button>
                          </div>
                          
                          <button
                            className="px-6 py-4 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                            onClick={() => {
                              // Add to wishlist functionality can be added later
                              toast.info('Wishlist feature coming soon!');
                            }}
                          >
                            <Heart size={20} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowQuickView(false)}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Notification */}
      <div className="fixed bottom-6 right-6 z-40">
        <a
          href="/dashboard/owner/cart"
          className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="relative">
            <ShoppingCart size={20} />
            {cartTotalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartTotalItems}
              </span>
            )}
          </div>
          <span className="font-medium">
            {formatPrice(cartTotalPrice)}
          </span>
        </a>
      </div>
    </div>
  );
};

export default Shop; 