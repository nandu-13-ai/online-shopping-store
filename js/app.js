/**
 * NammaStore — Main Application Controller & UI Logic
 * Implements catalog filtering, search, voice search, modals, cart drawer,
 * multi-step checkout with interactive 3D card & QR timer, compare, wishlist,
 * reviews, invoice generator, and social proof popups.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- App State & References ---
  const state = {
    selectedCategory: 'all',
    searchQuery: '',
    searchResultIds: null,
    searchRequestVersion: 0,
    minPrice: 0,
    maxPrice: 350000,
    sortBy: 'featured',
    ratingFilter: 0,
    onlyInStock: false,
    onlyExpress: false,
    viewMode: 'grid', // 'grid' | 'list'
    activeQuickViewProduct: null,
    activeCheckoutStep: 1,
    isSearchPageActive: false,
    searchPageResults: [],
    searchPageSort: 'featured',
    searchPageViewMode: 'grid',
    checkoutData: {
      address: null,
      shippingSpeed: 'standard',
      paymentMethod: 'upi',
      cardDetails: { number: '', name: '', expiry: '', cvv: '' },
      upiId: '',
      codCaptchaInput: '',
      codCaptchaGenerated: '7829'
    }
  };

  // --- Initial Mount & Event Subscriptions ---
  initThemeAndCurrency();
  initTopBannerCountdown();
  renderCategories();
  if (sessionStorage.getItem('nammastore-prototype-auth') === '1') {
    document.body.classList.remove('auth-gate');
    renderProducts();
  } else {
    renderLoginPage();
  }
  updateHeaderBadges();
  initCartDrawer();
  initSearchAndVoice();
  initSocialProofPopup();
  loadCatalogFromServices();
  if (sessionStorage.getItem('nammastore-prototype-auth') === '1') hydrateCartFromDatabase();

  // Listen to Store events
  window.addEventListener('namma:cart:updated', () => {
    updateHeaderBadges();
    renderCartDrawerContent();
    renderProducts(); // Update stepper buttons on cards if in cart
    if (state.isSearchPageActive) renderSearchResultsGrid();
    if (sessionStorage.getItem('nammastore-prototype-auth') === '1') {
      fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: window.Store.getCart() }) })
        .catch(error => console.warn('Could not sync cart to PostgreSQL:', error));
    }
  });

  window.addEventListener('namma:wishlist:updated', () => {
    updateHeaderBadges();
    renderProducts();
    if (state.isSearchPageActive) renderSearchResultsGrid();
  });

  window.addEventListener('namma:compare:updated', () => {
    updateHeaderBadges();
    renderCompareDrawer();
    renderProducts();
    if (state.isSearchPageActive) renderSearchResultsGrid();
  });

  window.Store.on('wardrobe:updated', () => {
    updateHeaderBadges();
    renderProducts();
    if (state.isSearchPageActive) renderSearchResultsGrid();
    if (state.activeQuickViewProduct && state.activeQuickViewProduct.fitType === 'tops') {
      renderQuickViewFitTwin(state.activeQuickViewProduct, state.activeQuickViewSelectedSize || null);
    }
  });

  window.addEventListener('namma:currency:changed', () => {
    renderProducts();
    renderCartDrawerContent();
    if (state.isSearchPageActive) renderSearchResultsGrid();
    if (state.activeQuickViewProduct) {
      renderQuickViewPrice(state.activeQuickViewProduct);
    }
  });

  // --- Theme & Currency Handlers ---
  function initThemeAndCurrency() {
    // Theme
    const currentTheme = window.Store.state.theme || 'light';
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
    updateThemeIcon(currentTheme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const next = window.Store.toggleTheme();
        updateThemeIcon(next);
        showToast(next === 'dark' ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️', 'info');
      });
    }

    // Currency
    const currencySelect = document.getElementById('currency-select');
    if (currencySelect) {
      currencySelect.value = window.Store.getCurrency();
      currencySelect.addEventListener('change', (e) => {
        window.Store.setCurrency(e.target.value);
        showToast(`Currency changed to ${e.target.value}`, 'info');
      });
    }
  }

  function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle-btn i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fa-solid fa-sun text-amber-400' : 'fa-solid fa-moon text-slate-600';
    }
  }

  // --- Top Banner Flash Sale Countdown ---
  function initTopBannerCountdown() {
    const timerEl = document.getElementById('deal-countdown');
    if (!timerEl) return;

    let totalSeconds = 4 * 3600 + 42 * 60 + 19; // 04h 42m 19s
    setInterval(() => {
      if (totalSeconds <= 0) totalSeconds = 24 * 3600;
      totalSeconds--;

      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;

      timerEl.textContent = `${String(hrs).padStart(2, '0')}h : ${String(mins).padStart(2, '0')}m : ${String(secs).padStart(2, '0')}s`;
    }, 1000);
  }

  // --- Render Categories Bar & Mega Dropdowns ---
  function renderLoginPage() {
    const container = document.getElementById('main-content');
    if (!container) return;
    document.body.classList.add('auth-gate');
    container.innerHTML = `
      <section class="max-w-md mx-auto py-10">
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-7 shadow-lg border border-slate-200 dark:border-slate-700">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Sign in</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Prototype sign-in. Any username and password will work.</p>
          <form id="auth-form" class="space-y-4">
            <label class="block text-sm font-medium">Username<input name="username" autocomplete="username" class="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2.5"></label>
            <label class="block text-sm font-medium">Password<input name="password" type="password" autocomplete="current-password" class="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2.5"></label>
            <button class="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold py-3">Continue</button>
          </form>
          <button id="auth-close" class="mt-4 w-full text-sm text-slate-500">Continue shopping</button>
        </div>
      </section>`;
    container.querySelector('#auth-close').addEventListener('click', () => {
      sessionStorage.setItem('nammastore-prototype-auth', '1');
      window.location.reload();
    });
    container.querySelector('#auth-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const username = new FormData(event.currentTarget).get('username').trim();
      const submit = container.querySelector('#auth-form button[type="submit"], #auth-form button');
      const message = document.createElement('p');
      message.className = 'mt-3 text-sm text-rose-600';
      message.classList.add('hidden');
      message.id = 'auth-error';
      container.querySelector('#auth-form').appendChild(message);
      if (submit) submit.disabled = true;
      fetch('/api/auth/prototype-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) })
        .then(async response => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'The account service is unavailable.');
          window.Store.state.user = { ...window.Store.state.user, ...data.customer, phone: data.customer.phone || window.Store.state.user.phone || '', isLoggedIn: true };
          window.Store.save();
          sessionStorage.setItem('nammastore-prototype-auth', '1');
          window.location.reload();
        })
        .catch(error => {
          message.textContent = `${error.message} Start PostgreSQL, Kafka, OpenSearch, and the NammaStore server, then try again.`;
          message.classList.remove('hidden');
          if (submit) submit.disabled = false;
        });
    });
  }

  async function loadCatalogFromServices() {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) return;
      const data = await response.json();
      const byId = new Map(data.products.map(product => [product.id, product]));
      window.PRODUCTS = window.PRODUCTS.map(product => ({ ...product, ...(byId.get(product.id) || {}) }));
      renderProducts();
    } catch (error) {
      console.warn('Database catalog unavailable; showing the bundled demo catalog.', error);
    }
  }

  async function hydrateCartFromDatabase() {
    try {
      const response = await fetch('/api/cart');
      if (!response.ok) return;
      const { items } = await response.json();
      if (items.length || !window.Store.getCart().length) {
        window.Store.state.cart = items;
        window.Store.save();
        updateHeaderBadges();
        renderCartDrawerContent();
      } else {
        await fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: window.Store.getCart() }) });
      }
    } catch (error) {
      console.warn('Database cart unavailable; keeping the local cart.', error);
    }
  }

  async function searchCatalog() {
    const requestVersion = ++state.searchRequestVersion;
    const params = new URLSearchParams({ q: state.searchQuery, category: state.selectedCategory, minPrice: String(state.minPrice), maxPrice: String(state.maxPrice) });
    const city = document.getElementById('filter-city')?.value || '';
    if (city) params.set('city', city);
    const response = await fetch(`/api/search?${params}`);
    if (!response.ok) throw new Error('Product search is unavailable.');
    const data = await response.json();
    if (requestVersion !== state.searchRequestVersion) return;
    state.searchResultIds = data.products.map(product => product.id);
    const indexed = new Map(data.products.map(product => [product.id, product]));
    window.PRODUCTS = window.PRODUCTS.map(product => ({ ...product, ...(indexed.get(product.id) || {}) }));
    renderProducts();
  }
  function renderProfilePage() {
  const container = document.getElementById('main-content');
  if (!container) return;

  const user = window.Store.state.user;
  const savedAddresses = window.Store.state.savedAddresses || [];
  const orders = window.Store.state.orders || [];

  container.innerHTML = `
    <div class="profile-page relative">
      <!-- Back/Close Button -->
      <button id="close-profile-btn" type="button" onclick="window.location.assign('/')" class="absolute top-0 right-0 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition">
        <i class="fa-solid fa-xmark text-lg"></i>
      </button>

      <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">My Profile</h1>

      <div class="profile-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Profile Details Card -->
        <div class="profile-card bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/60">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
              <i class="fa-solid fa-user"></i>
            </div>
            <div>
              <h2 class="font-semibold text-slate-800 dark:text-white mb-1">${user.name}</h2>
              <p class="text-slate-500 dark:text-slate-400 text-sm">${user.email}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <span class="flex items-center gap-1">
              <i class="fa-solid fa-phone"></i>
              ${user.phone}
            </span>
            <span class="flex items-center gap-1">
              <i class="fa-solid fa-location-dot"></i>
              ${user.phone.includes('Bengaluru') ? 'Bengaluru, Karnataka' : 'Your Location'}
            </span>
          </div>
        </div>

        <!-- Saved Addresses Card -->
        <div class="profile-card bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/60">
          <h2 class="font-semibold text-slate-800 dark:text-white mb-4">Saved Addresses</h2>
          ${savedAddresses.length === 0 ? `
            <div class="empty-state py-8 text-center">
              <div class="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-2xl mb-3">
                <i class="fa-solid fa-location-blank"></i>
              </div>
              <h3 class="font-bold mb-2">No saved addresses</h3>
              <p class="text-slate-400 dark:text-slate-500">Add an address to see it here.</p>
              <button class="mt-4 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-all shadow-md">
                Add Address
              </button>
            </div>
          ` : `
            <div class="space-y-3">
              ${savedAddresses.map(addr => `
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-slate-800 dark:text-white truncate">${addr.tag}</span>
                    <button class="text-xs text-amber-500 hover:text-amber-400">Edit</button>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">${addr.street}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    <span class="font-bold text-slate-800 dark:text-white">${addr.city}</span>,
                    <span class="font-bold text-slate-800 dark:text-white">${addr.state}</span> ${addr.pincode}
                  </p>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Order History Card -->
        <div class="profile-card bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/60">
          <h2 class="font-semibold text-slate-800 dark:text-white mb-4">Order History</h2>
          ${orders.length === 0 ? `
            <div class="empty-state py-8 text-center">
              <div class="w-16 h-16 mx-auto rounded bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-2xl mb-3">
                <i class="fa-solid fa-box"></i>
              </div>
              <h3 class="font-bold mb-2">No orders yet</h3>
              <p class="text-slate-400 dark:text-slate-500">Start shopping to see your orders here.</p>
            </div>
          ` : `
            <div class="space-y-3">
              ${orders.slice(0, 3).map(order => `
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40 flex items-between justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
                      <i class="fa-solid fa-box"></i>
                    </div>
                    <div>
                      <p class="font-medium text-slate-800 dark:text-white truncate">${order.name || 'Order #${order.id}'}</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400">${order.date ? order.date.split('T')[0] : 'Recent'}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="font-bold text-slate-800 dark:text-white">${window.Store.formatPrice(order.total)}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">${order.status}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Track My Order Card -->
        <div class="profile-card bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/60">
          <h2 class="font-semibold text-slate-800 dark:text-white mb-4">Track My Order</h2>
          <p class="text-slate-500 dark:text-slate-400 mb-4">Enter your order ID or tracking number to find and track your orders.</p>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40">
            <input
              type="text"
              id="track-order-input"
              placeholder="Enter order ID (e.g., NM-89214)"
              class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
            />
            <button
              id="track-order-btn"
              class="mt-2 w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all duration-200 shadow-md"
            >
              Track Order
            </button>
          </div>
          <div id="track-order-result" class="mt-4 text-sm hidden"></div>
        </div>
      </div>
    </div>
  `;

  // Update header badges
  updateHeaderBadges();

  // Attach event listeners
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      const product = window.PRODUCTS.find(p => p.id === id);

      switch (action) {
        case 'remove-wishlist':
          window.Store.toggleWishlist(id);
          showToast(`Removed ${product.name.slice(0, 24)}... from Wishlist`, 'info');
          renderWishlistPage();
          break;
        case 'add-to-cart':
          window.Store.addToCart(product, 1);
          showToast(`Added ${product.name.slice(0, 24)}... to Cart!`, 'success');
          openCartDrawer();
          break;
        case 'quickview':
          openQuickViewModal(product);
          break;
      }
    });
  });

  // Track order button
  const trackOrderBtn = document.getElementById('track-order-btn');
  const trackOrderInput = document.getElementById('track-order-input');
  const trackOrderResult = document.getElementById('track-order-result');

  if (trackOrderBtn && trackOrderInput && trackOrderResult) {
    trackOrderBtn.addEventListener('click', () => {
      const orderId = trackOrderInput.value.trim();
      if (!orderId) {
        trackOrderResult.className = 'mt-2 text-sm text-rose-500 font-semibold';
        trackOrderResult.textContent = 'Please enter an order ID.';
        trackOrderResult.classList.remove('hidden');
        return;
      }

      const order = window.Store.getOrder(orderId);
      if (order) {
        trackOrderResult.className = 'mt-2 text-emerald-600 font-semibold';
        trackOrderResult.innerHTML = `
          <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 mb-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-emerald-800 dark:text-emerald-300 font-semibold">Order #${order.id}</span>
              <span class="text-xs text-emerald-600">${order.status}</span>
            </div>
            <p class="text-[11px] text-emerald-700 dark:text-emerald-300">${order.date}</p>
            <div class="space-y-1">
              ${order.timeline.map(stage => `
                <div class="flex items-center gap-2 px-1 py-0.5 rounded text-[10px] ${stage.done ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-amber-100 dark:bg-amber-950/40'}">
                  <span class="w-3 h-0.5 border-t-2 border-${stage.done ? 'emerald-500' : 'amber-500'}"></span>
                  <span class="flex-1 truncate">${stage.stage}</span>
                  <span class="text-[9px] ${stage.done ? 'text-emerald-500' : 'text-amber-500'}">${stage.time}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <p class="text-[11px] text-emerald-700 dark:text-emerald-300 mb-1"><strong>Tracking #:</strong> ${order.trackingNumber}</p>
          <p class="text-[11px] text-emerald-700 dark:text-emerald-300"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        `;
        trackOrderResult.classList.remove('hidden');
      } else {
        trackOrderResult.className = 'mt-2 text-rose-500 font-semibold';
        trackOrderResult.textContent = 'Order not found. Please check the order ID and try again.';
        trackOrderResult.classList.remove('hidden');
      }
    });
  }
}

function renderWishlistPage() {
  const container = document.getElementById('main-content');
  if (!container) return;

  const wishlist = window.Store.getWishlist();
  const products = window.PRODUCTS.filter(p => wishlist.includes(p.id));

  container.innerHTML = `
    <div class="wishlist-page relative">
      <!-- Back/Close Button -->
      <button id="close-wishlist-btn" type="button" onclick="window.location.assign('/')" class="absolute top-0 right-0 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition">
        <i class="fa-solid fa-xmark text-lg"></i>
      </button>

      <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">My Wishlist</h1>

      ${products.length === 0 ? `
        <div class="empty-wishlist text-center py-16">
          <div class="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-3xl mb-4">
            <i class="fa-regular fa-heart"></i>
          </div>
          <h3 class="text-xl font-bold mb-2">Your wishlist is empty</h3>
          <p class="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm mb-6">
            Save your favorite items to your wishlist and they'll appear here.
          </p>
          <a href="/" class="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-all shadow-md">
            Continue Shopping
          </a>
        </div>
      ` : `
        <div class="wishlist-items grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          ${products.map(product => {
            const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            return `
              <div class="wishlist-card relative bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-hidden flex flex-col h-full shadow-sm">
                <!-- Product Badge -->
                <div class="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
                  ${product.badge ? `
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-white shadow-md shimmer-badge">
                      ${product.badge}
                    </span>
                  ` : ''}
                  ${discountPercent > 0 ? `
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                      -${discountPercent}%
                    </span>
                  ` : ''}
                </div>

                <!-- Remove Button -->
                <button
                  data-action="remove-wishlist"
                  data-id="${product.id}"
                  class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-all duration-200"
                  title="Remove from wishlist"
                >
                  <i class="fa-solid fa-trash-can"></i>
                </button>

                <!-- Image Container -->
                <div class="product-img-wrapper aspect-square bg-slate-100 dark:bg-slate-900/60 cursor-pointer overflow-hidden relative" data-action="quickview" data-id="${product.id}">
                  <img
                    src="${product.images[0]}"
                    alt="${product.name}"
                    loading="lazy"
                    class="product-img-primary w-full h-full object-cover object-center"
                  />
                  ${product.images[1] ? `
                    <img
                      src="${product.images[1]}"
                      alt="${product.name} alternate"
                      loading="lazy"
                      class="product-img-hover absolute inset-0 w-full h-full object-cover object-center opacity-0"
                    />
                  ` : ''}
                </div>

                <!-- Content Area -->
                <div class="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span class="font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">${product.brand}</span>
                      <div class="flex items-center gap-1 text-amber-500">
                        <i class="fa-solid fa-star text-[11px]"></i>
                        <span class="font-bold text-slate-800 dark:text-slate-200">${product.rating}</span>
                        <span class="text-[11px] text-slate-400">(${product.reviewCount})</span>
                      </div>
                    </div>

                    <h4
                      class="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 line-clamp-2 hover:text-amber-600 cursor-pointer transition-colors mb-2"
                      data-action="quickview"
                      data-id="${product.id}"
                    >
                      ${product.name}
                    </h4>
                  </div>

                  <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <div class="flex items-baseline gap-2 mb-3">
                      <span class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                        ${window.Store.formatPrice(product.price)}
                      </span>
                      ${product.originalPrice > product.price ? `
                        <span class="text-xs text-slate-400 line-through">
                          ${window.Store.formatPrice(product.originalPrice)}
                        </span>
                      ` : ''}
                    </div>

                    <!-- Add to Cart Button -->
                    <button
                      data-action="add-to-cart"
                      data-id="${product.id}"
                      class="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-slate-900 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-500 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                      <i class="fa-solid fa-bag-shopping"></i>
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;

  // Update header badges
  updateHeaderBadges();

  // Attach event listeners
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      const product = window.PRODUCTS.find(p => p.id === id);

      switch (action) {
        case 'remove-wishlist':
          window.Store.toggleWishlist(id);
          showToast(`Removed ${product.name.slice(0, 24)}... from Wishlist`, 'info');
          renderWishlistPage();
          break;
        case 'add-to-cart':
          window.Store.addToCart(product, 1);
          showToast(`Added ${product.name.slice(0, 24)}... to Cart!`, 'success');
          openCartDrawer();
          break;
        case 'quickview':
          openQuickViewModal(product);
          break;
      }
    });
  });
}

function renderCategories() {
    const container = document.getElementById('category-pills-container');
    if (!container) return;

    container.innerHTML = window.CATEGORIES.map(cat => `
      <button 
        data-category="${cat.id}"
        class="category-pill whitespace-nowrap px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 flex items-center gap-2 border ${
          state.selectedCategory === cat.id
            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400'
        }"
      >
        <i class="fa-solid ${cat.icon}"></i>
        <span>${cat.name}</span>
      </button>
    `).join('');

    container.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedCategory = btn.getAttribute('data-category');
        if (state.isSearchPageActive) {
          returnToHomePage(false);
        }
        renderCategories();
        searchCatalog().catch(() => renderProducts());
      });
    });
  }

  // --- Filter & Product Rendering Engine ---
  function getFilteredProducts() {
    let list = [...window.PRODUCTS];
    if (state.searchResultIds) {
      const matchedIds = new Set(state.searchResultIds);
      list = list.filter(product => matchedIds.has(product.id));
    }

    // Category
    if (state.selectedCategory && state.selectedCategory !== 'all') {
      list = list.filter(p => p.category === state.selectedCategory);
    }

    // Search Query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Price
    list = list.filter(p => p.price >= state.minPrice && p.price <= state.maxPrice);

    // Rating
    if (state.ratingFilter > 0) {
      list = list.filter(p => p.rating >= state.ratingFilter);
    }

    // Toggles
    if (state.onlyInStock) {
      list = list.filter(p => p.inStock && p.stockQuantity > 0);
    }
    if (state.onlyExpress) {
      list = list.filter(p => p.isExpress);
    }

    // Sort
    switch (state.sortBy) {
      case 'price-low':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'discount':
        list.sort((a, b) => {
          const discA = (a.originalPrice - a.price) / a.originalPrice;
          const discB = (b.originalPrice - b.price) / b.originalPrice;
          return discB - discA;
        });
        break;
      case 'featured':
      default:
        // Featured default order
        break;
    }

    return list;
  }

  function renderProducts() {
    const grid = document.getElementById('products-grid');
    const countEl = document.getElementById('products-count');
    if (!grid) return;

    const filtered = getFilteredProducts();

    if (countEl) {
      countEl.textContent = `Showing ${filtered.length} of ${window.PRODUCTS.length} curated products`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <div class="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-3xl mb-4">
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <h3 class="text-xl font-bold mb-2">No matching items found</h3>
          <p class="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm mb-6">
            We couldn't find any products matching your current filters. Try expanding your price range or clearing selected categories.
          </p>
          <button id="reset-all-filters-btn" class="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-all shadow-md">
            Reset All Filters
          </button>
        </div>
      `;

      const resetBtn = document.getElementById('reset-all-filters-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
      }
      return;
    }

    // Grid vs List mode classes
    if (state.viewMode === 'list') {
      grid.className = 'grid grid-cols-1 gap-6';
    } else {
      grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
    }

    grid.innerHTML = filtered.map(product => {
      const isWish = window.Store.isInWishlist(product.id);
      const isComp = window.Store.isInCompare(product.id);
      const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      const cartItem = window.Store.getCart().find(i => i.productId === product.id);

      if (state.viewMode === 'list') {
        return renderProductListCard(product, isWish, isComp, discountPercent, cartItem);
      }
      return renderProductGridCard(product, isWish, isComp, discountPercent, cartItem);
    }).join('');

    attachProductCardEvents(grid);
  }

  function renderProductGridCard(product, isWish, isComp, discountPercent, cartItem) {
    return `
      <div 
        data-product-id="${product.id}"
        class="product-card group relative bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-hidden flex flex-col h-full shadow-sm"
      >
        <!-- Product Badge -->
        <div class="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
          ${product.badge ? `
            <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-white shadow-md shimmer-badge">
              ${product.badge}
            </span>
          ` : ''}
          ${discountPercent > 0 ? `
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
              -${discountPercent}%
            </span>
          ` : ''}
        </div>

        <!-- Quick Action Floating Buttons -->
        <div class="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <button 
            data-action="wishlist" 
            data-id="${product.id}"
            title="${isWish ? 'Remove from wishlist' : 'Add to wishlist'}"
            class="w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-md flex items-center justify-center text-sm transition-all duration-200 ${
              isWish ? 'text-rose-500 hover:scale-110' : 'text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:scale-110'
            }"
          >
            <i class="${isWish ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
          </button>
          <button 
            data-action="compare" 
            data-id="${product.id}"
            title="Compare specifications"
            class="w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-md flex items-center justify-center text-sm transition-all duration-200 ${
              isComp ? 'text-amber-500' : 'text-slate-600 dark:text-slate-300 hover:text-amber-500'
            }"
          >
            <i class="fa-solid fa-code-compare"></i>
          </button>
          <button 
            data-action="quickview" 
            data-id="${product.id}"
            title="Quick view preview"
            class="w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-md flex items-center justify-center text-sm text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:scale-110 transition-all duration-200"
          >
            <i class="fa-regular fa-eye"></i>
          </button>
        </div>

        <!-- Image Container with secondary hover swap -->
        <div class="product-img-wrapper aspect-square bg-slate-100 dark:bg-slate-900/60 cursor-pointer overflow-hidden relative" data-action="quickview" data-id="${product.id}">
          <img 
            src="${product.images[0]}" 
            alt="${product.name}" 
            loading="lazy"
            class="product-img-primary w-full h-full object-cover object-center"
          />
          ${product.images[1] ? `
            <img 
              src="${product.images[1]}" 
              alt="${product.name} alternate" 
              loading="lazy"
              class="product-img-hover absolute inset-0 w-full h-full object-cover object-center opacity-0"
            />
          ` : ''}

          ${product.isExpress ? `
            <div class="absolute bottom-2 left-2 z-10 bg-slate-900/80 backdrop-blur-sm text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
              <i class="fa-solid fa-bolt text-[9px]"></i> 24h Express
            </div>
          ` : ''}
        </div>

        <!-- Content Area -->
        <div class="p-4 sm:p-5 flex flex-col flex-1 justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span class="font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">${product.brand}</span>
              <div class="flex items-center gap-1 text-amber-500">
                <i class="fa-solid fa-star text-[11px]"></i>
                <span class="font-bold text-slate-800 dark:text-slate-200">${product.rating}</span>
                <span class="text-[11px] text-slate-400">(${product.reviewCount})</span>
              </div>
            </div>

            <h4 
              class="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 line-clamp-2 hover:text-amber-600 cursor-pointer transition-colors mb-2"
              data-action="quickview" 
              data-id="${product.id}"
            >
              ${product.name}
            </h4>
            ${(() => {
              if (product.fitType !== 'tops' || !window.Store.compareFitWithProduct) return '';
              const fitComp = window.Store.compareFitWithProduct(product);
              if (!fitComp) return '';
              return `
                <div class="mb-2 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between text-[11px] cursor-pointer hover:border-amber-400 transition" data-action="quickview" data-id="${product.id}">
                  <span class="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold truncate">
                    <i class="fa-solid fa-shirt text-amber-600"></i>
                    <span class="truncate">Fit: Best <strong>${fitComp.bestSize}</strong></span>
                  </span>
                  <span class="font-extrabold text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded-full shrink-0">${fitComp.matchScore}%</span>
                </div>
              `;
            })()}
          </div>

          <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <div class="flex items-baseline gap-2 mb-3">
              <span class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                ${window.Store.formatPrice(product.price)}
              </span>
              ${product.originalPrice > product.price ? `
                <span class="text-xs text-slate-400 line-through">
                  ${window.Store.formatPrice(product.originalPrice)}
                </span>
              ` : ''}
            </div>

            <!-- Add to Cart or Stepper -->
            ${cartItem ? `
              <div class="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl p-1">
                <button 
                  data-action="qty-decrease" 
                  data-cart-item-id="${cartItem.cartItemId}"
                  class="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-amber-600 font-bold flex items-center justify-center hover:bg-amber-100 dark:hover:bg-slate-700 transition"
                >
                  <i class="fa-solid fa-minus text-xs"></i>
                </button>
                <span class="font-bold text-sm text-slate-800 dark:text-slate-100 px-2">${cartItem.quantity} in Cart</span>
                <button 
                  data-action="qty-increase" 
                  data-cart-item-id="${cartItem.cartItemId}"
                  class="w-8 h-8 rounded-lg bg-amber-600 text-white font-bold flex items-center justify-center hover:bg-amber-700 transition"
                >
                  <i class="fa-solid fa-plus text-xs"></i>
                </button>
              </div>
            ` : `
              <button 
                data-action="add-to-cart" 
                data-id="${product.id}"
                class="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-slate-900 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-500 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                <i class="fa-solid fa-bag-shopping"></i>
                <span>Add to Cart</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function renderProductListCard(product, isWish, isComp, discountPercent, cartItem) {
    return `
      <div 
        data-product-id="${product.id}"
        class="product-card group relative bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row shadow-sm"
      >
        <div class="w-full md:w-64 h-52 md:h-auto bg-slate-100 dark:bg-slate-900 relative cursor-pointer" data-action="quickview" data-id="${product.id}">
          <img src="${product.images[0]}" alt="${product.name}" class="w-full h-full object-cover">
          ${product.badge ? `
            <span class="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white">
              ${product.badge}
            </span>
          ` : ''}
        </div>

        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span class="font-bold uppercase tracking-wider text-amber-600">${product.brand}</span>
              <div class="flex items-center gap-1 text-amber-500">
                <i class="fa-solid fa-star text-xs"></i>
                <span class="font-bold text-slate-800 dark:text-slate-200">${product.rating}</span>
                <span class="text-xs text-slate-400">(${product.reviewCount} verified reviews)</span>
              </div>
            </div>
            <h4 class="font-bold text-lg text-slate-800 dark:text-slate-100 hover:text-amber-600 cursor-pointer mb-2" data-action="quickview" data-id="${product.id}">
              ${product.name}
            </h4>
            ${(() => {
              if (product.fitType !== 'tops' || !window.Store.compareFitWithProduct) return '';
              const fitComp = window.Store.compareFitWithProduct(product);
              if (!fitComp) return '';
              return `
                <div class="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs cursor-pointer hover:border-amber-400 transition" data-action="quickview" data-id="${product.id}">
                  <span class="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold">
                    <i class="fa-solid fa-shirt text-amber-600"></i>
                    <span>Compare With What I Own: Recommended Size <strong class="text-amber-600">${fitComp.bestSize}</strong></span>
                  </span>
                  <span class="font-extrabold text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">${fitComp.matchScore}% Match</span>
                </div>
              `;
            })()}
            <p class="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4">
              ${product.description}
            </p>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900 dark:text-white">
                ${window.Store.formatPrice(product.price)}
              </span>
              ${product.originalPrice > product.price ? `
                <span class="text-sm text-slate-400 line-through">
                  ${window.Store.formatPrice(product.originalPrice)}
                </span>
                <span class="text-xs font-bold text-rose-600">Save ${discountPercent}%</span>
              ` : ''}
            </div>

            <div class="flex items-center gap-3">
              <button 
                data-action="wishlist" 
                data-id="${product.id}"
                class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 ${isWish ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' : 'text-slate-500 hover:text-rose-500'}"
              >
                <i class="${isWish ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
              </button>
              <button 
                data-action="compare" 
                data-id="${product.id}"
                class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 ${isComp ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'text-slate-500 hover:text-amber-500'}"
              >
                <i class="fa-solid fa-code-compare"></i>
              </button>
              <button 
                data-action="add-to-cart" 
                data-id="${product.id}"
                class="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-slate-900 dark:bg-amber-600 hover:bg-amber-600 transition shadow flex items-center gap-2"
              >
                <i class="fa-solid fa-bag-shopping"></i>
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function attachProductCardEvents(container) {
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        const product = window.PRODUCTS.find(p => p.id === id);

        switch (action) {
          case 'wishlist':
            const addedWish = window.Store.toggleWishlist(id);
            showToast(
              addedWish ? `Added ${product.name.slice(0, 24)}... to Wishlist ❤️` : `Removed from Wishlist`,
              addedWish ? 'success' : 'info'
            );
            break;
          case 'compare':
            const compRes = window.Store.toggleCompare(id);
            if (compRes.success) {
              showToast(
                compRes.added ? `Added to comparison matrix ⚖️` : `Removed from comparison`,
                'info'
              );
              openCompareDrawer();
            } else {
              showToast(compRes.message, 'warning');
            }
            break;
          case 'quickview':
            openQuickViewModal(product);
            break;
          case 'add-to-cart':
            window.Store.addToCart(product, 1);
            showToast(`Added ${product.name.slice(0, 24)}... to Cart 🛍️`, 'success');
            openCartDrawer();
            break;
          case 'qty-increase':
            const cartItemIdInc = btn.getAttribute('data-cart-item-id');
            const itemInc = window.Store.getCart().find(i => i.cartItemId === cartItemIdInc);
            if (itemInc) window.Store.updateCartQty(cartItemIdInc, itemInc.quantity + 1);
            break;
          case 'qty-decrease':
            const cartItemIdDec = btn.getAttribute('data-cart-item-id');
            const itemDec = window.Store.getCart().find(i => i.cartItemId === cartItemIdDec);
            if (itemDec) window.Store.updateCartQty(cartItemIdDec, itemDec.quantity - 1);
            break;
        }
      });
    });
  }

  // --- Header Badges Update ---
  function updateHeaderBadges() {
    const cartCount = window.Store.getCartCount();
    const wishCount = window.Store.getWishlist().length;
    const compCount = window.Store.getCompare().length;
    const lockerCount = (window.Store.getOwnedItems ? window.Store.getOwnedItems() : []).length;

    const cartBadge = document.getElementById('cart-badge');
    const wishBadge = document.getElementById('wishlist-badge');
    const compBadge = document.getElementById('compare-badge');
    const lockerBadge = document.getElementById('fit-locker-badge');
    const mobileCartBadge = document.getElementById('mobile-cart-badge');
    const mobileWishBadge = document.getElementById('mobile-wishlist-badge');
    const mobileLockerBadge = document.getElementById('mobile-fitlocker-badge');

    if (cartBadge) {
      cartBadge.textContent = cartCount;
      cartBadge.classList.toggle('hidden', cartCount === 0);
    }
    if (mobileCartBadge) {
      mobileCartBadge.textContent = cartCount;
      mobileCartBadge.classList.toggle('hidden', cartCount === 0);
    }
    if (wishBadge) {
      wishBadge.textContent = wishCount;
      wishBadge.classList.toggle('hidden', wishCount === 0);
    }
    if (mobileWishBadge) {
      mobileWishBadge.textContent = wishCount;
      mobileWishBadge.classList.toggle('hidden', wishCount === 0);
    }
    if (compBadge) {
      compBadge.textContent = compCount;
      compBadge.classList.toggle('hidden', compCount === 0);
    }
    if (lockerBadge) {
      lockerBadge.textContent = lockerCount;
      lockerBadge.classList.toggle('hidden', lockerCount === 0);
    }
    if (mobileLockerBadge) {
      mobileLockerBadge.textContent = lockerCount;
      mobileLockerBadge.classList.toggle('hidden', lockerCount === 0);
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Search & Voice Recognition ---
  function initSearchAndVoice() {
    const searchInput = document.getElementById('search-input');
    const searchDropdown = document.getElementById('search-autocomplete-dropdown');
    const voiceBtn = document.getElementById('voice-search-btn');
    const clearBtn = document.getElementById('search-clear-btn');
    const searchIconBtn = document.getElementById('search-icon-btn');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const mobileSearchIconBtn = document.getElementById('mobile-search-icon-btn');
    let searchTimer;

    // Keyboard shortcut '/' or Ctrl+K to focus search
    window.addEventListener('keydown', (e) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && document.activeElement !== searchInput && document.activeElement !== mobileSearchInput) {
        e.preventDefault();
        searchInput?.focus();
      }
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        state.searchQuery = val;
        if (clearBtn) clearBtn.classList.toggle('hidden', !val);

        if (val.trim().length >= 2) {
          showSearchAutocomplete(val, searchDropdown);
        } else {
          if (searchDropdown) searchDropdown.classList.add('hidden');
        }

        if (state.isSearchPageActive) {
          clearTimeout(searchTimer);
          searchTimer = setTimeout(() => {
            if (val.trim()) navigateToSearchPage(val, true);
          }, 400);
        }
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const query = searchInput.value.trim();
          if (query) {
            if (searchDropdown) searchDropdown.classList.add('hidden');
            navigateToSearchPage(query, true);
          }
        } else if (e.key === 'Escape') {
          if (searchDropdown) searchDropdown.classList.add('hidden');
        }
      });

      searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2 && searchDropdown) {
          showSearchAutocomplete(searchInput.value, searchDropdown);
        }
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('#search-wrapper') && searchDropdown) {
          searchDropdown.classList.add('hidden');
        }
      });
    }

    if (searchIconBtn && searchInput) {
      searchIconBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
          if (searchDropdown) searchDropdown.classList.add('hidden');
          navigateToSearchPage(query, true);
        } else {
          searchInput.focus();
        }
      });
    }

    if (mobileSearchInput) {
      mobileSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const query = mobileSearchInput.value.trim();
          if (query) {
            navigateToSearchPage(query, true);
          }
        }
      });
    }

    if (mobileSearchIconBtn && mobileSearchInput) {
      mobileSearchIconBtn.addEventListener('click', () => {
        const query = mobileSearchInput.value.trim();
        if (query) {
          navigateToSearchPage(query, true);
        } else {
          mobileSearchInput.focus();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (mobileSearchInput) mobileSearchInput.value = '';
        clearBtn.classList.add('hidden');
        if (searchDropdown) searchDropdown.classList.add('hidden');
        if (state.isSearchPageActive) {
          returnToHomePage(true);
        } else {
          state.searchQuery = '';
          state.searchResultIds = null;
          renderProducts();
          searchInput?.focus();
        }
      });
    }

    // Voice Search with Web Speech API
    if (voiceBtn) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

        voiceBtn.addEventListener('click', () => {
          try {
            voiceBtn.classList.add('text-rose-500', 'animate-pulse');
            showToast('Listening... Speak product name now 🎙️', 'info');
            recognition.start();
          } catch (err) {
            console.warn('Speech recognition start error:', err);
          }
        });

        recognition.onresult = (event) => {
          const spoken = event.results[0][0].transcript;
          if (searchInput) searchInput.value = spoken;
          if (mobileSearchInput) mobileSearchInput.value = spoken;
          if (clearBtn) clearBtn.classList.remove('hidden');
          showToast(`Voice Search: "${spoken}"`, 'success');
          navigateToSearchPage(spoken, true);
        };

        recognition.onerror = () => {
          voiceBtn.classList.remove('text-rose-500', 'animate-pulse');
          showToast('Could not detect voice. Please try typing.', 'warning');
        };

        recognition.onend = () => {
          voiceBtn.classList.remove('text-rose-500', 'animate-pulse');
        };
      } else {
        voiceBtn.addEventListener('click', () => {
          showToast('Voice Search is not supported in this browser version.', 'warning');
        });
      }
    }

    initSearchResultsPageControls();
  }

  function showSearchAutocomplete(query, dropdown) {
    if (!dropdown) return;
    const q = query.toLowerCase();
    const matches = window.PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    ).slice(0, 5);

    if (matches.length === 0) {
      dropdown.classList.add('hidden');
      return;
    }

    dropdown.innerHTML = `
      <div class="p-2 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
        <span>Suggested Products (${matches.length})</span>
        <span class="text-[10px] text-amber-600">Press Esc to close</span>
      </div>
      <div class="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-80 overflow-y-auto">
        ${matches.map(p => `
          <div 
            data-search-id="${p.id}"
            class="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition"
          >
            <img src="${p.images[0]}" class="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700" alt="${escapeHtml(p.name)}">
            <div class="flex-1 min-w-0">
              <div class="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">${escapeHtml(p.brand)}</div>
              <div class="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">${escapeHtml(p.name)}</div>
              <div class="text-xs font-bold text-slate-900 dark:text-white">${window.Store.formatPrice(p.price)}</div>
            </div>
            <i class="fa-solid fa-arrow-right text-xs text-slate-400"></i>
          </div>
        `).join('')}
      </div>
      <div id="autocomplete-view-all-row" class="p-3 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300 border-t border-amber-200/50 dark:border-amber-800/50 transition">
        <span class="flex items-center gap-2">
          <i class="fa-solid fa-magnifying-glass"></i>
          <span>View all results for "<strong>${escapeHtml(query)}</strong>" (Press Enter)</span>
        </span>
        <i class="fa-solid fa-arrow-right text-xs"></i>
      </div>
    `;

    dropdown.querySelectorAll('[data-search-id]').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-search-id');
        const prod = window.PRODUCTS.find(p => p.id === id);
        dropdown.classList.add('hidden');
        openQuickViewModal(prod);
      });
    });

    const viewAllBtn = dropdown.querySelector('#autocomplete-view-all-row');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        dropdown.classList.add('hidden');
        navigateToSearchPage(query, true);
      });
    }

    dropdown.classList.remove('hidden');
  }

  // --- Dedicated Search Results Page Handlers ---
  async function navigateToSearchPage(query, updateHistory = true) {
    const q = String(query || '').trim();
    if (!q) return;

    state.searchQuery = q;
    state.isSearchPageActive = true;

    const searchInput = document.getElementById('search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const searchDropdown = document.getElementById('search-autocomplete-dropdown');
    const clearBtn = document.getElementById('search-clear-btn');
    if (searchInput) searchInput.value = q;
    if (mobileSearchInput) mobileSearchInput.value = q;
    if (searchDropdown) searchDropdown.classList.add('hidden');
    if (clearBtn) clearBtn.classList.remove('hidden');

    if (updateHistory) {
      const url = new URL(window.location);
      url.searchParams.set('search', q);
      window.history.pushState({ page: 'search', query: q }, '', url.toString());
    }

    const homeSections = document.getElementById('home-view-sections');
    const searchSection = document.getElementById('search-results-section');
    if (homeSections) homeSections.classList.add('hidden');
    if (searchSection) searchSection.classList.remove('hidden');

    const queryDisplay = document.getElementById('search-query-display');
    const pillText = document.getElementById('search-pill-text');
    if (queryDisplay) queryDisplay.textContent = `"${q}"`;
    if (pillText) pillText.textContent = q;

    const summaryEl = document.getElementById('search-results-summary');
    const countBadge = document.getElementById('search-results-count-badge');
    if (summaryEl) summaryEl.textContent = `Searching for "${q}" across our catalog...`;
    if (countBadge) countBadge.textContent = 'Searching...';

    window.scrollTo({ top: 0, behavior: 'smooth' });

    await fetchAndRenderSearchResults(q);
  }

  function returnToHomePage(updateHistory = true) {
    state.isSearchPageActive = false;
    state.searchQuery = '';
    state.searchResultIds = null;
    state.searchPageResults = [];

    const searchInput = document.getElementById('search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    const searchDropdown = document.getElementById('search-autocomplete-dropdown');
    if (searchInput) searchInput.value = '';
    if (mobileSearchInput) mobileSearchInput.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    if (searchDropdown) searchDropdown.classList.add('hidden');

    if (updateHistory) {
      const url = new URL(window.location);
      url.searchParams.delete('search');
      url.searchParams.delete('q');
      window.history.pushState({ page: 'home' }, '', url.pathname + (url.search ? url.search : ''));
    }

    const homeSections = document.getElementById('home-view-sections');
    const searchSection = document.getElementById('search-results-section');
    if (searchSection) searchSection.classList.add('hidden');
    if (homeSections) homeSections.classList.remove('hidden');

    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function fetchAndRenderSearchResults(query) {
    let products = [];
    const qLower = query.toLowerCase();

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          products = data.products;
        }
      }
    } catch (err) {
      console.warn('OpenSearch query error, using local catalog search:', err);
    }

    // Complement / fallback with local search to guarantee items like "shirt" match
    const localMatches = window.PRODUCTS.filter(p => {
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const city = (p.city || '').toString().toLowerCase();
      return name.includes(qLower) || brand.includes(qLower) || desc.includes(qLower) || cat.includes(qLower) || city.includes(qLower);
    });

    // Merge without duplicates
    const seen = new Set(products.map(p => p.id));
    for (const p of localMatches) {
      if (!seen.has(p.id)) {
        products.push(p);
        seen.add(p.id);
      }
    }

    state.searchPageResults = products;
    renderSearchResultsGrid();
  }

  function renderSearchResultsGrid() {
    const grid = document.getElementById('search-results-grid');
    const countBadge = document.getElementById('search-results-count-badge');
    const summaryEl = document.getElementById('search-results-summary');
    if (!grid) return;

    let list = [...state.searchPageResults];

    // Apply search sort
    switch (state.searchPageSort) {
      case 'price-low':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'discount':
        list.sort((a, b) => {
          const discA = (a.originalPrice - a.price) / a.originalPrice;
          const discB = (b.originalPrice - b.price) / b.originalPrice;
          return discB - discA;
        });
        break;
      case 'featured':
      default:
        break;
    }

    if (countBadge) {
      countBadge.textContent = `${list.length} Product${list.length !== 1 ? 's' : ''} Found`;
    }
    if (summaryEl) {
      summaryEl.textContent = list.length
        ? `Showing ${list.length} product${list.length !== 1 ? 's' : ''} matching "${state.searchQuery}" from our catalog.`
        : `No products found matching "${state.searchQuery}".`;
    }

    if (list.length === 0) {
      grid.className = 'grid grid-cols-1 gap-6';
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <div class="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-3xl mb-4 shadow-sm">
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <h3 class="text-xl font-bold mb-2 text-slate-900 dark:text-white">No products found for "${escapeHtml(state.searchQuery)}"</h3>
          <p class="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm mb-6">
            We couldn't find an exact match. Try checking for typos, or browse by popular search terms below:
          </p>
          <div class="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-lg mx-auto">
            ${['Shirts', 'Silk Saree', 'Coffee', 'Headphones', 'MacBook', 'Kurta', 'Brass'].map(term => `
              <button type="button" data-search-quick="${term}" class="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700/80 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 text-xs font-semibold transition border border-slate-200 dark:border-slate-600">
                ${term}
              </button>
            `).join('')}
          </div>
          <button id="search-empty-return-btn" type="button" class="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-all shadow-md">
            Explore Full Store
          </button>
        </div>
      `;
      grid.querySelectorAll('[data-search-quick]').forEach(btn => {
        btn.addEventListener('click', () => {
          const term = btn.getAttribute('data-search-quick');
          navigateToSearchPage(term, true);
        });
      });
      const returnBtn = grid.querySelector('#search-empty-return-btn');
      if (returnBtn) returnBtn.addEventListener('click', () => returnToHomePage(true));
      return;
    }

    if (state.searchPageViewMode === 'list') {
      grid.className = 'grid grid-cols-1 gap-6';
    } else {
      grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
    }

    grid.innerHTML = list.map(product => {
      const isWish = window.Store.isInWishlist(product.id);
      const isComp = window.Store.isInCompare(product.id);
      const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      const cartItem = window.Store.getCart().find(i => i.productId === product.id);

      if (state.searchPageViewMode === 'list') {
        return renderProductListCard(product, isWish, isComp, discountPercent, cartItem);
      }
      return renderProductGridCard(product, isWish, isComp, discountPercent, cartItem);
    }).join('');

    attachProductCardEvents(grid);
  }

  function initSearchResultsPageControls() {
    const backBtn = document.getElementById('search-back-home-btn');
    const clearAllBtn = document.getElementById('search-clear-all-btn');
    const pillClearBtn = document.getElementById('search-pill-clear-btn');
    const logoLink = document.getElementById('brand-logo-link');
    const sortSelect = document.getElementById('search-sort-select');
    const gridBtn = document.getElementById('search-view-grid-btn');
    const listBtn = document.getElementById('search-view-list-btn');

    if (backBtn) backBtn.addEventListener('click', () => returnToHomePage(true));
    if (clearAllBtn) clearAllBtn.addEventListener('click', () => returnToHomePage(true));
    if (pillClearBtn) pillClearBtn.addEventListener('click', () => returnToHomePage(true));
    if (logoLink) {
      logoLink.addEventListener('click', (e) => {
        e.preventDefault();
        returnToHomePage(true);
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.searchPageSort = e.target.value;
        renderSearchResultsGrid();
      });
    }

    if (gridBtn && listBtn) {
      gridBtn.addEventListener('click', () => {
        state.searchPageViewMode = 'grid';
        gridBtn.className = 'p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 transition';
        listBtn.className = 'p-2 rounded-lg text-slate-400 hover:text-slate-600 transition';
        renderSearchResultsGrid();
      });
      listBtn.addEventListener('click', () => {
        state.searchPageViewMode = 'list';
        listBtn.className = 'p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 transition';
        gridBtn.className = 'p-2 rounded-lg text-slate-400 hover:text-slate-600 transition';
        renderSearchResultsGrid();
      });
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get('search') || urlParams.get('q');
      if (searchParam) {
        navigateToSearchPage(searchParam, false);
      } else if (state.isSearchPageActive) {
        returnToHomePage(false);
      }
    });

    // Check URL query on initial load
    const initialUrlParams = new URLSearchParams(window.location.search);
    const initialQuery = initialUrlParams.get('search') || initialUrlParams.get('q');
    if (initialQuery) {
      navigateToSearchPage(initialQuery, false);
    }
  }

  // --- Cart Drawer Implementation ---
  function initCartDrawer() {
    const drawerBackdrop = document.getElementById('cart-drawer-backdrop');
    const drawerPanel = document.getElementById('cart-drawer-panel');
    const openBtns = [document.getElementById('cart-btn'), document.getElementById('mobile-cart-btn')];
    const closeBtn = document.getElementById('cart-drawer-close-btn');

    openBtns.forEach(btn => {
      if (btn) btn.addEventListener('click', openCartDrawer);
    });

    if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);

    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', (e) => {
        if (e.target === drawerBackdrop) closeCartDrawer();
      });
    }

    // Checkout button inside drawer
    const proceedCheckoutBtn = document.getElementById('cart-proceed-checkout-btn');
    if (proceedCheckoutBtn) {
      proceedCheckoutBtn.addEventListener('click', () => {
        if (window.Store.getCart().length === 0) {
          showToast('Your cart is empty!', 'warning');
          return;
        }
        closeCartDrawer();
        openCheckoutModal();
      });
    }

    // Coupon Apply inside drawer
    const couponInput = document.getElementById('cart-coupon-input');
    const applyCouponBtn = document.getElementById('cart-apply-coupon-btn');
    if (applyCouponBtn && couponInput) {
      applyCouponBtn.addEventListener('click', () => {
        const res = window.Store.applyCoupon(couponInput.value);
        showToast(res.message, res.success ? 'success' : 'warning');
        if (res.success) {
          couponInput.value = '';
          renderCartDrawerContent();
        }
      });
    }
  }

  function openCartDrawer() {
    const backdrop = document.getElementById('cart-drawer-backdrop');
    const panel = document.getElementById('cart-drawer-panel');
    if (backdrop && panel) {
      renderCartDrawerContent();
      backdrop.classList.add('active');
      panel.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCartDrawer() {
    const backdrop = document.getElementById('cart-drawer-backdrop');
    const panel = document.getElementById('cart-drawer-panel');
    if (backdrop && panel) {
      backdrop.classList.remove('active');
      panel.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function renderCartDrawerContent() {
    const itemsContainer = document.getElementById('cart-drawer-items');
    const subtotalEl = document.getElementById('cart-subtotal-val');
    const discountRow = document.getElementById('cart-discount-row');
    const discountVal = document.getElementById('cart-discount-val');
    const shippingEl = document.getElementById('cart-shipping-val');
    const totalEl = document.getElementById('cart-total-val');
    const freeShippingProgress = document.getElementById('free-shipping-progress');
    const freeShippingText = document.getElementById('free-shipping-text');
    const activeCouponBadge = document.getElementById('active-coupon-badge');

    if (!itemsContainer) return;

    const cart = window.Store.getCart();

    // Free Shipping Progress
    const subtotal = window.Store.getCartSubtotal();
    const threshold = 999;
    if (freeShippingProgress && freeShippingText) {
      if (subtotal >= threshold) {
        freeShippingProgress.style.width = '100%';
        freeShippingProgress.className = 'h-full bg-emerald-500 transition-all duration-300';
        freeShippingText.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 font-bold"><i class="fa-solid fa-circle-check"></i> Congratulations! You unlocked FREE Express Shipping!</span>`;
      } else {
        const percent = Math.min(100, Math.round((subtotal / threshold) * 100));
        freeShippingProgress.style.width = percent + '%';
        freeShippingProgress.className = 'h-full bg-amber-500 transition-all duration-300';
        const needed = threshold - subtotal;
        freeShippingText.innerHTML = `Add <strong class="text-amber-600 dark:text-amber-400">${window.Store.formatPrice(needed)}</strong> more for <strong>FREE Shipping</strong>!`;
      }
    }

    // Active Coupon Badge
    if (activeCouponBadge) {
      const activeCoup = window.Store.state.appliedCoupon;
      if (activeCoup) {
        activeCouponBadge.innerHTML = `
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 text-xs">
            <span class="text-emerald-800 dark:text-emerald-300 font-semibold">
              <i class="fa-solid fa-tag mr-1"></i> Coupon <strong>${activeCoup.code}</strong> applied
            </span>
            <button id="remove-coupon-btn" class="text-rose-500 hover:text-rose-700 font-bold ml-2">Remove</button>
          </div>
        `;
        const removeBtn = document.getElementById('remove-coupon-btn');
        if (removeBtn) {
          removeBtn.addEventListener('click', () => {
            window.Store.removeCoupon();
            showToast('Coupon removed', 'info');
          });
        }
        activeCouponBadge.classList.remove('hidden');
      } else {
        activeCouponBadge.classList.add('hidden');
      }
    }

    if (cart.length === 0) {
      itemsContainer.innerHTML = `
        <div class="h-64 flex flex-col items-center justify-center text-center p-6">
          <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-2xl mb-3">
            <i class="fa-solid fa-basket-shopping"></i>
          </div>
          <h4 class="font-bold text-slate-700 dark:text-slate-200 mb-1">Your cart is empty</h4>
          <p class="text-xs text-slate-400 mb-4">Discover our handcrafted silks, single-estate kaapi, or pro electronics.</p>
          <button onclick="document.getElementById('cart-drawer-close-btn').click()" class="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold">
            Start Shopping
          </button>
        </div>
      `;
    } else {
      itemsContainer.innerHTML = cart.map(item => `
        <div class="flex gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 relative group">
          <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg flex-shrink-0 border border-slate-200 dark:border-slate-700">
          <div class="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start gap-2">
                <h5 class="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">${item.name}</h5>
                <button 
                  data-remove-cart="${item.cartItemId}"
                  class="text-slate-400 hover:text-rose-500 transition p-1"
                  title="Remove item"
                >
                  <i class="fa-regular fa-trash-can text-xs"></i>
                </button>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5">
                ${item.selectedSize ? `<span>Size: ${item.selectedSize}</span>` : ''}
                ${item.selectedColor ? `<span class="ml-2">Color: ${item.selectedColor}</span>` : ''}
              </div>
            </div>

            <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span class="font-bold text-sm text-slate-900 dark:text-white">
                ${window.Store.formatPrice(item.price * item.quantity)}
              </span>
              <div class="flex items-center bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                <button data-dec-qty="${item.cartItemId}" class="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-l transition text-xs font-bold">-</button>
                <span class="w-7 text-center text-xs font-bold text-slate-800 dark:text-slate-100">${item.quantity}</span>
                <button data-inc-qty="${item.cartItemId}" class="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-r transition text-xs font-bold">+</button>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      // Cart item events
      itemsContainer.querySelectorAll('[data-remove-cart]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-remove-cart');
          window.Store.removeFromCart(id);
          showToast('Item removed from cart', 'info');
        });
      });

      itemsContainer.querySelectorAll('[data-inc-qty]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-inc-qty');
          const it = window.Store.getCart().find(x => x.cartItemId === id);
          if (it) window.Store.updateCartQty(id, it.quantity + 1);
        });
      });

      itemsContainer.querySelectorAll('[data-dec-qty]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-dec-qty');
          const it = window.Store.getCart().find(x => x.cartItemId === id);
          if (it) window.Store.updateCartQty(id, it.quantity - 1);
        });
      });
    }

    // Update Prices
    if (subtotalEl) subtotalEl.textContent = window.Store.formatPrice(window.Store.getCartSubtotal());
    
    const couponDiscount = window.Store.getCouponDiscount();
    if (discountRow && discountVal) {
      if (couponDiscount > 0) {
        discountRow.classList.remove('hidden');
        discountVal.textContent = '-' + window.Store.formatPrice(couponDiscount);
      } else {
        discountRow.classList.add('hidden');
      }
    }

    const shipping = window.Store.getShippingCost();
    if (shippingEl) {
      shippingEl.textContent = shipping === 0 ? 'FREE' : window.Store.formatPrice(shipping);
      if (shipping === 0) shippingEl.className = 'font-bold text-emerald-600';
    }

    if (totalEl) totalEl.textContent = window.Store.formatPrice(window.Store.getCartTotal());
  }

  // --- Quick View & Product Modal ---
  function openQuickViewModal(product) {
    state.activeQuickViewProduct = product;
    window.Store.addRecentlyViewed(product.id);

    const modal = document.getElementById('quickview-modal');
    if (!modal) return;

    let selectedVariant = {
      color: product.variants && product.variants.colors ? product.variants.colors[0].name : null,
      size: product.variants && product.variants.sizes ? product.variants.sizes[0] : null,
      quantity: 1
    };

    const content = document.getElementById('quickview-modal-content');
    content.innerHTML = `
      <div class="relative bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col md:flex-row">
        <!-- Close Button -->
        <button id="quickview-close-btn" class="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <!-- Left: Image Gallery -->
        <div class="w-full md:w-1/2 p-6 flex flex-col justify-between bg-slate-50 dark:bg-slate-900/50">
          <div class="aspect-square rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-4 relative group">
            <img id="qv-main-image" src="${product.images[0]}" alt="${product.name}" class="w-full h-full object-cover transition duration-300">
            ${product.badge ? `
              <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-white shadow">
                ${product.badge}
              </span>
            ` : ''}
          </div>
          <!-- Thumbnails -->
          <div class="flex gap-2.5 overflow-x-auto pb-1">
            ${product.images.map((img, i) => `
              <img 
                src="${img}" 
                alt="thumb" 
                data-qv-thumb="${img}"
                class="w-16 h-16 rounded-xl object-cover cursor-pointer border-2 transition ${
                  i === 0 ? 'border-amber-600' : 'border-transparent opacity-70 hover:opacity-100'
                }"
              />
            `).join('')}
          </div>
        </div>

        <!-- Right: Details, Variants, Tabs -->
        <div class="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between max-h-[90vh]">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span class="font-bold uppercase tracking-wider text-amber-600">${product.brand}</span>
              <div class="flex items-center gap-1 text-amber-500">
                <i class="fa-solid fa-star text-xs"></i>
                <span class="font-bold text-slate-800 dark:text-slate-200">${product.rating}</span>
                <span class="text-xs text-slate-400">(${product.reviewCount} reviews)</span>
              </div>
            </div>

            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-snug">
              ${product.name}
            </h3>

            <!-- Price -->
            <div id="qv-price-box" class="flex items-baseline gap-3 mb-4">
              <span class="text-2xl font-black text-slate-900 dark:text-white">
                ${window.Store.formatPrice(product.price)}
              </span>
              ${product.originalPrice > product.price ? `
                <span class="text-sm text-slate-400 line-through">
                  ${window.Store.formatPrice(product.originalPrice)}
                </span>
                <span class="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                  Save ${window.Store.formatPrice(product.originalPrice - product.price)}
                </span>
              ` : ''}
            </div>

            <!-- Description excerpt -->
            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              ${product.description}
            </p>

            <!-- Color Variants if available -->
            ${product.variants && product.variants.colors ? `
              <div class="mb-4">
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Select Color: <span id="qv-selected-color-name" class="text-amber-600">${selectedVariant.color}</span>
                </label>
                <div class="flex gap-2">
                  ${product.variants.colors.map((c, idx) => `
                    <button 
                      data-qv-color="${c.name}"
                      style="background-color: ${c.hex};"
                      title="${c.name}"
                      class="w-8 h-8 rounded-full border-2 transition-transform ${
                        idx === 0 ? 'border-amber-600 scale-110 shadow-md ring-2 ring-amber-400/40' : 'border-white dark:border-slate-700'
                      }"
                    ></button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Size / Options if available -->
            ${product.variants && product.variants.sizes ? `
              <div class="mb-4">
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Select Size / Storage: <span id="qv-selected-size-name" class="text-amber-600">${selectedVariant.size}</span>
                </label>
                <div class="flex flex-wrap gap-2">
                  ${product.variants.sizes.map((s, idx) => `
                    <button 
                      data-qv-size="${s}"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        idx === 0 
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-bold' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }"
                    >${s}</button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Fit Twin / Compare With What I Own Section -->
            <div id="qv-fit-twin-container" class="mb-4"></div>

            <!-- Delivery Pin Code Checker -->
            <div class="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
              <div class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <i class="fa-solid fa-location-dot text-amber-600"></i>
                <span>Check Delivery & COD Availability</span>
              </div>
              <div class="flex gap-2">
                <input 
                  type="text" 
                  id="pincode-input" 
                  maxlength="6"
                  placeholder="Enter 6-digit Pincode (e.g. 560001)"
                  class="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
                <button id="pincode-check-btn" class="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-600 hover:bg-amber-600 text-white text-xs font-semibold">
                  Check
                </button>
              </div>
              <div id="pincode-result" class="text-[11px] mt-1.5 hidden"></div>
            </div>

            <!-- Tabs: Specifications & Customer Reviews -->
            <div class="border-t border-slate-200 dark:border-slate-700 pt-3">
              <div class="flex border-b border-slate-200 dark:border-slate-700 mb-3 text-xs font-bold">
                <button id="tab-specs-btn" class="pb-2 border-b-2 border-amber-600 text-amber-600 mr-4">Specifications</button>
                <button id="tab-reviews-btn" class="pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-600 mr-4">Reviews (${product.reviews.length})</button>
                <button id="tab-faq-btn" class="pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-600">Shipping & Returns</button>
              </div>

              <!-- Tab Contents -->
              <div id="tab-specs-content" class="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                ${Object.entries(product.specs || {}).map(([key, val]) => `
                  <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                    <span class="font-medium text-slate-400">${key}:</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-100">${val}</span>
                  </div>
                `).join('')}
              </div>

              <div id="tab-reviews-content" class="text-xs space-y-3 hidden">
                <!-- Add Review Form -->
                <div class="p-3 bg-amber-50/60 dark:bg-slate-900/60 rounded-xl border border-amber-200/50 dark:border-slate-700 mb-3">
                  <h6 class="font-bold text-xs text-slate-800 dark:text-slate-100 mb-1">Write a Verified Review</h6>
                  <div class="flex items-center gap-1 mb-2 text-amber-400 text-sm cursor-pointer" id="review-stars-picker">
                    <i class="fa-solid fa-star" data-star="1"></i>
                    <i class="fa-solid fa-star" data-star="2"></i>
                    <i class="fa-solid fa-star" data-star="3"></i>
                    <i class="fa-solid fa-star" data-star="4"></i>
                    <i class="fa-solid fa-star" data-star="5"></i>
                  </div>
                  <input id="rev-title-input" type="text" placeholder="Review headline" class="w-full mb-1.5 px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <textarea id="rev-comment-input" rows="2" placeholder="Share your experience..." class="w-full mb-2 px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"></textarea>
                  <button id="rev-submit-btn" class="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs">
                    Submit Review
                  </button>
                </div>

                <div class="max-h-40 overflow-y-auto space-y-2">
                  ${product.reviews.map(r => `
                    <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-slate-800 dark:text-slate-200">${r.user}</span>
                        <div class="text-amber-500 text-[10px]">
                          ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                        </div>
                      </div>
                      <div class="font-medium text-slate-700 dark:text-slate-300 text-xs">${r.title}</div>
                      <div class="text-[11px] text-slate-500 dark:text-slate-400">${r.comment}</div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div id="tab-faq-content" class="text-xs space-y-2 text-slate-600 dark:text-slate-300 hidden">
                <p><strong>🚚 Express Delivery:</strong> Orders dispatched within 4 hours. Delivered in 24-48 hours across major Indian metro cities.</p>
                <p><strong>🔄 7-Day Easy Returns:</strong> Full refund or hassle-free replacement if damaged, defective, or incorrect size.</p>
                <p><strong>🛡️ 100% Authenticity Guarantee:</strong> Directly sourced from certified regional weavers, artisans, and brand distributors.</p>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3 mt-4">
            <div class="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
              <button id="qv-qty-dec" class="w-8 h-8 rounded-lg font-bold hover:bg-white dark:hover:bg-slate-600 text-sm">-</button>
              <span id="qv-qty-val" class="w-8 text-center font-bold text-sm">1</span>
              <button id="qv-qty-inc" class="w-8 h-8 rounded-lg font-bold hover:bg-white dark:hover:bg-slate-600 text-sm">+</button>
            </div>

            <button 
              id="qv-add-cart-btn"
              class="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold text-sm transition shadow flex items-center justify-center gap-2"
            >
              <i class="fa-solid fa-bag-shopping"></i>
              <span>Add to Cart</span>
            </button>

            <button 
              id="qv-buy-now-btn"
              class="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm transition shadow flex items-center justify-center gap-2"
            >
              <i class="fa-solid fa-bolt"></i>
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Image switch
    const mainImg = document.getElementById('qv-main-image');
    content.querySelectorAll('[data-qv-thumb]').forEach(th => {
      th.addEventListener('click', () => {
        content.querySelectorAll('[data-qv-thumb]').forEach(x => {
          x.classList.remove('border-amber-600');
          x.classList.add('border-transparent', 'opacity-70');
        });
        th.classList.add('border-amber-600');
        th.classList.remove('opacity-70');
        mainImg.src = th.getAttribute('data-qv-thumb');
      });
    });

    // Close
    const closeBtn = document.getElementById('quickview-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeQuickViewModal);
    }
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeQuickViewModal();
    });

    // Quantity
    let qty = 1;
    const qtyVal = document.getElementById('qv-qty-val');
    document.getElementById('qv-qty-inc').addEventListener('click', () => {
      if (qty < product.stockQuantity) {
        qty++;
        qtyVal.textContent = qty;
        selectedVariant.quantity = qty;
      }
    });
    document.getElementById('qv-qty-dec').addEventListener('click', () => {
      if (qty > 1) {
        qty--;
        qtyVal.textContent = qty;
        selectedVariant.quantity = qty;
      }
    });

    // Color Pickers
    content.querySelectorAll('[data-qv-color]').forEach(cBtn => {
      cBtn.addEventListener('click', () => {
        content.querySelectorAll('[data-qv-color]').forEach(b => b.classList.remove('border-amber-600', 'scale-110', 'ring-2'));
        cBtn.classList.add('border-amber-600', 'scale-110', 'ring-2');
        selectedVariant.color = cBtn.getAttribute('data-qv-color');
        document.getElementById('qv-selected-color-name').textContent = selectedVariant.color;
      });
    });

    // Size Pickers
    content.querySelectorAll('[data-qv-size]').forEach(sBtn => {
      sBtn.addEventListener('click', () => {
        content.querySelectorAll('[data-qv-size]').forEach(b => {
          b.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:border-slate-400';
        });
        sBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-600';
        selectedVariant.size = sBtn.getAttribute('data-qv-size');
        state.activeQuickViewSelectedSize = selectedVariant.size;
        document.getElementById('qv-selected-size-name').textContent = selectedVariant.size;
        renderQuickViewFitTwin(product, selectedVariant.size);
      });
    });

    // Initial render of Fit Twin comparison
    state.activeQuickViewSelectedSize = selectedVariant.size;
    renderQuickViewFitTwin(product, selectedVariant.size);

    // Pincode checker
    const pinBtn = document.getElementById('pincode-check-btn');
    const pinInput = document.getElementById('pincode-input');
    const pinRes = document.getElementById('pincode-result');
    if (pinBtn && pinInput && pinRes) {
      pinBtn.addEventListener('click', () => {
        const val = pinInput.value.trim();
        if (/^\d{6}$/.test(val)) {
          pinRes.className = 'text-[11px] mt-1.5 text-emerald-600 font-semibold';
          pinRes.innerHTML = `<i class="fa-solid fa-truck-fast"></i> Delivery to <strong>${val}</strong> by tomorrow, 2:00 PM. Cash on Delivery is available!`;
          pinRes.classList.remove('hidden');
        } else {
          pinRes.className = 'text-[11px] mt-1.5 text-rose-500 font-semibold';
          pinRes.textContent = 'Please enter a valid 6-digit Indian PIN code.';
          pinRes.classList.remove('hidden');
        }
      });
    }

    // Tabs
    const tabSpecsBtn = document.getElementById('tab-specs-btn');
    const tabRevBtn = document.getElementById('tab-reviews-btn');
    const tabFaqBtn = document.getElementById('tab-faq-btn');
    const specCont = document.getElementById('tab-specs-content');
    const revCont = document.getElementById('tab-reviews-content');
    const faqCont = document.getElementById('tab-faq-content');

    function switchTab(activeBtn, activeCont) {
      [tabSpecsBtn, tabRevBtn, tabFaqBtn].forEach(b => {
        b.className = 'pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-600 mr-4';
      });
      [specCont, revCont, faqCont].forEach(c => c.classList.add('hidden'));

      activeBtn.className = 'pb-2 border-b-2 border-amber-600 text-amber-600 mr-4 font-bold';
      activeCont.classList.remove('hidden');
    }

    tabSpecsBtn.addEventListener('click', () => switchTab(tabSpecsBtn, specCont));
    tabRevBtn.addEventListener('click', () => switchTab(tabRevBtn, revCont));
    tabFaqBtn.addEventListener('click', () => switchTab(tabFaqBtn, faqCont));

    // Submit Review
    let pickedRating = 5;
    const starPicker = document.getElementById('review-stars-picker');
    if (starPicker) {
      starPicker.querySelectorAll('[data-star]').forEach(s => {
        s.addEventListener('click', () => {
          pickedRating = Number(s.getAttribute('data-star'));
          starPicker.querySelectorAll('[data-star]').forEach(starIcon => {
            const num = Number(starIcon.getAttribute('data-star'));
            starIcon.className = num <= pickedRating ? 'fa-solid fa-star' : 'fa-regular fa-star';
          });
        });
      });
    }

    const revSubmitBtn = document.getElementById('rev-submit-btn');
    if (revSubmitBtn) {
      revSubmitBtn.addEventListener('click', () => {
        const title = document.getElementById('rev-title-input').value.trim();
        const comment = document.getElementById('rev-comment-input').value.trim();
        if (!title || !comment) {
          showToast('Please provide both headline and details for your review.', 'warning');
          return;
        }

        window.Store.addReview(product.id, {
          rating: pickedRating,
          title,
          comment
        });

        showToast('Thank you! Your verified review has been published.', 'success');
        openQuickViewModal(product); // re-render with updated review
      });
    }

    // Add to Cart from Modal
    document.getElementById('qv-add-cart-btn').addEventListener('click', () => {
      window.Store.addToCart(product, selectedVariant.quantity, {
        selectedColor: selectedVariant.color,
        selectedSize: selectedVariant.size
      });
      showToast(`Added ${product.name.slice(0, 20)}... to Cart!`, 'success');
      closeQuickViewModal();
      openCartDrawer();
    });

    // Buy Now from Modal
    document.getElementById('qv-buy-now-btn').addEventListener('click', () => {
      window.Store.addToCart(product, selectedVariant.quantity, {
        selectedColor: selectedVariant.color,
        selectedSize: selectedVariant.size
      });
      closeQuickViewModal();
      openCheckoutModal();
    });
  }

  function closeQuickViewModal() {
    const modal = document.getElementById('quickview-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      state.activeQuickViewProduct = null;
    }
  }

  function renderQuickViewPrice(product) {
    const priceBox = document.getElementById('qv-price-box');
    if (priceBox) {
      priceBox.innerHTML = `
        <span class="text-2xl font-black text-slate-900 dark:text-white">
          ${window.Store.formatPrice(product.price)}
        </span>
        ${product.originalPrice > product.price ? `
          <span class="text-sm text-slate-400 line-through">
            ${window.Store.formatPrice(product.originalPrice)}
          </span>
          <span class="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
            Save ${window.Store.formatPrice(product.originalPrice - product.price)}
          </span>
        ` : ''}
      `;
    }
  }

  // ==========================================================================
  // "Compare With What I Own" (Fit Twin & Locker) Controllers
  // ==========================================================================

  let currentCameraStream = null;

  function renderQuickViewFitTwin(product, selectedSize, chosenOwnedId = null) {
    const container = document.getElementById('qv-fit-twin-container');
    if (!container) return;

    if (product.fitType !== 'tops' || !product.sizeMeasurements) {
      container.innerHTML = '';
      return;
    }

    const ownedList = window.Store.getOwnedItems ? window.Store.getOwnedItems('tops') : [];
    const defaultOwned = window.Store.getDefaultOwnedItem ? window.Store.getDefaultOwnedItem('tops') : null;
    const activeOwned = chosenOwnedId 
      ? (window.Store.getOwnedItem ? window.Store.getOwnedItem(chosenOwnedId) : null)
      : (defaultOwned || ownedList[0]);

    if (!activeOwned) {
      container.innerHTML = `
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/80 border border-amber-300 dark:border-amber-700/60 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs">
                <i class="fa-solid fa-shirt"></i>
              </span>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100">Compare With What I Own</span>
            </div>
            <span class="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">Fit Locker</span>
          </div>
          <p class="text-xs text-slate-600 dark:text-slate-300 mb-3">
            Not sure about the fit? Upload a photo or use your camera to scan your favorite shirt, and get personalized millimeter comparisons!
          </p>
          <button id="qv-launch-scanner-btn" class="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm">
            <i class="fa-solid fa-camera"></i>
            <span>Scan or Upload My Favorite Shirt</span>
          </button>
        </div>
      `;
      document.getElementById('qv-launch-scanner-btn')?.addEventListener('click', () => {
        openClothScannerModal(product);
      });
      return;
    }

    const comparison = window.Store.compareFitWithProduct(product, selectedSize, activeOwned.id);
    if (!comparison) return;

    const { targetDims, userDims, deltas, matchScore, naturalVerdict, bestSize } = comparison;

    container.innerHTML = `
      <div class="rounded-2xl border border-amber-300/80 dark:border-amber-600/40 bg-amber-50/40 dark:bg-slate-800/70 p-3.5 shadow-sm">
        <!-- Header & Item Selector -->
        <div class="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-amber-200/60 dark:border-slate-700">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs">
              <i class="fa-solid fa-shirt"></i>
            </span>
            <div>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                Compare With What I Own
                <span class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500 text-white">Fit Twin</span>
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <select id="qv-owned-picker" class="text-[11px] font-bold py-1 px-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer">
              ${ownedList.map(item => `
                <option value="${item.id}" ${item.id === activeOwned.id ? 'selected' : ''}>
                  ${item.brand ? item.brand + ' - ' : ''}${item.name}
                </option>
              `).join('')}
              <option value="__scan_new__">+ Scan / Upload Another Shirt</option>
            </select>
          </div>
        </div>

        <!-- Plain English Verdict Card -->
        <div class="fit-verdict-box p-3 rounded-xl mb-3 shadow-xs">
          <div class="flex items-start gap-2.5">
            <i class="fa-solid fa-quote-left text-amber-500 text-sm mt-0.5 shrink-0"></i>
            <div class="flex-1">
              <p class="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                ${naturalVerdict}
              </p>
              <div class="mt-2 flex items-center justify-between flex-wrap gap-1.5 pt-1.5 border-t border-amber-200/50 dark:border-slate-700/60 text-[11px]">
                <span class="text-slate-600 dark:text-slate-300">
                  Recommended Size: <strong class="text-amber-700 dark:text-amber-300 font-bold">${bestSize}</strong>
                  ${selectedSize === bestSize ? '<span class="ml-1 text-emerald-600 font-bold">✓ (Selected)</span>' : ''}
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs">
                  ${matchScore}% Match
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Measurement Deltas Matrix Chips -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div class="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
            <span class="block text-[10px] font-semibold text-slate-400 uppercase">Chest Fit</span>
            <span class="block text-xs font-extrabold ${Math.abs(deltas.chest.diff) === 0 ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}">
              ${deltas.chest.label}
            </span>
            <span class="block text-[9px] text-slate-400">${targetDims.chest} vs ${userDims.chest}cm</span>
          </div>

          <div class="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
            <span class="block text-[10px] font-semibold text-slate-400 uppercase">Body Length</span>
            <span class="block text-xs font-extrabold ${Math.abs(deltas.length.diff) === 0 ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}">
              ${deltas.length.label}
            </span>
            <span class="block text-[9px] text-slate-400">${targetDims.length} vs ${userDims.length}cm</span>
          </div>

          <div class="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
            <span class="block text-[10px] font-semibold text-slate-400 uppercase">Shoulders</span>
            <span class="block text-xs font-extrabold ${Math.abs(deltas.shoulder.diff) === 0 ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}">
              ${deltas.shoulder.label}
            </span>
            <span class="block text-[9px] text-slate-400">${targetDims.shoulder} vs ${userDims.shoulder}cm</span>
          </div>

          <div class="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
            <span class="block text-[10px] font-semibold text-slate-400 uppercase">Sleeve</span>
            <span class="block text-xs font-extrabold ${Math.abs(deltas.sleeve.diff) === 0 ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}">
              ${deltas.sleeve.label}
            </span>
            <span class="block text-[9px] text-slate-400">${targetDims.sleeve} vs ${userDims.sleeve}cm</span>
          </div>
        </div>

        <!-- Superimposed Wireframe Overlay Canvas -->
        <div class="mb-2">
          <button id="qv-toggle-silhouette-btn" class="w-full flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline">
            <span class="flex items-center gap-1.5">
              <i class="fa-solid fa-layer-group"></i>
              <span>View Superimposed 2D Wireframe Overlay</span>
            </span>
            <i id="qv-silhouette-chevron" class="fa-solid fa-chevron-down text-[10px] transition-transform"></i>
          </button>
          
          <div id="qv-silhouette-wrapper" class="hidden mt-2">
            <div class="fit-silhouette-canvas rounded-xl p-3 flex flex-col justify-between">
              <svg viewBox="0 0 280 200" class="w-full h-40">
                <line x1="20" y1="100" x2="260" y2="100" stroke="#cbd5e1" stroke-dasharray="2 2" stroke-opacity="0.3"/>
                <line x1="140" y1="20" x2="140" y2="180" stroke="#cbd5e1" stroke-dasharray="2 2" stroke-opacity="0.3"/>

                <!-- User Owned Shirt Outline (Blue dashed) -->
                <path d="M 115 35 Q 140 45 165 35 L 205 60 L 190 85 L 170 78 L 170 170 L 110 170 L 110 78 L 90 85 L 75 60 Z"
                      class="wireframe-user-item"/>
                
                <!-- Store Product Shirt Outline (Amber solid) with proportional transform -->
                <path d="M 115 35 Q 140 45 165 35 L ${205 + deltas.shoulder.diff * 1.5} 60 L ${190 + deltas.sleeve.diff} 85 L ${170 + deltas.chest.diff * 0.8} 78 L ${170 + deltas.chest.diff * 0.8} ${170 + deltas.length.diff * 1.2} L ${110 - deltas.chest.diff * 0.8} ${170 + deltas.length.diff * 1.2} L ${110 - deltas.chest.diff * 0.8} 78 L ${90 - deltas.sleeve.diff} 85 L ${75 - deltas.shoulder.diff * 1.5} 60 Z"
                      class="wireframe-store-item"/>

                <text x="140" y="80" text-anchor="middle" font-size="9" font-weight="bold" fill="#f59e0b">
                  Chest: ${deltas.chest.label}
                </text>
                <text x="140" y="188" text-anchor="middle" font-size="9" font-weight="bold" fill="${Math.abs(deltas.length.diff) === 0 ? '#10b981' : '#f59e0b'}">
                  Length: ${deltas.length.label}
                </text>
              </svg>

              <!-- Legend -->
              <div class="flex items-center justify-center gap-4 text-[10px] font-semibold mt-1">
                <span class="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <span class="w-3 h-0.5 border-t-2 border-dashed border-blue-500"></span>
                  <span>Your ${activeOwned.name}</span>
                </span>
                <span class="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <span class="w-3 h-1 bg-amber-500 rounded"></span>
                  <span>NammaStore (${selectedSize})</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Scan another shirt shortcut link -->
        <div class="flex justify-end pt-1">
          <button id="qv-scan-another-link" class="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <i class="fa-solid fa-camera"></i>
            <span>Scan/Upload another cloth for comparison</span>
          </button>
        </div>
      </div>
    `;

    // Dropdown change listener
    const picker = document.getElementById('qv-owned-picker');
    picker?.addEventListener('change', (e) => {
      if (e.target.value === '__scan_new__') {
        openClothScannerModal(product);
      } else {
        renderQuickViewFitTwin(product, selectedSize, e.target.value);
      }
    });

    // Silhouette toggle listener
    const toggleBtn = document.getElementById('qv-toggle-silhouette-btn');
    const silhouetteWrapper = document.getElementById('qv-silhouette-wrapper');
    const chevron = document.getElementById('qv-silhouette-chevron');
    toggleBtn?.addEventListener('click', () => {
      const isHidden = silhouetteWrapper.classList.toggle('hidden');
      if (chevron) {
        chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
      }
    });

    // Scan another shirt shortcut
    document.getElementById('qv-scan-another-link')?.addEventListener('click', () => {
      openClothScannerModal(product);
    });
  }

  // --- Smart Cloth Scanner Modal ---
  function openClothScannerModal(returnToProduct = null) {
    const modal = document.getElementById('cloth-scanner-modal');
    const content = document.getElementById('cloth-scanner-modal-content');
    if (!modal || !content) return;

    let activeTab = 'upload'; // 'upload' | 'camera'
    let scannedImage = null;
    let scanParams = {
      name: 'My Casual Cotton Shirt',
      brand: 'Zara',
      category: 'tops',
      dimensions: {
        chest: 104,
        length: 74,
        shoulder: 45,
        sleeve: 63
      },
      confidence: 94
    };

    function renderScannerView() {
      content.innerHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          <!-- Header -->
          <div class="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
                <i class="fa-solid fa-camera"></i>
              </span>
              <div>
                <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Smart Cloth Scanner</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Capture or upload your favorite shirt to save exact sizing</p>
              </div>
            </div>
            <button id="scanner-close-btn" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Tabs Switcher -->
          <div class="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-1.5">
            <button id="scanner-tab-upload" class="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'upload' 
                ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span>Upload Photo</span>
            </button>
            <button id="scanner-tab-camera" class="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'camera' 
                ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }">
              <i class="fa-solid fa-video"></i>
              <span>Live Camera AR Scan</span>
            </button>
          </div>

          <!-- Body Content -->
          <div class="p-4 sm:p-6 overflow-y-auto max-h-[75vh]" id="scanner-stage-body">
            <!-- Dynamic Content Injected Below -->
          </div>
        </div>
      `;

      // Tab switcher events
      document.getElementById('scanner-tab-upload')?.addEventListener('click', () => {
        stopActiveCameraStream();
        activeTab = 'upload';
        renderScannerView();
        setupUploadStage();
      });

      document.getElementById('scanner-tab-camera')?.addEventListener('click', () => {
        activeTab = 'camera';
        renderScannerView();
        setupCameraStage();
      });

      document.getElementById('scanner-close-btn')?.addEventListener('click', closeClothScannerModal);

      if (activeTab === 'upload') {
        setupUploadStage();
      } else {
        setupCameraStage();
      }
    }

    // --- Tab 1: Upload Photo Stage ---
    function setupUploadStage() {
      const stage = document.getElementById('scanner-stage-body');
      if (!stage) return;

      stage.innerHTML = `
        <div class="space-y-4">
          <!-- Dropzone -->
          <div id="scanner-dropzone" class="photo-upload-dropzone p-5 sm:p-7 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/40">
            <input type="file" id="cloth-file-input" accept="image/*" class="hidden">
            <div class="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl mb-2.5">
              <i class="fa-solid fa-shirt"></i>
            </div>
            <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">
              Drop your laid-flat shirt photo here, or <span class="text-amber-600 underline">browse</span>
            </h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-3">
              Lay your shirt completely flat on a table or bed with sleeves spread out for automated edge detection.
            </p>

            <!-- Quick Demo Garment Presets -->
            <div class="w-full pt-3 border-t border-slate-200/70 dark:border-slate-700/70">
              <span class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">⚡ Or Try Instant Demo Presets:</span>
              <div class="flex flex-wrap gap-2 justify-center">
                <button type="button" data-demo-preset="zara" class="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs">
                  <i class="fa-solid fa-shirt text-amber-600"></i>
                  <span>Zara Slim Shirt</span>
                </button>
                <button type="button" data-demo-preset="oxford" class="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition">
                  <i class="fa-solid fa-vest text-indigo-500"></i>
                  <span>Ralph Lauren Oxford</span>
                </button>
                <button type="button" data-demo-preset="kurta" class="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition">
                  <i class="fa-solid fa-ribbon text-emerald-500"></i>
                  <span>Fabindia Khadi Kurta</span>
                </button>
                <button type="button" data-demo-preset="polo" class="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition">
                  <i class="fa-solid fa-table-tennis-paddle-ball text-rose-500"></i>
                  <span>Tommy Polo</span>
                </button>
                <button type="button" data-demo-preset="tee" class="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition">
                  <i class="fa-solid fa-shirt text-sky-500"></i>
                  <span>Uniqlo Boxy Tee</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Precision Guidance Notice -->
          <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <i class="fa-solid fa-triangle-exclamation text-amber-500 text-sm mt-0.5 shrink-0"></i>
            <div class="text-xs text-slate-600 dark:text-slate-300">
              <span class="font-bold text-slate-800 dark:text-slate-100 block mb-0.5">Need Sub-Centimeter Accuracy?</span>
              If your photo does not capture edges evenly, or if lighting produces low contrast, switch to the <strong>Live Camera AR Scan</strong> tab to use real-time bounding guides!
            </div>
          </div>
        </div>
      `;

      const dropzone = document.getElementById('scanner-dropzone');
      const fileInput = document.getElementById('cloth-file-input');

      dropzone.addEventListener('click', (e) => {
        if (!e.target.closest('[data-demo-preset]')) {
          fileInput.click();
        }
      });

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFileChosen(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFileChosen(e.target.files[0]);
        }
      });

      const DEMO_PRESETS = {
        zara: {
          name: 'Navy Slim Fit Cotton Shirt',
          brand: 'Zara',
          image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
          dimensions: { chest: 104, length: 74, shoulder: 45, sleeve: 63 }
        },
        oxford: {
          name: 'Classic White Royal Oxford Dress Shirt',
          brand: 'Ralph Lauren',
          image: 'https://images.unsplash.com/photo-1620012253295-c15c429fbb41?w=800&auto=format&fit=crop&q=80',
          dimensions: { chest: 108, length: 76, shoulder: 47, sleeve: 64.5 }
        },
        kurta: {
          name: 'Pure Handspun Khadi Mandarin Kurta',
          brand: 'Fabindia',
          image: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&auto=format&fit=crop&q=80',
          dimensions: { chest: 106, length: 78, shoulder: 46, sleeve: 62 }
        },
        polo: {
          name: 'Custom Fit Pique Resort Polo Shirt',
          brand: 'Tommy Hilfiger',
          image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
          dimensions: { chest: 102, length: 72, shoulder: 44, sleeve: 21.5 }
        },
        tee: {
          name: 'Airism Relaxed Boxy Streetwear Tee',
          brand: 'Uniqlo',
          image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
          dimensions: { chest: 112, length: 71, shoulder: 49, sleeve: 24 }
        }
      };

      stage.querySelectorAll('[data-demo-preset]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const key = btn.getAttribute('data-demo-preset');
          const preset = DEMO_PRESETS[key] || DEMO_PRESETS.zara;
          runScanSimulation(preset.image, false, false, preset);
        });
      });
    }

    function handleFileChosen(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        runScanSimulation(e.target.result, true);
      };
      reader.readAsDataURL(file);
    }

    // --- Tab 2: Live Camera Stage ---
    function setupCameraStage() {
      const stage = document.getElementById('scanner-stage-body');
      if (!stage) return;

      stage.innerHTML = `
        <div class="space-y-4">
          <!-- Viewfinder HUD -->
          <div class="camera-viewfinder relative shadow-xl">
            <video id="camera-feed-video" autoplay playsinline muted></video>
            <canvas id="camera-capture-canvas" class="hidden"></canvas>

            <!-- AR HUD Overlay Elements -->
            <div class="camera-overlay-hud">
              <!-- Top HUD Bar -->
              <div class="flex items-center justify-between text-[11px] font-bold text-white z-20">
                <span class="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/40">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>AR Live Guide Active</span>
                </span>
                <span class="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                  Surface: Flat (0.1°)
                </span>
              </div>

              <!-- Animated Laser Scan Line -->
              <div class="scan-laser-line"></div>

              <!-- AR Brackets -->
              <div class="ar-bracket-tl"></div>
              <div class="ar-bracket-tr"></div>
              <div class="ar-bracket-bl"></div>
              <div class="ar-bracket-br"></div>

              <!-- Center Target Shirt Wireframe Guide -->
              <svg class="ar-shirt-target" viewBox="0 0 200 240">
                <path d="M 75 30 Q 100 42 125 30 L 175 60 L 155 95 L 135 88 L 135 220 L 65 220 L 65 88 L 45 95 L 25 60 Z"/>
                <!-- Chest guide line -->
                <line x1="65" y1="110" x2="135" y2="110" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3 3"/>
                <!-- Length guide line -->
                <line x1="100" y1="35" x2="100" y2="220" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3 3"/>
              </svg>

              <!-- Bottom Instructions -->
              <div class="text-center z-20">
                <span class="inline-block bg-black/75 backdrop-blur-md text-amber-300 font-semibold text-xs px-3 py-1.5 rounded-xl border border-amber-500/30">
                  Align shirt within golden guides & smooth out wrinkles
                </span>
              </div>
            </div>
          </div>

          <!-- Camera Trigger Button -->
          <div class="flex items-center justify-center gap-3">
            <button id="camera-capture-btn" class="flex-1 py-3 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-camera"></i>
              <span>Capture & Measure Shirt</span>
            </button>
          </div>
        </div>
      `;

      const video = document.getElementById('camera-feed-video');
      const captureBtn = document.getElementById('camera-capture-btn');

      // Request device camera
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        }).then(stream => {
          currentCameraStream = stream;
          if (video) {
            video.srcObject = stream;
            video.play();
          }
        }).catch(err => {
          console.warn('Camera access fallback simulation:', err);
          showCameraFallbackView();
        });
      } else {
        showCameraFallbackView();
      }

      captureBtn?.addEventListener('click', () => {
        captureFromVideoOrSim();
      });
    }

    function showCameraFallbackView() {
      const stage = document.getElementById('scanner-stage-body');
      if (!stage) return;
      stage.innerHTML = `
        <div class="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div class="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl mx-auto">
            <i class="fa-solid fa-video-slash"></i>
          </div>
          <div>
            <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100">Camera Access Simulator</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Live webcam is restricted in this browser session. You can run the AR vision scanner simulation using our calibrated laid-flat test feed!
            </p>
          </div>
          <button id="sim-capture-btn" class="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition">
            📸 Simulate Camera Scan & Measure
          </button>
        </div>
      `;
      document.getElementById('sim-capture-btn')?.addEventListener('click', () => {
        runScanSimulation('https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80', false, true);
      });
    }

    function captureFromVideoOrSim() {
      const video = document.getElementById('camera-feed-video');
      const canvas = document.getElementById('camera-capture-canvas');
      if (video && canvas && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        stopActiveCameraStream();
        runScanSimulation(dataUrl, false, true);
      } else {
        stopActiveCameraStream();
        runScanSimulation('https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80', false, true);
      }
    }

    // --- Scanning Animation & Parameter Extraction ---
    function runScanSimulation(imageUrl, isUpload = true, isCamera = false, presetMeta = null) {
      scannedImage = imageUrl;
      const stage = document.getElementById('scanner-stage-body');
      if (!stage) return;

      stage.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div class="relative w-48 h-48 rounded-2xl overflow-hidden shadow-lg border-2 border-amber-500">
            <img src="${imageUrl}" class="w-full h-full object-cover">
            <div class="scan-laser-line"></div>
          </div>
          <div>
            <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1 flex items-center justify-center gap-2">
              <i class="fa-solid fa-spinner fa-spin text-amber-600"></i>
              <span>AI Vision Scan in Progress...</span>
            </h4>
            <p id="scan-step-log" class="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Detecting collar & shoulder anchor points...
            </p>
          </div>
        </div>
      `;

      const log = document.getElementById('scan-step-log');
      setTimeout(() => { if (log) log.textContent = 'Measuring chest width across armpit seams...'; }, 350);
      setTimeout(() => { if (log) log.textContent = 'Calculating body length & sleeve taper...'; }, 700);
      setTimeout(() => {
        setupCalibrationStage(isUpload, isCamera, presetMeta);
      }, 1100);
    }

    // --- Step 2: Review & Calibration Stage ---
    function setupCalibrationStage(isUpload, isCamera, presetMeta = null) {
      const stage = document.getElementById('scanner-stage-body');
      if (!stage) return;

      // Parameters extracted or from demo preset
      const chest = presetMeta?.dimensions?.chest || 104;
      const length = presetMeta?.dimensions?.length || 74;
      const shoulder = presetMeta?.dimensions?.shoulder || 45;
      const sleeve = presetMeta?.dimensions?.sleeve || 63;
      const name = presetMeta?.name || 'My Favorite Cotton Shirt';
      const brand = presetMeta?.brand || 'Zara';

      stage.innerHTML = `
        <div class="space-y-4">
          <!-- Banner if photo was uploaded: notify about optical accuracy & camera scan alternative -->
          ${isUpload ? `
            <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex items-start gap-3">
              <i class="fa-solid fa-camera-rotate text-amber-600 text-sm mt-0.5 shrink-0"></i>
              <div class="text-xs text-slate-700 dark:text-slate-300 flex-1">
                <span class="font-bold text-slate-900 dark:text-white block">Photo Edge Detection: Moderate Confidence (82%)</span>
                If the photo was taken at an angle, parameters can vary. You can tweak the sliders below, or 
                <button id="rescan-camera-btn" class="text-amber-600 font-bold underline hover:text-amber-700">switch to Live Camera AR Scan</button> for laser edge guides!
              </div>
            </div>
          ` : `
            <div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
              <i class="fa-solid fa-circle-check text-emerald-600"></i>
              <span>Calibrated via AR Scanner: 98% Sub-Centimeter Accuracy</span>
            </div>
          `}

          <!-- Preview & Measurement Overlay -->
          <div class="flex flex-col sm:flex-row gap-4 items-center bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div class="relative w-36 h-36 rounded-xl overflow-hidden shadow shrink-0 border border-slate-200 dark:border-slate-700">
              <img src="${scannedImage}" class="w-full h-full object-cover">
              <span class="dimension-pin absolute top-2 left-2">
                <i class="fa-solid fa-ruler"></i> ${shoulder}cm Shld
              </span>
              <span class="dimension-pin absolute bottom-2 right-2">
                <i class="fa-solid fa-arrows-up-down"></i> ${length}cm Len
              </span>
            </div>

            <div class="flex-1 w-full space-y-2">
              <div>
                <label class="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Garment Name</label>
                <input type="text" id="scan-name-input" value="${name}" class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Brand / Label</label>
                <input type="text" id="scan-brand-input" value="${brand}" class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold">
              </div>
            </div>
          </div>

          <!-- Fine-Tuning Measurement Controls -->
          <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
            <h5 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <i class="fa-solid fa-sliders text-amber-600"></i>
              <span>Calibrate Extracted Dimensions (cm)</span>
            </h5>

            <!-- Chest -->
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="font-medium text-slate-600 dark:text-slate-300">Chest Width:</span>
                <span id="scan-chest-val" class="font-bold text-amber-600">${chest} cm</span>
              </div>
              <input type="range" id="scan-chest-slider" min="85" max="130" value="${chest}" class="w-full accent-amber-600">
            </div>

            <!-- Length -->
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="font-medium text-slate-600 dark:text-slate-300">Body Length:</span>
                <span id="scan-length-val" class="font-bold text-amber-600">${length} cm</span>
              </div>
              <input type="range" id="scan-length-slider" min="62" max="90" value="${length}" class="w-full accent-amber-600">
            </div>

            <!-- Shoulders -->
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="font-medium text-slate-600 dark:text-slate-300">Shoulder Width:</span>
                <span id="scan-shoulder-val" class="font-bold text-amber-600">${shoulder} cm</span>
              </div>
              <input type="range" id="scan-shoulder-slider" min="38" max="56" value="${shoulder}" class="w-full accent-amber-600">
            </div>

            <!-- Sleeves -->
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="font-medium text-slate-600 dark:text-slate-300">Sleeve Length:</span>
                <span id="scan-sleeve-val" class="font-bold text-amber-600">${sleeve} cm</span>
              </div>
              <input type="range" id="scan-sleeve-slider" min="18" max="72" value="${sleeve}" class="w-full accent-amber-600">
            </div>
          </div>

          <!-- Save Button -->
          <button id="scan-save-btn" class="w-full py-3 px-5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2">
            <i class="fa-solid fa-floppy-disk"></i>
            <span>Save to My Fit Locker & Compare</span>
          </button>
        </div>
      `;

      // Rescan with camera button if on upload
      document.getElementById('rescan-camera-btn')?.addEventListener('click', () => {
        activeTab = 'camera';
        renderScannerView();
      });

      // Slider listeners
      const chestSlider = document.getElementById('scan-chest-slider');
      const chestVal = document.getElementById('scan-chest-val');
      chestSlider?.addEventListener('input', (e) => {
        chestVal.textContent = e.target.value + ' cm';
        scanParams.dimensions.chest = Number(e.target.value);
      });

      const lenSlider = document.getElementById('scan-length-slider');
      const lenVal = document.getElementById('scan-length-val');
      lenSlider?.addEventListener('input', (e) => {
        lenVal.textContent = e.target.value + ' cm';
        scanParams.dimensions.length = Number(e.target.value);
      });

      const shldSlider = document.getElementById('scan-shoulder-slider');
      const shldVal = document.getElementById('scan-shoulder-val');
      shldSlider?.addEventListener('input', (e) => {
        shldVal.textContent = e.target.value + ' cm';
        scanParams.dimensions.shoulder = Number(e.target.value);
      });

      const slvSlider = document.getElementById('scan-sleeve-slider');
      const slvVal = document.getElementById('scan-sleeve-val');
      slvSlider?.addEventListener('input', (e) => {
        slvVal.textContent = e.target.value + ' cm';
        scanParams.dimensions.sleeve = Number(e.target.value);
      });

      // Save to Fit Locker
      document.getElementById('scan-save-btn')?.addEventListener('click', () => {
        const name = document.getElementById('scan-name-input').value.trim() || 'My Scanned Shirt';
        const brand = document.getElementById('scan-brand-input').value.trim() || 'Personal Reference';

        const newItem = window.Store.addOwnedItem({
          name,
          brand,
          category: 'tops',
          image: scannedImage,
          dimensions: {
            chest: Number(chestSlider.value),
            length: Number(lenSlider.value),
            shoulder: Number(shldSlider.value),
            sleeve: Number(slvSlider.value)
          },
          notes: isCamera ? 'Calibrated via Live Camera AR Scan' : 'Laid-flat photo scan measurement'
        });

        closeClothScannerModal();
        showToast(`Saved "${name}" to your Fit Locker! Your fit recommendations are updated. ✨`, 'success');

        // If user came from a product modal, refresh it immediately
        if (returnToProduct) {
          openQuickViewModal(returnToProduct);
        }
      });
    }

    function stopActiveCameraStream() {
      if (currentCameraStream) {
        currentCameraStream.getTracks().forEach(t => t.stop());
        currentCameraStream = null;
      }
    }

    renderScannerView();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeClothScannerModal() {
    const modal = document.getElementById('cloth-scanner-modal');
    if (currentCameraStream) {
      currentCameraStream.getTracks().forEach(t => t.stop());
      currentCameraStream = null;
    }
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // --- Fit Locker Wardrobe Manager Modal ---
  function openFitLockerModal() {
    const modal = document.getElementById('fit-locker-modal');
    const content = document.getElementById('fit-locker-modal-content');
    if (!modal || !content) return;

    function renderLockerContent() {
      const items = window.Store.getOwnedItems ? window.Store.getOwnedItems() : [];

      content.innerHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          <!-- Header -->
          <div class="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
                <i class="fa-solid fa-shirt"></i>
              </span>
              <div>
                <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">My Fit Locker</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Your saved clothes for instant size & fit comparison across NammaStore</p>
              </div>
            </div>
            <button id="locker-close-btn" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Add Garment Action Bar -->
          <div class="p-4 bg-amber-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <span class="text-xs text-slate-600 dark:text-slate-300 font-medium">
              ${items.length} saved reference garment${items.length === 1 ? '' : 's'}
            </span>
            <button id="locker-scan-new-btn" class="py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2">
              <i class="fa-solid fa-camera"></i>
              <span>+ Scan / Upload New Garment</span>
            </button>
          </div>

          <!-- Wardrobe Grid -->
          <div class="p-4 sm:p-6 overflow-y-auto max-h-[65vh] space-y-3">
            ${items.length === 0 ? `
              <div class="text-center py-10 text-slate-400 space-y-2">
                <i class="fa-solid fa-shirt text-4xl mb-2 text-slate-300"></i>
                <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Your Fit Locker is empty</p>
                <p class="text-xs text-slate-400">Scan or upload your favorite shirt to get personalized size recommendations.</p>
              </div>
            ` : items.map(item => `
              <div class="p-3.5 rounded-2xl border ${item.isDefault ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/20 ring-1 ring-amber-400/40' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition">
                <div class="flex items-center gap-3">
                  <div class="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-600">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                  </div>
                  <div>
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="text-xs font-bold text-slate-900 dark:text-white">${item.name}</span>
                      ${item.isDefault ? `
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-500 text-white shadow-xs">
                          Default
                        </span>
                      ` : ''}
                    </div>
                    <span class="text-xs text-amber-600 font-semibold">${item.brand || 'Personal Favorite'}</span>
                    
                    <!-- Measurements chips -->
                    <div class="flex flex-wrap gap-1.5 mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                      ${item.dimensions.chest ? `<span class="bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">Chest: ${item.dimensions.chest}cm</span>` : ''}
                      ${item.dimensions.length ? `<span class="bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">Length: ${item.dimensions.length}cm</span>` : ''}
                      ${item.dimensions.shoulder ? `<span class="bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">Shoulders: ${item.dimensions.shoulder}cm</span>` : ''}
                      ${item.dimensions.sleeve ? `<span class="bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">Sleeve: ${item.dimensions.sleeve}cm</span>` : ''}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 self-end sm:self-center">
                  ${!item.isDefault ? `
                    <button data-locker-default="${item.id}" class="py-1 px-2.5 rounded-lg text-xs font-semibold text-amber-600 border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition">
                      Set as Default
                    </button>
                  ` : ''}
                  <button data-locker-delete="${item.id}" class="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center justify-center" title="Delete">
                    <i class="fa-regular fa-trash-can text-xs"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      document.getElementById('locker-close-btn')?.addEventListener('click', closeFitLockerModal);
      document.getElementById('locker-scan-new-btn')?.addEventListener('click', () => {
        closeFitLockerModal();
        openClothScannerModal();
      });

      content.querySelectorAll('[data-locker-default]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-locker-default');
          window.Store.setDefaultOwnedItem(id);
          renderLockerContent();
          showToast('Updated active default reference garment!', 'success');
        });
      });

      content.querySelectorAll('[data-locker-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-locker-delete');
          window.Store.deleteOwnedItem(id);
          renderLockerContent();
          showToast('Garment removed from your Fit Locker', 'info');
        });
      });
    }

    renderLockerContent();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeFitLockerModal() {
    const modal = document.getElementById('fit-locker-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // --- Compare Products Drawer & Matrix ---
  function openCompareDrawer() {
    const drawer = document.getElementById('compare-drawer');
    if (drawer) {
      renderCompareDrawer();
      drawer.classList.add('active');
    }
  }

  function closeCompareDrawer() {
    const drawer = document.getElementById('compare-drawer');
    if (drawer) drawer.classList.remove('active');
  }

  function renderCompareDrawer() {
    const container = document.getElementById('compare-matrix-content');
    const badge = document.getElementById('compare-badge');
    const compIds = window.Store.getCompare();
    const prods = window.PRODUCTS.filter(p => compIds.includes(p.id));

    if (badge) {
      badge.textContent = compIds.length;
      badge.classList.toggle('hidden', compIds.length === 0);
    }

    if (!container) return;

    if (prods.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-400">
          <i class="fa-solid fa-code-compare text-3xl mb-2"></i>
          <p class="text-sm">No items selected for comparison. Click the compare icon on product cards to compare specifications.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-700">
              <th class="p-3 w-40 font-bold text-slate-500">Feature</th>
              ${prods.map(p => `
                <th class="p-3 w-64 min-w-[200px]">
                  <div class="relative group">
                    <button data-remove-compare="${p.id}" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                    <img src="${p.images[0]}" class="w-24 h-24 object-cover rounded-xl mb-2 mx-auto border" />
                    <div class="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">${p.name}</div>
                    <div class="text-amber-600 font-extrabold text-sm mt-1">${window.Store.formatPrice(p.price)}</div>
                  </div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr>
              <td class="p-3 font-semibold text-slate-500">Category</td>
              ${prods.map(p => `<td class="p-3 uppercase font-medium text-slate-700 dark:text-slate-300">${p.category}</td>`).join('')}
            </tr>
            <tr>
              <td class="p-3 font-semibold text-slate-500">Brand</td>
              ${prods.map(p => `<td class="p-3 font-bold text-slate-800 dark:text-slate-200">${p.brand}</td>`).join('')}
            </tr>
            <tr>
              <td class="p-3 font-semibold text-slate-500">Rating</td>
              ${prods.map(p => `
                <td class="p-3 text-amber-500 font-bold">
                  ★ ${p.rating} <span class="text-slate-400 font-normal">(${p.reviewCount})</span>
                </td>
              `).join('')}
            </tr>
            <tr>
              <td class="p-3 font-semibold text-slate-500">Delivery</td>
              ${prods.map(p => `
                <td class="p-3 text-emerald-600 font-medium">
                  ${p.isExpress ? '⚡ Express 24-hr Available' : 'Standard 3-5 days'}
                </td>
              `).join('')}
            </tr>
            <tr>
              <td class="p-3 font-semibold text-slate-500">Action</td>
              ${prods.map(p => `
                <td class="p-3">
                  <button data-comp-add-cart="${p.id}" class="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold">
                    Add to Cart
                  </button>
                </td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    // Compare matrix actions
    container.querySelectorAll('[data-remove-compare]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-remove-compare');
        window.Store.toggleCompare(id);
      });
    });

    container.querySelectorAll('[data-comp-add-cart]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-comp-add-cart');
        const p = window.PRODUCTS.find(x => x.id === id);
        if (p) {
          window.Store.addToCart(p, 1);
          showToast(`Added ${p.name.slice(0, 20)} to cart!`, 'success');
          closeCompareDrawer();
          openCartDrawer();
        }
      });
    });
  }

  // --- Multi-Step Checkout Modal Implementation ---
  function openCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;

    state.activeCheckoutStep = 1;
    renderCheckoutStep(1);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function renderCheckoutStep(stepNumber) {
    state.activeCheckoutStep = stepNumber;
    const body = document.getElementById('checkout-step-body');
    const stepIndicators = document.querySelectorAll('.checkout-step-pill');

    stepIndicators.forEach((pill, idx) => {
      const stepIdx = idx + 1;
      if (stepIdx === stepNumber) {
        pill.className = 'checkout-step-pill px-3 py-1 rounded-full text-xs font-bold bg-amber-600 text-white flex items-center gap-1.5 shadow-sm';
      } else if (stepIdx < stepNumber) {
        pill.className = 'checkout-step-pill px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5';
      } else {
        pill.className = 'checkout-step-pill px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center gap-1.5';
      }
    });

    if (stepNumber === 1) {
      renderStep1ShippingAddress(body);
    } else if (stepNumber === 2) {
      renderStep2ShippingMethod(body);
    } else if (stepNumber === 3) {
      renderStep3Payment(body);
    } else if (stepNumber === 4) {
      renderStep4Confirmation(body);
    }
  }

  function renderStep1ShippingAddress(container) {
    const saved = window.Store.state.savedAddresses;
    const currentAddr = window.Store.state.shippingAddress;

    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">Select or Enter Delivery Address</h4>
          <button id="auto-detect-location-btn" class="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1">
            <i class="fa-solid fa-crosshairs"></i> Use GPS Auto-Detect
          </button>
        </div>

        <!-- Saved Addresses Radios -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${saved.map((addr, idx) => `
            <label class="p-3.5 rounded-xl border cursor-pointer transition ${
              addr.street === currentAddr.street 
                ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30' 
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2">
                  <input type="radio" name="saved-addr-choice" value="${addr.id}" ${addr.street === currentAddr.street ? 'checked' : ''} class="text-amber-600">
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200">${addr.fullName}</span>
                </div>
                <span class="text-[10px] px-2 py-0.5 rounded font-bold uppercase ${addr.tag === 'Home' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}">${addr.tag}</span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-300 mt-2">${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}</p>
              <p class="text-[11px] text-slate-400 mt-1"><i class="fa-solid fa-phone text-[10px] mr-1"></i> ${addr.phone}</p>
            </label>
          `).join('')}
        </div>

        <div class="relative py-2">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
          <div class="relative flex justify-center text-xs uppercase"><span class="bg-white dark:bg-slate-800 px-3 text-slate-400 font-semibold">Or New Address</span></div>
        </div>

        <!-- Address Form -->
        <form id="new-address-form" class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label class="block font-semibold mb-1">Full Recipient Name *</label>
            <input type="text" id="chk-name" value="${currentAddr.fullName}" required class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label class="block font-semibold mb-1">Contact Phone *</label>
            <input type="text" id="chk-phone" value="${currentAddr.phone}" required class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
          </div>
          <div class="sm:col-span-2">
            <label class="block font-semibold mb-1">House / Flat No, Street, Landmark *</label>
            <input type="text" id="chk-street" value="${currentAddr.street}" required class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label class="block font-semibold mb-1">City *</label>
            <input type="text" id="chk-city" value="${currentAddr.city}" required class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label class="block font-semibold mb-1">Pincode *</label>
            <input type="text" id="chk-pincode" maxlength="6" value="${currentAddr.pincode}" required class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
          </div>
        </form>

        <div class="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button id="step-1-next-btn" class="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2">
            <span>Continue to Delivery Speed</span>
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;

    // Auto-detect GPS simulation
    const autoGps = document.getElementById('auto-detect-location-btn');
    if (autoGps) {
      autoGps.addEventListener('click', () => {
        showToast('Fetching GPS coordinates... 📍', 'info');
        setTimeout(() => {
          document.getElementById('chk-street').value = 'Brigade Road, Ashok Nagar';
          document.getElementById('chk-city').value = 'Bengaluru';
          document.getElementById('chk-pincode').value = '560025';
          showToast('Address filled from Bengaluru GPS!', 'success');
        }, 600);
      });
    }

    // Step 1 Next
    document.getElementById('step-1-next-btn').addEventListener('click', () => {
      const name = document.getElementById('chk-name').value.trim();
      const phone = document.getElementById('chk-phone').value.trim();
      const street = document.getElementById('chk-street').value.trim();
      const city = document.getElementById('chk-city').value.trim();
      const pincode = document.getElementById('chk-pincode').value.trim();

      if (!name || !phone || !street || !city || !pincode) {
        showToast('Please fill out all address fields.', 'warning');
        return;
      }

      state.checkoutData.address = { fullName: name, phone, street, city, pincode, state: 'Karnataka' };
      window.Store.state.shippingAddress = state.checkoutData.address;
      renderCheckoutStep(2);
    });
  }

  function renderStep2ShippingMethod(container) {
    const currentMethod = window.Store.state.deliveryMethod || 'standard';

    container.innerHTML = `
      <div class="space-y-4">
        <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">Choose Delivery Speed</h4>

        <div class="space-y-3">
          <label class="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
            currentMethod === 'standard' ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30' : 'border-slate-200 dark:border-slate-700'
          }">
            <div class="flex items-center gap-3">
              <input type="radio" name="delivery-speed" value="standard" ${currentMethod === 'standard' ? 'checked' : ''} class="text-amber-600">
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <i class="fa-solid fa-truck text-slate-500"></i>
                  <span>Standard Delivery (3 - 5 Days)</span>
                </div>
                <div class="text-[11px] text-slate-500">Eco-friendly dispatch via surface express</div>
              </div>
            </div>
            <span class="text-xs font-bold text-emerald-600">FREE over ₹999</span>
          </label>

          <label class="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
            currentMethod === 'express' ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30' : 'border-slate-200 dark:border-slate-700'
          }">
            <div class="flex items-center gap-3">
              <input type="radio" name="delivery-speed" value="express" ${currentMethod === 'express' ? 'checked' : ''} class="text-amber-600">
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <i class="fa-solid fa-bolt text-amber-500"></i>
                  <span>NammaExpress Next-Day Delivery</span>
                </div>
                <div class="text-[11px] text-slate-500">Guaranteed arrival by tomorrow 2:00 PM</div>
              </div>
            </div>
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200">${window.Store.formatPrice(99)}</span>
          </label>

          <label class="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
            currentMethod === 'rush' ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30' : 'border-slate-200 dark:border-slate-700'
          }">
            <div class="flex items-center gap-3">
              <input type="radio" name="delivery-speed" value="rush" ${currentMethod === 'rush' ? 'checked' : ''} class="text-amber-600">
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <i class="fa-solid fa-jet-fighter text-indigo-500"></i>
                  <span>Same-Day Rush (Within 6 Hours)</span>
                </div>
                <div class="text-[11px] text-slate-500">Direct courier sprint for Bengaluru & major hubs</div>
              </div>
            </div>
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200">${window.Store.formatPrice(199)}</span>
          </label>
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
          <button id="step-2-back-btn" class="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-xs flex items-center gap-1">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Back</span>
          </button>
          <button id="step-2-next-btn" class="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2">
            <span>Continue to Payment</span>
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll('input[name="delivery-speed"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        window.Store.setDeliveryMethod(e.target.value);
        renderStep2ShippingMethod(container);
      });
    });

    document.getElementById('step-2-back-btn').addEventListener('click', () => renderCheckoutStep(1));
    document.getElementById('step-2-next-btn').addEventListener('click', () => renderCheckoutStep(3));
  }

  function renderStep3Payment(container) {
    const totalAmount = window.Store.getCartTotal();
    const currentMethod = state.checkoutData.paymentMethod || 'upi';

    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <div class="text-xs text-slate-400">Total Payable Amount</div>
            <div class="text-xl font-black text-amber-600">${window.Store.formatPrice(totalAmount)}</div>
          </div>
          <div class="text-right">
            <div class="text-[11px] text-emerald-600 font-semibold"><i class="fa-solid fa-shield-halved"></i> 256-Bit SSL Encrypted</div>
            <div class="text-[10px] text-slate-400">Instant Refund Guarantee</div>
          </div>
        </div>

        <!-- Payment Tabs -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
          <button data-pay-tab="upi" class="p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
            currentMethod === 'upi' ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }">
            <i class="fa-solid fa-qrcode text-base"></i>
            <span>UPI / QR</span>
          </button>
          <button data-pay-tab="card" class="p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
            currentMethod === 'card' ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }">
            <i class="fa-solid fa-credit-card text-base"></i>
            <span>Cards</span>
          </button>
          <button data-pay-tab="netbanking" class="p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
            currentMethod === 'netbanking' ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }">
            <i class="fa-solid fa-building-columns text-base"></i>
            <span>Net Banking</span>
          </button>
          <button data-pay-tab="cod" class="p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
            currentMethod === 'cod' ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }">
            <i class="fa-solid fa-hand-holding-dollar text-base"></i>
            <span>Cash on Delivery</span>
          </button>
        </div>

        <!-- Dynamic Payment Area -->
        <div id="payment-method-details" class="pt-2">
          <!-- Filled by sub-renderer -->
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
          <button id="step-3-back-btn" class="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-xs flex items-center gap-1">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Back</span>
          </button>
          <button id="complete-payment-btn" class="px-7 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-amber-500/25 transition">
            <i class="fa-solid fa-lock text-xs"></i>
            <span>Pay & Place Order</span>
          </button>
        </div>
      </div>
    `;

    // Payment tab clicks
    container.querySelectorAll('[data-pay-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        state.checkoutData.paymentMethod = tab.getAttribute('data-pay-tab');
        renderStep3Payment(container);
      });
    });

    document.getElementById('step-3-back-btn').addEventListener('click', () => renderCheckoutStep(2));

    // Render Sub-method Details
    const detailBox = document.getElementById('payment-method-details');
    if (currentMethod === 'upi') {
      renderUpiPayment(detailBox, totalAmount);
    } else if (currentMethod === 'card') {
      renderCardPayment(detailBox);
    } else if (currentMethod === 'netbanking') {
      renderNetBankingPayment(detailBox);
    } else if (currentMethod === 'cod') {
      renderCodPayment(detailBox);
    }

    // Complete Payment
    document.getElementById('complete-payment-btn').addEventListener('click', handlePaymentSubmit);
  }

  function renderUpiPayment(container, totalAmount) {
    container.innerHTML = `
      <div class="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
        <!-- Live Simulated QR Code -->
        <div class="w-44 h-44 bg-white p-2.5 rounded-xl shadow border border-slate-200 flex flex-col items-center justify-between flex-shrink-0">
          <div class="w-full flex-1 bg-slate-950 p-2 rounded-lg flex items-center justify-center relative overflow-hidden">
            <!-- Simulated Authentic SVG QR Code Pattern -->
            <svg class="w-full h-full text-white" viewBox="0 0 100 100" fill="currentColor">
              <path d="M0,0 h30 v30 h-30 z M5,5 v20 h20 v-20 z M10,10 h10 v10 h-10 z" />
              <path d="M70,0 h30 v30 h-30 z M75,5 v20 h20 v-20 z M80,10 h10 v10 h-10 z" />
              <path d="M0,70 h30 v30 h-30 z M5,75 v20 h20 v-20 z M10,80 h10 v10 h-10 z" />
              <rect x="35" y="5" width="10" height="20" />
              <rect x="50" y="10" width="15" height="10" />
              <rect x="35" y="35" width="30" height="30" rx="4" />
              <rect x="75" y="40" width="20" height="15" />
              <rect x="40" y="75" width="20" height="20" />
              <rect x="70" y="70" width="15" height="15" />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-black shadow">
                NM
              </div>
            </div>
          </div>
          <div class="text-[10px] font-bold text-slate-600 mt-1 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Scan with any UPI App</span>
          </div>
        </div>

        <div class="flex-1 space-y-3 text-xs">
          <div>
            <div class="font-bold text-slate-800 dark:text-slate-100">Scan & Pay via GPay, PhonePe, Paytm, or BHIM</div>
            <div class="text-slate-400 text-[11px]">QR code expires in <span id="qr-countdown" class="text-rose-500 font-bold font-mono">09:59</span></div>
          </div>

          <div class="flex items-center gap-2">
            <span class="px-2 py-1 rounded bg-white dark:bg-slate-800 border text-slate-700 dark:text-slate-200 font-semibold text-[11px]">Google Pay</span>
            <span class="px-2 py-1 rounded bg-white dark:bg-slate-800 border text-slate-700 dark:text-slate-200 font-semibold text-[11px]">PhonePe</span>
            <span class="px-2 py-1 rounded bg-white dark:bg-slate-800 border text-slate-700 dark:text-slate-200 font-semibold text-[11px]">Paytm UPI</span>
          </div>

          <div class="pt-1">
            <label class="block font-semibold mb-1 text-slate-600 dark:text-slate-300">Or Enter your VPA / UPI ID</label>
            <div class="flex gap-2">
              <input type="text" id="upi-vpa-input" placeholder="e.g. yourname@okhdfcbank" class="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs">
              <button id="verify-vpa-btn" class="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs">
                Verify
              </button>
            </div>
            <div id="vpa-status" class="text-[11px] mt-1 text-emerald-600 hidden font-semibold">✓ Verified UPI ID (Anand Kumar)</div>
          </div>
        </div>
      </div>
    `;

    // QR Timer
    let qrSecs = 599;
    const qrTimerEl = document.getElementById('qr-countdown');
    if (qrTimerEl) {
      const interval = setInterval(() => {
        if (qrSecs <= 0) {
          clearInterval(interval);
          qrTimerEl.textContent = 'Expired';
          return;
        }
        qrSecs--;
        const m = Math.floor(qrSecs / 60);
        const s = qrSecs % 60;
        qrTimerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }, 1000);
    }

    const vpaBtn = document.getElementById('verify-vpa-btn');
    const vpaStatus = document.getElementById('vpa-status');
    if (vpaBtn) {
      vpaBtn.addEventListener('click', () => {
        const val = document.getElementById('upi-vpa-input').value.trim();
        if (val.includes('@')) {
          vpaStatus.classList.remove('hidden');
          showToast('UPI ID verified successfully!', 'success');
        } else {
          showToast('Please enter a valid UPI ID (e.g. mobile@upi)', 'warning');
        }
      });
    }
  }

  function renderCardPayment(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <!-- Interactive 3D Card Preview -->
        <div id="card-3d-box" class="credit-card-3d">
          <div class="credit-card-inner">
            <!-- Front -->
            <div class="credit-card-front flex flex-col justify-between">
              <div class="flex justify-between items-start">
                <div class="card-gold-chip"></div>
                <div class="text-right">
                  <div class="font-black text-sm tracking-widest text-amber-400">NAMMA PLATINUM</div>
                  <div class="text-[9px] text-slate-300">GLOBAL PRIVILEGE</div>
                </div>
              </div>

              <div>
                <div id="card-num-preview" class="font-mono text-lg tracking-widest text-slate-100 font-bold mb-3">
                  •••• •••• •••• 4242
                </div>
                <div class="flex justify-between items-end text-xs">
                  <div>
                    <div class="text-[9px] text-slate-400 uppercase tracking-wider">Card Holder</div>
                    <div id="card-name-preview" class="font-bold tracking-wider uppercase text-slate-200">ANAND KUMAR</div>
                  </div>
                  <div>
                    <div class="text-[9px] text-slate-400 uppercase tracking-wider">Expires</div>
                    <div id="card-exp-preview" class="font-mono font-bold text-slate-200">12/28</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Back -->
            <div class="credit-card-back flex flex-col justify-between">
              <div class="card-magnetic-strip"></div>
              <div>
                <div class="text-[10px] text-slate-400 text-right pr-6 mb-1">CVV / CVC</div>
                <div id="card-cvv-preview" class="card-cvv-strip">892</div>
              </div>
              <div class="text-[8px] text-slate-400 text-center px-4 pb-2">
                This is a secure 256-bit encrypted simulated card transaction. NammaStore does not store raw CVV credentials.
              </div>
            </div>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
          <div class="sm:col-span-2">
            <label class="block font-semibold mb-1">Card Number *</label>
            <input type="text" id="c-num-input" maxlength="19" placeholder="4532 8901 2345 4242" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono">
          </div>
          <div class="sm:col-span-2">
            <label class="block font-semibold mb-1">Cardholder Name *</label>
            <input type="text" id="c-name-input" placeholder="Name as displayed on card" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          </div>
          <div>
            <label class="block font-semibold mb-1">Expiry Date *</label>
            <input type="text" id="c-exp-input" maxlength="5" placeholder="MM/YY" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono">
          </div>
          <div>
            <label class="block font-semibold mb-1">CVV Security Code *</label>
            <input type="password" id="c-cvv-input" maxlength="4" placeholder="3 or 4 digits" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono">
          </div>
        </div>
      </div>
    `;

    // Interactive Card updates & 3D Flip
    const cardBox = document.getElementById('card-3d-box');
    const numInput = document.getElementById('c-num-input');
    const nameInput = document.getElementById('c-name-input');
    const expInput = document.getElementById('c-exp-input');
    const cvvInput = document.getElementById('c-cvv-input');

    const numPreview = document.getElementById('card-num-preview');
    const namePreview = document.getElementById('card-name-preview');
    const expPreview = document.getElementById('card-exp-preview');
    const cvvPreview = document.getElementById('card-cvv-preview');

    numInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      val = val.match(/.{1,4}/g)?.join(' ') || '';
      e.target.value = val;
      numPreview.textContent = val || '•••• •••• •••• 4242';
    });

    nameInput.addEventListener('input', (e) => {
      namePreview.textContent = e.target.value.toUpperCase() || 'ANAND KUMAR';
    });

    expInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 3) {
        val = val.substring(0, 2) + '/' + val.substring(2);
      }
      e.target.value = val;
      expPreview.textContent = val || '12/28';
    });

    cvvInput.addEventListener('focus', () => cardBox.classList.add('flipped'));
    cvvInput.addEventListener('blur', () => cardBox.classList.remove('flipped'));
    cvvInput.addEventListener('input', (e) => {
      cvvPreview.textContent = e.target.value || '•••';
    });
  }

  function renderNetBankingPayment(container) {
    const banks = [
      { name: 'HDFC Bank', icon: 'fa-landmark' },
      { name: 'State Bank of India', icon: 'fa-building-columns' },
      { name: 'ICICI Bank', icon: 'fa-vault' },
      { name: 'Axis Bank', icon: 'fa-money-bill-transfer' },
      { name: 'Kotak Mahindra', icon: 'fa-landmark' }
    ];

    container.innerHTML = `
      <div class="space-y-3 text-xs">
        <label class="block font-semibold">Select Popular Bank</label>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          ${banks.map((b, i) => `
            <label class="p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition ${i === 0 ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30' : 'border-slate-200 dark:border-slate-700'}">
              <input type="radio" name="bank-choice" value="${b.name}" ${i === 0 ? 'checked' : ''} class="text-amber-600">
              <span class="font-bold text-slate-800 dark:text-slate-100">${b.name}</span>
            </label>
          `).join('')}
        </div>
        <div class="pt-2">
          <label class="block font-semibold mb-1">Or Other Indian Bank</label>
          <select class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs">
            <option>Bank of Baroda</option>
            <option>Punjab National Bank</option>
            <option>Canara Bank</option>
            <option>Union Bank of India</option>
            <option>IDBI Bank</option>
          </select>
        </div>
      </div>
    `;
  }

  function renderCodPayment(container) {
    const captchaCode = Math.floor(1000 + Math.random() * 9000);
    state.checkoutData.codCaptchaGenerated = String(captchaCode);

    container.innerHTML = `
      <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
        <div class="flex items-center gap-2 text-emerald-600 font-bold">
          <i class="fa-solid fa-circle-check"></i>
          <span>Cash on Delivery is eligible for your delivery address!</span>
        </div>
        <p class="text-slate-500">Pay by Cash, UPI QR, or Debit card to the delivery executive when the package arrives at your doorstep.</p>

        <div class="pt-2">
          <label class="block font-semibold mb-1">Enter Security Verification Code</label>
          <div class="flex items-center gap-3">
            <span class="font-mono text-base font-black px-4 py-1.5 rounded-lg bg-amber-200 dark:bg-amber-900/60 text-slate-900 dark:text-amber-200 tracking-widest select-none">
              ${captchaCode}
            </span>
            <input type="text" id="cod-captcha-input" maxlength="4" placeholder="Enter 4 digits" class="w-36 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center font-bold">
          </div>
        </div>
      </div>
    `;
  }

  async function handlePaymentSubmit() {
    const btn = document.getElementById('complete-payment-btn');
    if (!btn) return;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving Order...`;
    btn.disabled = true;
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: window.Store.getCart(),
          shippingAddress: state.checkoutData.address || window.Store.state.shippingAddress,
          paymentMethod: state.checkoutData.paymentMethod,
          discount: window.Store.getCouponDiscount() + window.Store.getCoinsDiscount(),
          shippingCost: window.Store.getShippingCost()
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not place the order.');
      window.Store.state.orders.unshift(data.order);
      window.Store.state.coinsBalance += Math.floor(data.order.total * 0.05);
      window.Store.clearCart();
      window.Store.save();
      renderCheckoutStep(4);
      triggerConfetti();
      showToast(`🎉 Order ${data.order.id} saved and sent to the order event stream!`, 'success');
      pollForOrderConfirmation(data.order.id);
    } catch (error) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-lock"></i> Place Order';
      showToast(error.message || 'Order service is unavailable. Check that PostgreSQL, Kafka, and OpenSearch are running.', 'error');
    }
  }

  async function pollForOrderConfirmation(orderId) {
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) return;
        const { notifications } = await response.json();
        const confirmation = notifications.find(item => item.order_id === orderId);
        if (confirmation) {
          showToast(confirmation.message, 'success');
          return;
        }
      } catch { return; }
    }
  }

  function renderStep4Confirmation(container) {
    const orders = window.Store.state.orders;
    const latest = orders[0];

    container.innerHTML = `
      <div class="text-center py-4 space-y-4">
        <div class="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-md">
          <i class="fa-solid fa-circle-check"></i>
        </div>

        <div>
          <h3 class="text-xl font-black text-slate-900 dark:text-white">Order Confirmed!</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thank you for shopping at <strong>NammaStore</strong>. A confirmation SMS & Email invoice has been sent to your registered phone.
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
          <div class="flex justify-between border-b pb-2">
            <span class="text-slate-400">Order ID:</span>
            <span class="font-mono font-bold text-amber-600">${latest.id}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-slate-400">Estimated Delivery:</span>
            <span class="font-bold text-slate-800 dark:text-slate-100">Tomorrow by 2:00 PM</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-slate-400">Payment Status:</span>
            <span class="font-bold text-emerald-600">✓ Paid via ${latest.paymentMethod}</span>
          </div>
          <div class="flex justify-between pt-1">
            <span class="text-slate-400">Total Paid:</span>
            <span class="font-black text-base text-slate-900 dark:text-white">${window.Store.formatPrice(latest.total)}</span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <button id="view-order-tracking-btn" class="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2">
            <i class="fa-solid fa-route"></i>
            <span>Track Delivery Live</span>
          </button>
          <button id="print-invoice-btn" class="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-2">
            <i class="fa-solid fa-file-invoice"></i>
            <span>Print Invoice Receipt</span>
          </button>
          <button id="finish-shopping-btn" class="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2">
            <span>Continue Shopping</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('view-order-tracking-btn').addEventListener('click', () => {
      closeCheckoutModal();
      openOrderTrackingModal(latest.id);
    });

    document.getElementById('print-invoice-btn').addEventListener('click', () => {
      openInvoicePrintView(latest);
    });

    document.getElementById('finish-shopping-btn').addEventListener('click', () => {
      closeCheckoutModal();
    });
  }

  // --- Confetti Celebration ---
  function triggerConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
    }
  }

  // --- Order Tracking Modal ---
  function openOrderTrackingModal(orderId) {
    const modal = document.getElementById('tracking-modal');
    if (!modal) return;

    const order = window.Store.getOrder(orderId) || window.Store.state.orders[0];
    const container = document.getElementById('tracking-modal-content');

    if (!order) {
      container.innerHTML = `<p class="p-8 text-center text-slate-400">No order found with ID "${orderId}".</p>`;
    } else {
      container.innerHTML = `
        <div class="p-6 bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full space-y-6">
          <div class="flex justify-between items-start">
            <div>
              <div class="text-xs text-amber-600 font-bold uppercase tracking-wider">Live Delivery Status</div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">Order #${order.id}</h3>
              <div class="text-xs text-slate-400">Carrier: NammaExpress • AWB: ${order.trackingNumber}</div>
            </div>
            <button id="close-tracking-btn" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Progress Stepper -->
          <div class="space-y-4 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            ${order.timeline.map((step, idx) => `
              <div class="relative">
                <div class="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 ${
                  step.done 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                } flex items-center justify-center text-[9px]">
                  ${step.done ? '✓' : ''}
                </div>
                <div>
                  <div class="text-xs font-bold ${step.done ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}">${step.stage}</div>
                  <div class="text-[11px] text-slate-400">${step.time}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div class="font-bold text-slate-700 dark:text-slate-200 mb-1">Delivering to:</div>
            <div class="text-slate-500">${order.shippingAddress.street}, ${order.shippingAddress.city} - ${order.shippingAddress.pincode}</div>
          </div>
        </div>
      `;

      document.getElementById('close-tracking-btn').addEventListener('click', () => {
        modal.classList.remove('active');
      });
    }

    modal.classList.add('active');
  }

  // --- Invoice Modal / Window ---
  function openInvoicePrintView(order) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocker prevented invoice window. Please allow popups.', 'warning');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>NammaStore Tax Invoice #${order.id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .brand { font-size: 24px; font-weight: 800; color: #d97706; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          th { background: #f8fafc; font-weight: 700; }
          .total-box { margin-left: auto; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .grand-total { font-weight: 800; font-size: 18px; border-top: 2px solid #0f172a; padding-top: 10px; color: #0f172a; }
          .footer { margin-top: 50px; font-size: 11px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">NammaStore Retail Ltd.</div>
            <div>GSTIN: 29AABCN8921K1ZZ</div>
            <div>Bengaluru, Karnataka, India</div>
          </div>
          <div style="text-align: right;">
            <h2>TAX INVOICE</h2>
            <div><strong>Invoice No:</strong> ${order.id}</div>
            <div><strong>Date:</strong> ${new Date(order.date).toLocaleDateString()}</div>
          </div>
        </div>

        <div>
          <strong>Billed & Shipped To:</strong>
          <div>${order.shippingAddress.fullName}</div>
          <div>${order.shippingAddress.street}</div>
          <div>${order.shippingAddress.city}, Karnataka - ${order.shippingAddress.pincode}</div>
          <div>Phone: ${order.shippingAddress.phone}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(i => `
              <tr>
                <td>${i.name}</td>
                <td>${i.quantity}</td>
                <td>₹${i.price.toLocaleString('en-IN')}</td>
                <td>₹${(i.price * i.quantity).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row"><span>Subtotal:</span> <span>₹${order.subtotal.toLocaleString('en-IN')}</span></div>
          <div class="total-row"><span>Discount:</span> <span>-₹${(order.discount || 0).toLocaleString('en-IN')}</span></div>
          <div class="total-row"><span>Shipping Fee:</span> <span>${order.shippingCost === 0 ? 'FREE' : '₹' + order.shippingCost}</span></div>
          <div class="total-row grand-total"><span>Total Paid:</span> <span>₹${order.total.toLocaleString('en-IN')}</span></div>
        </div>

        <div class="footer">
          This is a computer generated invoice and requires no physical signature. Thank you for supporting regional artisans & craftsmanship with NammaStore!
        </div>

        <script>
          window.print();
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  // --- Reset All Filters Helper ---
  function resetFilters() {
    state.selectedCategory = 'all';
    state.searchQuery = '';
    state.searchResultIds = null;
    state.minPrice = 0;
    state.maxPrice = 350000;
    state.ratingFilter = 0;
    state.onlyInStock = false;
    state.onlyExpress = false;
    state.sortBy = 'featured';

    const sInput = document.getElementById('search-input');
    if (sInput) sInput.value = '';

    const minSlider = document.getElementById('price-slider-min');
    const maxSlider = document.getElementById('price-slider-max');
    if (minSlider) minSlider.value = 0;
    if (maxSlider) maxSlider.value = 350000;
    const minPrice = document.getElementById('filter-min-price');
    const maxPrice = document.getElementById('filter-max-price');
    if (minPrice) minPrice.value = 0;
    if (maxPrice) maxPrice.value = 350000;
    const city = document.getElementById('filter-city');
    if (city) city.value = '';

    renderCategories();
    searchCatalog().catch(() => renderProducts());
    showToast('Filters cleared', 'info');
  }

  // --- Social Proof Toast Engine ---
  function initSocialProofPopup() {
    const popup = document.getElementById('live-social-popup');
    if (!popup) return;

    const names = ['Priya', 'Arjun', 'Suresh', 'Kavitha', 'Vikram', 'Divya', 'Deepak'];
    const cities = ['Bengaluru', 'Chennai', 'Hyderabad', 'Mysuru', 'Kochi', 'Coimbatore'];

    setInterval(() => {
      const randProd = window.PRODUCTS[Math.floor(Math.random() * window.PRODUCTS.length)];
      const randName = names[Math.floor(Math.random() * names.length)];
      const randCity = cities[Math.floor(Math.random() * cities.length)];

      popup.innerHTML = `
        <div class="glass-panel p-3 rounded-2xl flex items-center gap-3 shadow-xl max-w-sm border border-amber-500/20">
          <img src="${randProd.images[0]}" class="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700" alt="prod">
          <div class="flex-1 min-w-0 text-xs">
            <div class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <span>${randName} from ${randCity}</span>
              <span class="text-amber-500">✨</span>
            </div>
            <div class="text-[11px] text-slate-500 truncate">Purchased ${randProd.name}</div>
            <div class="text-[10px] text-emerald-600 font-semibold">2 minutes ago • Verified Buyer</div>
          </div>
          <button id="close-social-popup-btn" class="text-slate-400 hover:text-slate-600 text-xs p-1">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `;

      popup.classList.add('active');

      const closeBtn = document.getElementById('close-social-popup-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => popup.classList.remove('active'));
      }

      setTimeout(() => {
        popup.classList.remove('active');
      }, 5500);
    }, 28000);
  }

  // --- Global Toast Dispatcher ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-item';

    let icon = 'fa-circle-info text-blue-500';
    if (type === 'success') icon = 'fa-circle-check text-emerald-500';
    if (type === 'warning') icon = 'fa-triangle-exclamation text-amber-500';
    if (type === 'error') icon = 'fa-circle-xmark text-rose-500';

    toast.innerHTML = `
      <i class="fa-solid ${icon} text-lg"></i>
      <span class="text-xs sm:text-sm font-semibold flex-1">${message}</span>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
  window.showToast = showToast;

  // --- Attach Filter Sidebar controls ---
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderProducts();
    });
  }

  const gridViewBtn = document.getElementById('view-grid-btn');
  const listViewBtn = document.getElementById('view-list-btn');
  if (gridViewBtn && listViewBtn) {
    gridViewBtn.addEventListener('click', () => {
      state.viewMode = 'grid';
      gridViewBtn.className = 'p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600';
      listViewBtn.className = 'p-2 rounded-lg text-slate-400 hover:text-slate-600';
      renderProducts();
    });
    listViewBtn.addEventListener('click', () => {
      state.viewMode = 'list';
      listViewBtn.className = 'p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600';
      gridViewBtn.className = 'p-2 rounded-lg text-slate-400 hover:text-slate-600';
      renderProducts();
    });
  }

  const inStockCheckbox = document.getElementById('filter-in-stock');
  if (inStockCheckbox) {
    inStockCheckbox.addEventListener('change', (e) => {
      state.onlyInStock = e.target.checked;
      renderProducts();
    });
  }

  const expressCheckbox = document.getElementById('filter-express');
  if (expressCheckbox) {
    expressCheckbox.addEventListener('change', (e) => {
      state.onlyExpress = e.target.checked;
      renderProducts();
    });
  }

  const cityFilter = document.getElementById('filter-city');
  if (cityFilter) cityFilter.addEventListener('change', () => searchCatalog().catch(() => renderProducts()));
  ['filter-min-price', 'filter-max-price'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      state.minPrice = Math.max(0, Number(document.getElementById('filter-min-price').value) || 0);
      state.maxPrice = Math.max(state.minPrice, Number(document.getElementById('filter-max-price').value) || 350000);
      searchCatalog().catch(() => renderProducts());
    });
  });

  // Wishlist Page open
  const wishBtn = document.getElementById('wishlist-btn');
  const mobileWishBtn = document.getElementById('mobile-wishlist-btn');
  [wishBtn, mobileWishBtn].forEach(b => {
    if (b) b.addEventListener('click', () => {
      renderWishlistPage();
    });
  });

  // Track Order top header link
  const trackOrderHeaderLink = document.getElementById('track-order-header-link');
  if (trackOrderHeaderLink) {
    trackOrderHeaderLink.addEventListener('click', (e) => {
      e.preventDefault();
      openOrderTrackingModal('NM-89214');
    });
  }

  // Compare Drawer Toggle
  const compBtn = document.getElementById('compare-btn');
  if (compBtn) compBtn.addEventListener('click', openCompareDrawer);

  const compCloseBtn = document.getElementById('compare-drawer-close-btn');
  if (compCloseBtn) compCloseBtn.addEventListener('click', closeCompareDrawer);

  const compClearBtn = document.getElementById('compare-clear-all-btn');
  if (compClearBtn) compClearBtn.addEventListener('click', () => {
    window.Store.clearCompare();
    showToast('Comparison cleared', 'info');
  });

  // Checkout Modal Close
  const closeCheckoutBtn = document.getElementById('checkout-modal-close-btn');
  if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckoutModal);

  // Fit Locker Buttons
  const fitLockerNavBtn = document.getElementById('fit-locker-nav-btn');
  const mobileFitLockerBtn = document.getElementById('mobile-fitlocker-btn');
  [fitLockerNavBtn, mobileFitLockerBtn].forEach(b => {
    if (b) b.addEventListener('click', openFitLockerModal);
  });

  // Fit Locker & Scanner Modal Backdrop close
  const fitLockerModalEl = document.getElementById('fit-locker-modal');
  if (fitLockerModalEl) {
    fitLockerModalEl.addEventListener('click', (e) => {
      if (e.target === fitLockerModalEl) closeFitLockerModal();
    });
  }

  const clothScannerModalEl = document.getElementById('cloth-scanner-modal');
  if (clothScannerModalEl) {
    clothScannerModalEl.addEventListener('click', (e) => {
      if (e.target === clothScannerModalEl) closeClothScannerModal();
    });
  }

  // User Account Modal / Profile Page
  const accountBtn = document.getElementById('user-account-btn');
  if (accountBtn) accountBtn.addEventListener('click', () => {
    if (sessionStorage.getItem('nammastore-prototype-auth') === '1') {
      document.body.classList.remove('auth-gate');
      renderProfilePage();
      fetch('/api/orders').then(response => response.ok ? response.json() : null).then(data => {
        if (data?.orders?.length) {
          window.Store.state.orders = data.orders;
          window.Store.save();
          renderProfilePage();
        }
      }).catch(error => console.warn('Could not load orders from PostgreSQL:', error));
    } else {
      renderLoginPage();
    }
  });
});
