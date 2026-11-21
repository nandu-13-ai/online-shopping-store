/**
 * NammaStore State Management & Persistence Engine
 * Handles Cart, Wishlist, Compare, Currency, Coupons, Orders, and LocalStorage sync
 */

class NammaStoreState {
  constructor() {
    this.STORAGE_KEY = 'nammastore_state_v1';
    this.listeners = {};
    this.init();
  }

  init() {
    const defaultState = {
      theme: 'light',
      currency: 'INR',
      cart: [
        {
          cartItemId: 'item_init_1',
          productId: 'ns-005',
          name: 'Coorg Single-Estate Arabica Roast & Ground Artisanal Coffee (500g)',
          price: 680,
          originalPrice: 850,
          image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80',
          quantity: 2,
          selectedSize: '500g Value Pack',
          selectedColor: null,
          maxStock: 35
        },
        {
          cartItemId: 'item_init_2',
          productId: 'ns-006',
          name: 'Pure Brass Traditional South Indian Filter Coffee Maker (4-Cup)',
          price: 1450,
          originalPrice: 1950,
          image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
          quantity: 1,
          selectedSize: '4-Cup Family',
          selectedColor: null,
          maxStock: 24
        }
      ],
      wishlist: ['ns-001', 'ns-002'],
      compare: ['ns-001', 'ns-003'],
      recentlyViewed: ['ns-001', 'ns-002', 'ns-005'],
      appliedCoupon: null,
      coinsBalance: 450,
      appliedCoins: 0,
      deliveryMethod: 'standard', // standard (0), express (99), rush (199)
      shippingAddress: {
        fullName: 'Anand Kumar',
        phone: '+91 98400 12345',
        street: '#42, 4th Cross, Indiranagar 100ft Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        tag: 'Home'
      },
      savedAddresses: [
        {
          id: 'addr-1',
          fullName: 'Anand Kumar',
          phone: '+91 98400 12345',
          street: '#42, 4th Cross, Indiranagar 100ft Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
          tag: 'Home',
          isDefault: true
        },
        {
          id: 'addr-2',
          fullName: 'Anand Kumar (Office)',
          phone: '+91 98400 12345',
          street: 'Prestige Tech Cloud, Phase 2, Whitefield',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560066',
          tag: 'Work',
          isDefault: false
        }
      ],
      orders: [
        {
          id: 'NM-89214',
          date: '2026-11-12T10:30:00Z',
          status: 'Delivered',
          timeline: [
            { stage: 'Order Placed', time: 'Nov 12, 10:30 AM', done: true },
            { stage: 'Packed & Verified', time: 'Nov 12, 02:15 PM', done: true },
            { stage: 'Dispatched via NammaExpress', time: 'Nov 13, 08:00 AM', done: true },
            { stage: 'Out for Delivery', time: 'Nov 13, 01:20 PM', done: true },
            { stage: 'Delivered', time: 'Nov 13, 03:45 PM', done: true }
          ],
          items: [
            {
              productId: 'ns-007',
              name: 'Kumkumadi Miraculous Ayurvedic Night Beauty Face Elixir (30ml)',
              price: 2450,
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1608248597359-bb436a53f2cf?w=800&auto=format&fit=crop&q=80'
            }
          ],
          total: 2450,
          paymentMethod: 'UPI (Google Pay)',
          trackingNumber: 'NMX-BLR-90821'
        }
      ],
      user: {
        isLoggedIn: true,
        name: 'Anand Kumar',
        email: 'anand@nammastore.com',
        phone: '+91 98400 12345',
        membership: 'Namma Prime Gold Member'
      },
      ownedWardrobe: [
        {
          id: 'own-001',
          name: 'Navy Slim Fit Cotton Shirt',
          brand: 'Zara',
          category: 'tops',
          image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
          dimensions: { chest: 104, length: 74, shoulder: 45, sleeve: 63 },
          notes: 'My favorite laid-flat reference shirt. Perfectly tailored around chest and shoulders.',
          dateAdded: '2026-11-01',
          isDefault: true
        }
      ]
    };

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.state = { ...defaultState, ...JSON.parse(saved) };
        this.state.ownedWardrobe = (this.state.ownedWardrobe || []).filter(item => !/^own-00[2-9]$/.test(item.id));
        if (!this.state.ownedWardrobe.some(item => item.id === 'own-001')) {
          this.state.ownedWardrobe.unshift(defaultState.ownedWardrobe[0]);
        }
        this.save();
      } else {
        this.state = defaultState;
        this.save();
      }
    } catch (e) {
      console.warn('LocalStorage error, using defaults:', e);
      this.state = defaultState;
    }
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
    // Also dispatch window custom event for broad UI updates if available
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('namma:' + event, { detail: data }));
    }
  }

  // --- Currency & Formatting ---
  setCurrency(currCode) {
    if (window.CURRENCIES && window.CURRENCIES[currCode]) {
      this.state.currency = currCode;
      this.save();
      this.emit('currency:changed', currCode);
    }
  }

  getCurrency() {
    return this.state.currency || 'INR';
  }

  formatPrice(inrAmount) {
    const curr = window.CURRENCIES[this.getCurrency()] || window.CURRENCIES.INR;
    const converted = inrAmount * curr.rate;
    
    if (this.getCurrency() === 'INR') {
      return curr.symbol + Math.round(converted).toLocaleString('en-IN');
    }
    return curr.symbol + converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // --- Theme ---
  setTheme(theme) {
    this.state.theme = theme;
    this.save();
    document.documentElement.classList.toggle('dark', theme === 'dark');
    this.emit('theme:changed', theme);
  }

  toggleTheme() {
    const nextTheme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
    return nextTheme;
  }

  // --- Cart Operations ---
  getCart() {
    return this.state.cart;
  }

  getCartCount() {
    return this.state.cart.reduce((total, item) => total + item.quantity, 0);
  }

  addToCart(product, quantity = 1, options = {}) {
    const { selectedColor, selectedSize } = options;
    const cartItemId = `${product.id}_${selectedColor || 'def'}_${selectedSize || 'def'}`;

    const existingIndex = this.state.cart.findIndex(i => i.cartItemId === cartItemId);
    if (existingIndex > -1) {
      this.state.cart[existingIndex].quantity += quantity;
      if (this.state.cart[existingIndex].quantity > product.stockQuantity) {
        this.state.cart[existingIndex].quantity = product.stockQuantity;
      }
    } else {
      this.state.cart.push({
        cartItemId,
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images[0],
        quantity: Math.min(quantity, product.stockQuantity),
        selectedColor: selectedColor || null,
        selectedSize: selectedSize || null,
        maxStock: product.stockQuantity
      });
    }

    this.save();
    this.emit('cart:updated', this.state.cart);
    return true;
  }

  updateCartQty(cartItemId, newQty) {
    const item = this.state.cart.find(i => i.cartItemId === cartItemId);
    if (!item) return;

    if (newQty <= 0) {
      this.removeFromCart(cartItemId);
    } else {
      item.quantity = Math.min(newQty, item.maxStock || 99);
      this.save();
      this.emit('cart:updated', this.state.cart);
    }
  }

  removeFromCart(cartItemId) {
    this.state.cart = this.state.cart.filter(i => i.cartItemId !== cartItemId);
    this.save();
    this.emit('cart:updated', this.state.cart);
  }

  clearCart() {
    this.state.cart = [];
    this.state.appliedCoupon = null;
    this.state.appliedCoins = 0;
    this.save();
    this.emit('cart:updated', this.state.cart);
  }

  // --- Financial Calculations ---
  getCartSubtotal() {
    return this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getCartSavings() {
    return this.state.cart.reduce((sum, item) => {
      const orig = item.originalPrice || item.price;
      return sum + ((orig - item.price) * item.quantity);
    }, 0);
  }

  getShippingCost() {
    const subtotal = this.getCartSubtotal();
    if (subtotal === 0) return 0;
    if (this.state.appliedCoupon && this.state.appliedCoupon.type === 'free_shipping') return 0;

    switch (this.state.deliveryMethod) {
      case 'express':
        return 99;
      case 'rush':
        return 199;
      case 'standard':
      default:
        return subtotal >= 999 ? 0 : 70;
    }
  }

  getCouponDiscount() {
    const subtotal = this.getCartSubtotal();
    if (!this.state.appliedCoupon || subtotal === 0) return 0;

    const coupon = this.state.appliedCoupon;
    if (subtotal < (coupon.minSpend || 0)) return 0;

    if (coupon.type === 'percent') {
      return Math.round(subtotal * coupon.discount);
    } else if (coupon.type === 'fixed') {
      return Math.min(coupon.discount, subtotal);
    }
    return 0;
  }

  getCoinsDiscount() {
    return Math.min(this.state.appliedCoins, this.getCartSubtotal() * 0.2); // max 20% by coins
  }

  getCartTotal() {
    const subtotal = this.getCartSubtotal();
    if (subtotal === 0) return 0;
    const discount = this.getCouponDiscount();
    const coins = this.getCoinsDiscount();
    const shipping = this.getShippingCost();
    const estimatedTax = Math.round(subtotal * 0.05); // 5% GST preview
    return Math.max(0, subtotal - discount - coins + shipping + estimatedTax);
  }

  applyCoupon(code) {
    const normalized = (code || '').trim().toUpperCase();
    const coupon = window.COUPONS ? window.COUPONS[normalized] : null;

    if (!coupon) {
      return { success: false, message: 'Invalid promo code. Try "NAMMA20" or "FIRSTBUY".' };
    }

    const subtotal = this.getCartSubtotal();
    if (subtotal < coupon.minSpend) {
      return {
        success: false,
        message: `Min spend of ₹${coupon.minSpend} required for this coupon.`
      };
    }

    this.state.appliedCoupon = { code: normalized, ...coupon };
    this.save();
    this.emit('cart:updated', this.state.cart);
    return { success: true, message: `Coupon ${normalized} applied! ${coupon.label}` };
  }

  removeCoupon() {
    this.state.appliedCoupon = null;
    this.save();
    this.emit('cart:updated', this.state.cart);
  }

  setDeliveryMethod(method) {
    this.state.deliveryMethod = method;
    this.save();
    this.emit('cart:updated', this.state.cart);
  }

  applyCoins(coins) {
    const available = this.state.coinsBalance;
    const maxUsable = Math.floor(this.getCartSubtotal() * 0.2);
    const toApply = Math.min(coins, available, maxUsable);
    this.state.appliedCoins = toApply;
    this.save();
    this.emit('cart:updated', this.state.cart);
    return toApply;
  }

  // --- Wishlist ---
  getWishlist() {
    return this.state.wishlist;
  }

  isInWishlist(productId) {
    return this.state.wishlist.includes(productId);
  }

  toggleWishlist(productId) {
    const index = this.state.wishlist.indexOf(productId);
    let added = false;
    if (index > -1) {
      this.state.wishlist.splice(index, 1);
      added = false;
    } else {
      this.state.wishlist.push(productId);
      added = true;
    }
    this.save();
    this.emit('wishlist:updated', { productId, added, list: this.state.wishlist });
    return added;
  }

  // --- Compare ---
  getCompare() {
    return this.state.compare;
  }

  isInCompare(productId) {
    return this.state.compare.includes(productId);
  }

  toggleCompare(productId) {
    const index = this.state.compare.indexOf(productId);
    let added = false;
    if (index > -1) {
      this.state.compare.splice(index, 1);
      added = false;
    } else {
      if (this.state.compare.length >= 4) {
        return { success: false, message: 'You can compare up to 4 products at once.' };
      }
      this.state.compare.push(productId);
      added = true;
    }
    this.save();
    this.emit('compare:updated', { productId, added, list: this.state.compare });
    return { success: true, added };
  }

  clearCompare() {
    this.state.compare = [];
    this.save();
    this.emit('compare:updated', { list: [] });
  }

  // --- Recently Viewed ---
  addRecentlyViewed(productId) {
    this.state.recentlyViewed = [
      productId,
      ...this.state.recentlyViewed.filter(id => id !== productId)
    ].slice(0, 8);
    this.save();
  }

  // --- Orders & Checkout ---
  createOrder(checkoutData) {
    const orderId = 'NM-' + Math.floor(100000 + Math.random() * 900000);
    const trackingNo = 'NMX-BLR-' + Math.floor(10000 + Math.random() * 90000);
    const now = new Date();

    const newOrder = {
      id: orderId,
      date: now.toISOString(),
      status: 'Confirmed',
      timeline: [
        { stage: 'Order Placed & Payment Verified', time: 'Just now', done: true },
        { stage: 'Packing & Quality Check', time: 'Expected within 2 hrs', done: false },
        { stage: 'Dispatched with NammaExpress', time: 'Expected tomorrow', done: false },
        { stage: 'Out for Delivery', time: 'Pending', done: false },
        { stage: 'Delivered', time: 'Pending', done: false }
      ],
      items: [...this.state.cart],
      subtotal: this.getCartSubtotal(),
      discount: this.getCouponDiscount() + this.getCoinsDiscount(),
      shippingCost: this.getShippingCost(),
      total: this.getCartTotal(),
      paymentMethod: checkoutData.paymentMethod || 'UPI',
      shippingAddress: checkoutData.address || this.state.shippingAddress,
      deliveryMethod: this.state.deliveryMethod,
      trackingNumber: trackingNo,
      notes: checkoutData.notes || ''
    };

    // Deduct coins if used, and reward 5% coins for next purchase
    if (this.state.appliedCoins > 0) {
      this.state.coinsBalance = Math.max(0, this.state.coinsBalance - this.state.appliedCoins);
    }
    const earnedCoins = Math.floor(newOrder.total * 0.05);
    this.state.coinsBalance += earnedCoins;

    this.state.orders.unshift(newOrder);
    this.clearCart();
    this.save();

    this.emit('order:created', newOrder);
    return newOrder;
  }

  getOrder(orderId) {
    return this.state.orders.find(o => o.id === orderId || o.trackingNumber === orderId);
  }

  // --- Product Reviews ---
  addReview(productId, reviewData) {
    const prod = window.PRODUCTS.find(p => p.id === productId);
    if (!prod) return false;

    const newRev = {
      user: reviewData.user || this.state.user.name,
      rating: Number(reviewData.rating) || 5,
      date: new Date().toISOString().split('T')[0],
      title: reviewData.title || 'Great product!',
      comment: reviewData.comment || ''
    };

    prod.reviews = prod.reviews || [];
    prod.reviews.unshift(newRev);

    // Recalculate average rating
    const totalScore = prod.reviews.reduce((acc, r) => acc + r.rating, 0);
    prod.rating = parseFloat((totalScore / prod.reviews.length).toFixed(1));
    prod.reviewCount = prod.reviews.length;

    this.emit('product:reviewed', { productId, product: prod });
    return true;
  }

  // --- "Compare With What I Own" / Fit Locker Management ---
  getOwnedItems(category = null) {
    const list = this.state.ownedWardrobe || [];
    if (!category) return list;
    return list.filter(item => item.category === category);
  }

  getOwnedItem(id) {
    return (this.state.ownedWardrobe || []).find(item => item.id === id);
  }

  getDefaultOwnedItem(category = 'tops') {
    const list = this.getOwnedItems(category);
    return list.find(item => item.isDefault) || list[0] || null;
  }

  addOwnedItem(itemData) {
    if (!this.state.ownedWardrobe) this.state.ownedWardrobe = [];

    const newItem = {
      id: 'own-' + Date.now(),
      name: itemData.name || 'My Favorite Shirt',
      brand: itemData.brand || 'Personal Favorite',
      category: itemData.category || 'tops',
      image: itemData.image || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
      dimensions: {
        chest: Number(itemData.dimensions?.chest) || 104,
        length: Number(itemData.dimensions?.length) || 74,
        shoulder: Number(itemData.dimensions?.shoulder) || 45,
        sleeve: Number(itemData.dimensions?.sleeve) || 63,
        height: Number(itemData.dimensions?.height) || 45,
        width: Number(itemData.dimensions?.width) || 32,
        depth: Number(itemData.dimensions?.depth) || 16
      },
      notes: itemData.notes || 'Laid-flat scan measurement',
      dateAdded: new Date().toISOString().split('T')[0],
      isDefault: true // Auto-set newly scanned/uploaded item as default reference
    };

    // Unset other defaults in same category
    this.state.ownedWardrobe.forEach(i => {
      if (i.category === newItem.category) i.isDefault = false;
    });

    this.state.ownedWardrobe.unshift(newItem);
    this.save();
    this.emit('wardrobe:updated', { action: 'added', item: newItem });
    return newItem;
  }

  deleteOwnedItem(id) {
    this.state.ownedWardrobe = (this.state.ownedWardrobe || []).filter(item => item.id !== id);
    this.save();
    this.emit('wardrobe:updated', { action: 'deleted', id });
  }

  setDefaultOwnedItem(id) {
    const item = this.getOwnedItem(id);
    if (!item) return;

    (this.state.ownedWardrobe || []).forEach(i => {
      if (i.category === item.category) {
        i.isDefault = (i.id === id);
      }
    });

    this.save();
    this.emit('wardrobe:updated', { action: 'set_default', id });
  }

  // Fit Comparison Engine: generates plain-English verdict & precise measurement deltas
  compareFitWithProduct(product, targetSize = null, ownedItemId = null) {
    if (!product) return null;
    const ownedList = this.getOwnedItems();
    if (!ownedList.length) return null;

    let owned = ownedItemId ? this.getOwnedItem(ownedItemId) : null;
    if (!owned) {
      owned = this.getDefaultOwnedItem(product.fitType || 'tops') || ownedList[0];
    }
    if (!owned) return null;

    // TOPS / APPAREL COMPARISON
    if (product.sizeMeasurements) {
      const availableSizes = Object.keys(product.sizeMeasurements);
      const chosenSize = (targetSize && product.sizeMeasurements[targetSize]) ? targetSize : (availableSizes.includes('L (42)') ? 'L (42)' : availableSizes[0]);
      const targetDims = product.sizeMeasurements[chosenSize];
      const userDims = owned.dimensions;

      const chestDiff = +(targetDims.chest - userDims.chest).toFixed(1);
      const lengthDiff = +(targetDims.length - userDims.length).toFixed(1);
      const shoulderDiff = +(targetDims.shoulder - userDims.shoulder).toFixed(1);
      const sleeveDiff = (targetDims.sleeve && userDims.sleeve) ? +(targetDims.sleeve - userDims.sleeve).toFixed(1) : 0;

      // Match Score (0 - 100%)
      const penalty = Math.abs(chestDiff) * 3 + Math.abs(lengthDiff) * 1.5 + Math.abs(shoulderDiff) * 2;
      const matchScore = Math.max(68, Math.min(99, Math.round(100 - penalty)));

      // Plain English Verdict Formulation
      let lengthPhrase = '';
      if (Math.abs(lengthDiff) === 0) {
        lengthPhrase = 'identical length';
      } else if (lengthDiff > 0) {
        lengthPhrase = `${Math.abs(lengthDiff)} cm longer in length`;
      } else {
        lengthPhrase = `${Math.abs(lengthDiff)} cm shorter in length`;
      }

      let chestPhrase = '';
      if (Math.abs(chestDiff) === 0) {
        chestPhrase = 'the exact same chest fit';
      } else if (chestDiff > 0) {
        chestPhrase = `${Math.abs(chestDiff)} cm roomier around the chest`;
      } else {
        chestPhrase = `${Math.abs(chestDiff)} cm more tailored around the chest`;
      }

      let cleanName = product.name.replace(/^Namma Crafted (South Indian )?/i, '').replace(/^Men Handloom /i, '');
      const shortName = cleanName.split(' ').slice(0, 5).join(' ');
      const ownedRefName = `${owned.brand ? owned.brand + ' ' : ''}${owned.name}`;
      
      let naturalVerdict = '';
      if (Math.abs(lengthDiff) === 0 && Math.abs(chestDiff) === 0) {
        naturalVerdict = `This ${shortName} matches the identical length and chest fit of your favorite ${ownedRefName}.`;
      } else if (Math.abs(lengthDiff) === 0) {
        naturalVerdict = `This ${shortName} matches the exact length of your favorite ${ownedRefName}, but has ${chestPhrase}.`;
      } else if (Math.abs(chestDiff) === 0) {
        naturalVerdict = `This ${shortName} is ${lengthPhrase}, while maintaining ${chestPhrase} as your favorite ${ownedRefName}.`;
      } else {
        naturalVerdict = `This ${shortName} is ${lengthPhrase} but has ${chestPhrase} as your favorite ${ownedRefName}.`;
      }

      // Find best size across all available sizes
      let bestSize = chosenSize;
      let highestScore = -1;
      const allScores = {};

      availableSizes.forEach(s => {
        const d = product.sizeMeasurements[s];
        const cD = Math.abs(d.chest - userDims.chest);
        const lD = Math.abs(d.length - userDims.length);
        const sD = Math.abs(d.shoulder - userDims.shoulder);
        const pen = cD * 3 + lD * 1.5 + sD * 2;
        const sc = Math.max(65, Math.min(99, Math.round(100 - pen)));
        allScores[s] = sc;
        if (sc > highestScore) {
          highestScore = sc;
          bestSize = s;
        }
      });

      return {
        type: 'tops',
        ownedItem: owned,
        targetSize: chosenSize,
        targetDims,
        userDims,
        deltas: {
          chest: {
            diff: chestDiff,
            userVal: userDims.chest,
            targetVal: targetDims.chest,
            label: Math.abs(chestDiff) === 0 ? 'Exact Same Fit' : `${chestDiff > 0 ? '+' : ''}${chestDiff} cm`
          },
          length: {
            diff: lengthDiff,
            userVal: userDims.length,
            targetVal: targetDims.length,
            label: Math.abs(lengthDiff) === 0 ? 'Exact Same Length' : `${lengthDiff > 0 ? '+' : ''}${lengthDiff} cm`
          },
          shoulder: {
            diff: shoulderDiff,
            userVal: userDims.shoulder,
            targetVal: targetDims.shoulder,
            label: Math.abs(shoulderDiff) === 0 ? 'Exact Same Shoulders' : `${shoulderDiff > 0 ? '+' : ''}${shoulderDiff} cm`
          },
          sleeve: {
            diff: sleeveDiff,
            userVal: userDims.sleeve,
            targetVal: targetDims.sleeve,
            label: Math.abs(sleeveDiff) === 0 ? 'Exact Same Sleeve' : `${sleeveDiff > 0 ? '+' : ''}${sleeveDiff} cm`
          }
        },
        matchScore,
        naturalVerdict,
        bestSize,
        bestSizeScore: highestScore,
        allScores
      };
    }

    // BAGS / BACKPACKS COMPARISON
    if (product.bagMeasurements && owned.dimensions) {
      const targetDims = product.bagMeasurements;
      const userDims = owned.dimensions;
      const hDiff = +(targetDims.height - (userDims.height || 45)).toFixed(1);
      const wDiff = +(targetDims.width - (userDims.width || 30)).toFixed(1);
      const dDiff = +(targetDims.depth - (userDims.depth || 15)).toFixed(1);

      const naturalVerdict = `This backpack is ${hDiff >= 0 ? `${hDiff} cm taller` : `${Math.abs(hDiff)} cm more compact`} and ${wDiff >= 0 ? `${wDiff} cm wider` : `${Math.abs(wDiff)} cm slimmer`} than your ${owned.name}, securely fitting up to a ${targetDims.laptopFit}" laptop.`;

      return {
        type: 'bags',
        ownedItem: owned,
        targetDims,
        userDims,
        deltas: {
          height: { diff: hDiff, label: `${hDiff > 0 ? '+' : ''}${hDiff} cm` },
          width: { diff: wDiff, label: `${wDiff > 0 ? '+' : ''}${wDiff} cm` },
          depth: { diff: dDiff, label: `${dDiff > 0 ? '+' : ''}${dDiff} cm` }
        },
        matchScore: 96,
        naturalVerdict,
        bestSize: product.variants.sizes ? product.variants.sizes[0] : 'Standard'
      };
    }

    return null;
  }
}

// Global Singleton
window.Store = new NammaStoreState();
