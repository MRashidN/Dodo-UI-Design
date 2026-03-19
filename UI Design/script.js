// ========================================
// DODO PRODUCT DASHBOARD - MAIN SCRIPT
// Author: Custom JavaScript
// Description: Advanced features and animations
// Compatible with GitHub Pages
// ========================================

class ProductDashboard {
    constructor() {
        // State Management
        this.allProducts = [];
        this.filteredProducts = [];
        this.categories = new Set();
        this.activeFilters = {
            category: 'all',
            search: '',
            sort: 'default',
            minPrice: 0,
            maxPrice: Infinity,
            rating: 0
        };
        this.viewMode = 'grid';
        this.wishlist = new Set(JSON.parse(localStorage.getItem('wishlist')) || []);
        this.recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
        
        // DOM Elements
        this.initDOMElements();
        
        // Initialize
        this.init();
    }
    
    initDOMElements() {
        // Main elements
        this.loadingScreen = document.querySelector('.loading-screen');
        this.mainContent = document.querySelector('.main-content');
        this.productsGrid = document.getElementById('productsGrid');
        this.loadingState = document.getElementById('loadingState');
        this.noResults = document.getElementById('noResults');
        
        // Filter elements
        this.searchInput = document.getElementById('searchInput');
        this.sortSelect = document.getElementById('sortSelect');
        this.categoryPills = document.getElementById('categoryPills');
        this.filterBtn = document.getElementById('filterBtn');
        this.priceFilterPanel = document.getElementById('priceFilterPanel');
        this.closeFilter = document.getElementById('closeFilter');
        this.minPrice = document.getElementById('minPrice');
        this.maxPrice = document.getElementById('maxPrice');
        this.applyPriceFilter = document.getElementById('applyPriceFilter');
        this.activeFiltersContainer = document.getElementById('activeFilters');
        this.filterCount = document.getElementById('filterCount');
        
        // View toggle
        this.gridView = document.getElementById('gridView');
        this.listView = document.getElementById('listView');
        
        // Stats elements
        this.totalProductsEl = document.getElementById('totalProducts');
        this.totalCategoriesEl = document.getElementById('totalCategories');
        this.avgPriceEl = document.getElementById('avgPrice');
        
        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');
        
        // Reset button
        this.resetBtn = document.getElementById('resetFilters');
    }
    
    async init() {
        this.setupEventListeners();
        this.initCustomCursor();
        this.checkTheme();
        await this.fetchProducts();
        this.hideLoadingScreen();
    }
    
    setupEventListeners() {
        // Search with debounce
        this.searchInput.addEventListener('input', this.debounce(() => this.handleSearch(), 300));
        
        // Sort
        this.sortSelect.addEventListener('change', () => this.handleSort());
        
        // View toggle
        this.gridView.addEventListener('click', () => this.setViewMode('grid'));
        this.listView.addEventListener('click', () => this.setViewMode('list'));
        
        // Filter panel
        this.filterBtn.addEventListener('click', () => this.toggleFilterPanel());
        this.closeFilter.addEventListener('click', () => this.toggleFilterPanel());
        this.applyPriceFilter.addEventListener('click', () => this.applyPriceFilterHandler());
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Reset filters
        this.resetBtn.addEventListener('click', () => this.resetAllFilters());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Save wishlist to localStorage
        window.addEventListener('beforeunload', () => {
            localStorage.setItem('wishlist', JSON.stringify([...this.wishlist]));
            localStorage.setItem('recentlyViewed', JSON.stringify(this.recentlyViewed));
        });
    }
    
    async fetchProducts() {
        try {
            this.showLoading();
            
            // Simulate network delay for smooth animation
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const response = await fetch('https://fakestoreapi.com/products');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Enhance products with additional data
            this.allProducts = data.map((product, index) => ({
                ...product,
                rating: (Math.random() * 2 + 3).toFixed(1), // Simulated rating between 3-5
                reviews: Math.floor(Math.random() * 500) + 50,
                inStock: Math.random() > 0.2,
                discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 10 : 0,
                featured: index < 5,
                animationDelay: index * 0.05
            }));
            
            this.filteredProducts = [...this.allProducts];
            
            // Extract categories
            this.allProducts.forEach(p => this.categories.add(p.category));
            
            // Update UI
            this.renderCategoryFilters();
            this.renderProducts();
            this.updateStats();
            
        } catch (error) {
            console.error('Fetch error:', error);
            this.showError('Failed to load products. Please refresh the page.');
        } finally {
            this.hideLoading();
        }
    }
    
    renderProducts() {
        if (this.filteredProducts.length === 0) {
            this.showNoResults();
            return;
        }
        
        this.hideNoResults();
        
        const productsHTML = this.filteredProducts.map(product => {
            const isWishlisted = this.wishlist.has(product.id);
            const discountedPrice = product.discount > 0 
                ? (product.price * (1 - product.discount / 100)).toFixed(2)
                : null;
            
            return `
                <div class="product-card" data-id="${product.id}" style="animation-delay: ${product.animationDelay}s">
                    ${product.featured ? '<span class="product-badge">Featured</span>' : ''}
                    <div class="product-image-wrapper">
                        <img 
                            src="${product.image}" 
                            class="product-image" 
                            alt="${product.title}"
                            loading="lazy"
                            onerror="this.onerror=null; this.src='https://via.placeholder.com/200x200?text=Product'"
                        >
                    </div>
                    <div class="product-content">
                        <span class="product-category">${product.category}</span>
                        <h3 class="product-title">${product.title}</h3>
                        
                        <div class="product-rating">
                            ${this.renderRatingStars(product.rating)}
                            <span class="rating-value">${product.rating}</span>
                            <span class="review-count">(${product.reviews} reviews)</span>
                        </div>
                        
                        <div class="product-footer">
                            <div class="price-wrapper">
                                ${product.discount > 0 ? `
                                    <span class="original-price">$${product.price}</span>
                                    <span class="product-price">${discountedPrice}</span>
                                    <span class="discount-badge">-${product.discount}%</span>
                                ` : `
                                    <span class="product-price">$${product.price}</span>
                                `}
                            </div>
                            
                            <div class="product-actions">
                                <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" 
                                        onclick="dashboard.toggleWishlist(${product.id})">
                                    <i class="bi ${isWishlisted ? 'bi-heart-fill' : 'bi-heart'}"></i>
                                </button>
                                <button class="quick-view-btn" onclick="dashboard.quickView(${product.id})">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                        </div>
                        
                        ${!product.inStock ? '<span class="out-of-stock">Out of Stock</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        this.productsGrid.innerHTML = productsHTML;
    }
    
    renderRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let starsHTML = '';
        
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="bi bi-star-fill text-warning"></i>';
        }
        
        if (halfStar) {
            starsHTML += '<i class="bi bi-star-half text-warning"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="bi bi-star text-warning"></i>';
        }
        
        return starsHTML;
    }
    
    renderCategoryFilters() {
        const categoriesArray = ['all', ...Array.from(this.categories)];
        
        this.categoryPills.innerHTML = categoriesArray.map(category => `
            <span class="category-pill ${category === this.activeFilters.category ? 'active' : ''}" 
                  data-category="${category}">
                ${category === 'all' ? '🏷️ All Categories' : category}
            </span>
        `).join('');
        
        // Add click handlers
        document.querySelectorAll('.category-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                this.activeFilters.category = pill.dataset.category;
                this.updateActiveFilters();
                this.filterProducts();
                
                // Update active class
                document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
            });
        });
    }
    
    filterProducts() {
        let filtered = [...this.allProducts];
        
        // Apply category filter
        if (this.activeFilters.category !== 'all') {
            filtered = filtered.filter(p => p.category === this.activeFilters.category);
        }
        
        // Apply search filter
        if (this.activeFilters.search) {
            const searchTerm = this.activeFilters.search.toLowerCase();
            filtered = filtered.filter(p => 
                p.title.toLowerCase().includes(searchTerm) || 
                p.description.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply price filter
        filtered = filtered.filter(p => 
            p.price >= this.activeFilters.minPrice && 
            p.price <= this.activeFilters.maxPrice
        );
        
        // Apply sorting
        this.applySorting(filtered);
        
        this.filteredProducts = filtered;
        this.renderProducts();
        this.updateFilterCount();
    }
    
    applySorting(products) {
        switch (this.activeFilters.sort) {
            case 'price-asc':
                products.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                products.sort((a, b) => b.price - a.price);
                break;
            case 'title-asc':
                products.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                products.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'rating':
                products.sort((a, b) => b.rating - a.rating);
                break;
            default:
                products.sort((a, b) => a.id - b.id);
        }
    }
    
    handleSearch() {
        this.activeFilters.search = this.searchInput.value;
        this.filterProducts();
    }
    
    handleSort() {
        this.activeFilters.sort = this.sortSelect.value;
        this.filterProducts();
    }
    
    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update toggle buttons
        this.gridView.classList.toggle('active', mode === 'grid');
        this.listView.classList.toggle('active', mode === 'list');
        
        // Update grid class
        this.productsGrid.classList.toggle('list-view', mode === 'list');
    }
    
    toggleFilterPanel() {
        this.priceFilterPanel.classList.toggle('show');
    }
    
    applyPriceFilterHandler() {
        this.activeFilters.minPrice = parseFloat(this.minPrice.value) || 0;
        this.activeFilters.maxPrice = parseFloat(this.maxPrice.value) || Infinity;
        
        this.updateActiveFilters();
        this.filterProducts();
        this.toggleFilterPanel();
    }
    
    updateActiveFilters() {
        const filters = [];
        
        if (this.activeFilters.category !== 'all') {
            filters.push({
                type: 'category',
                value: this.activeFilters.category,
                label: `Category: ${this.activeFilters.category}`
            });
        }
        
        if (this.activeFilters.search) {
            filters.push({
                type: 'search',
                value: this.activeFilters.search,
                label: `Search: "${this.activeFilters.search}"`
            });
        }
        
        if (this.activeFilters.minPrice > 0 || this.activeFilters.maxPrice < Infinity) {
            const min = this.activeFilters.minPrice || 0;
            const max = this.activeFilters.maxPrice === Infinity ? '∞' : this.activeFilters.maxPrice;
            filters.push({
                type: 'price',
                value: { min: this.activeFilters.minPrice, max: this.activeFilters.maxPrice },
                label: `Price: $${min} - $${max}`
            });
        }
        
        this.renderActiveFilters(filters);
    }
    
    renderActiveFilters(filters) {
        this.activeFiltersContainer.innerHTML = filters.map(filter => `
            <span class="filter-tag">
                ${filter.label}
                <i class="bi bi-x" onclick="dashboard.removeFilter('${filter.type}')"></i>
            </span>
        `).join('');
    }
    
    removeFilter(type) {
        switch (type) {
            case 'category':
                this.activeFilters.category = 'all';
                document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
                document.querySelector('[data-category="all"]').classList.add('active');
                break;
            case 'search':
                this.activeFilters.search = '';
                this.searchInput.value = '';
                break;
            case 'price':
                this.activeFilters.minPrice = 0;
                this.activeFilters.maxPrice = Infinity;
                this.minPrice.value = '';
                this.maxPrice.value = '';
                break;
        }
        
        this.updateActiveFilters();
        this.filterProducts();
    }
    
    updateFilterCount() {
        const count = Object.values(this.activeFilters).filter(v => 
            v && v !== 'all' && v !== 'default' && v !== 0 && v !== Infinity
        ).length;
        
        this.filterCount.textContent = count;
        this.filterCount.style.display = count > 0 ? 'inline-block' : 'none';
    }
    
    resetAllFilters() {
        this.activeFilters = {
            category: 'all',
            search: '',
            sort: 'default',
            minPrice: 0,
            maxPrice: Infinity,
            rating: 0
        };
        
        // Reset UI elements
        this.searchInput.value = '';
        this.sortSelect.value = 'default';
        this.minPrice.value = '';
        this.maxPrice.value = '';
        
        document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        document.querySelector('[data-category="all"]').classList.add('active');
        
        this.updateActiveFilters();
        this.filterProducts();
    }
    
    toggleWishlist(productId) {
        if (this.wishlist.has(productId)) {
            this.wishlist.delete(productId);
            this.showToast('Removed from wishlist', 'info');
        } else {
            this.wishlist.add(productId);
            this.showToast('Added to wishlist', 'success');
        }
        
        // Update button state
        const btn = document.querySelector(`.product-card[data-id="${productId}"] .wishlist-btn`);
        if (btn) {
            btn.classList.toggle('active');
            btn.innerHTML = `<i class="bi ${this.wishlist.has(productId) ? 'bi-heart-fill' : 'bi-heart'}"></i>`;
        }
    }
    
    async quickView(productId) {
        const product = this.allProducts.find(p => p.id === productId);
        
        if (!product) return;
        
        // Add to recently viewed
        this.recentlyViewed = [productId, ...this.recentlyViewed.filter(id => id !== productId)].slice(0, 5);
        
        const modalContent = document.getElementById('quickViewContent');
        modalContent.innerHTML = `
            <div class="quick-view-content">
                <div class="quick-view-image">
                    <img src="${product.image}" alt="${product.title}">
                </div>
                <div class="quick-view-details">
                    <span class="product-category">${product.category}</span>
                    <h3 class="mb-3">${product.title}</h3>
                    
                    <div class="product-rating mb-3">
                        ${this.renderRatingStars(product.rating)}
                        <span class="rating-value">${product.rating}</span>
                        <span class="review-count">(${product.reviews} reviews)</span>
                    </div>
                    
                    <p class="product-description mb-4">${product.description}</p>
                    
                    <div class="price-wrapper mb-4">
                        ${product.discount > 0 ? `
                            <span class="original-price me-2">$${product.price}</span>
                            <span class="product-price">$${(product.price * (1 - product.discount / 100)).toFixed(2)}</span>
                            <span class="discount-badge ms-2">-${product.discount}%</span>
                        ` : `
                            <span class="product-price">$${product.price}</span>
                        `}
                    </div>
                    
                    <div class="stock-status mb-4 ${product.inStock ? 'in-stock' : 'out-of-stock'}">
                        <i class="bi ${product.inStock ? 'bi-check-circle' : 'bi-x-circle'}"></i>
                        ${product.inStock ? 'In Stock' : 'Out of Stock'}
                    </div>
                    
                    <button class="btn btn-primary w-100" ${!product.inStock ? 'disabled' : ''}>
                        <i class="bi bi-cart-plus"></i>
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('quickViewModal'));
        modal.show();
    }
    
    updateStats() {
        if (this.totalProductsEl) {
            this.totalProductsEl.textContent = this.allProducts.length;
        }
        if (this.totalCategoriesEl) {
            this.totalCategoriesEl.textContent = this.categories.size;
        }
        
        const avgPrice = this.allProducts.reduce((sum, p) => sum + p.price, 0) / this.allProducts.length;
        if (this.avgPriceEl) {
            this.avgPriceEl.textContent = `$${avgPrice.toFixed(0)}`;
        }
    }
    
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    }
    
    checkTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }
    
    initCustomCursor() {
        const cursor = document.querySelector('.custom-cursor');
        const follower = document.querySelector('.custom-cursor-follower');
        
        if (!cursor || !follower) return;
        
        document.addEventListener('mousemove', (e) => {
            cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            follower.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            
            // Show cursor
            cursor.style.opacity = '1';
            follower.style.opacity = '1';
        });
        
        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = '0';
            follower.style.opacity = '0';
        });
        
        // Hover effect for interactive elements
        document.querySelectorAll('a, button, .product-card').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform += ' scale(1.5)';
                cursor.style.backgroundColor = 'rgba(79, 70, 229, 0.1)';
            });
            
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = cursor.style.transform.replace(' scale(1.5)', '');
                cursor.style.backgroundColor = 'transparent';
            });
        });
    }
    
    handleKeyboardShortcuts(e) {
        // Cmd/Ctrl + K to focus search
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            this.searchInput.focus();
        }
        
        // Escape to clear search
        if (e.key === 'Escape' && document.activeElement === this.searchInput) {
            this.searchInput.value = '';
            this.handleSearch();
        }
    }
    
    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast
        const toastId = `toast-${Date.now()}`;
        const bgColor = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-primary';
        
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgColor} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        // Initialize and show toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        
        // Remove after hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
    
    showLoading() {
        if (this.loadingState) {
            this.loadingState.style.display = 'block';
        }
        if (this.productsGrid) {
            this.productsGrid.style.display = 'none';
        }
    }
    
    hideLoading() {
        if (this.loadingState) {
            this.loadingState.style.display = 'none';
        }
        if (this.productsGrid) {
            this.productsGrid.style.display = 'grid';
        }
    }
    
    showNoResults() {
        if (this.noResults) {
            this.noResults.classList.add('show');
        }
        if (this.productsGrid) {
            this.productsGrid.style.display = 'none';
        }
    }
    
    hideNoResults() {
        if (this.noResults) {
            this.noResults.classList.remove('show');
        }
        if (this.productsGrid) {
            this.productsGrid.style.display = 'grid';
        }
    }
    
    showError(message) {
        // Create error alert
        const alertHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        const container = document.querySelector('.products-section .container');
        if (container) {
            container.insertAdjacentHTML('afterbegin', alertHTML);
        }
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new ProductDashboard();
});