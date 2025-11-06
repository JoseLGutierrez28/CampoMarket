class DataStore {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('campomarket_users')) || [];
        this.products = JSON.parse(localStorage.getItem('campomarket_products')) || this.getDefaultProducts();
        this.orders = JSON.parse(localStorage.getItem('campomarket_orders')) || [];
        this.cart = JSON.parse(localStorage.getItem('campomarket_cart')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('campomarket_currentUser')) || null;

        this.saveData();
    }

    getDefaultProducts() {
        return [
            {
                id: 1,
                name: "Tomates Orgánicos",
                description: "Tomates frescos cultivados sin pesticidas",
                price: 2.50,
                category: "vegetables",
                stock: 50,
                producerId: 0,
                image: "🍅"
            },
            {
                id: 2,
                name: "Manzanas Rojas",
                description: "Manzanas dulces y jugosas de la temporada",
                price: 3.00,
                category: "fruits",
                stock: 30,
                producerId: 0,
                image: "🍎"
            },
            {
                id: 3,
                name: "Leche Fresca",
                description: "Leche entera recién ordeñada",
                price: 4.50,
                category: "dairy",
                stock: 20,
                producerId: 0,
                image: "🥛"
            },
            {
                id: 4,
                name: "Maíz Dulce",
                description: "Maíz fresco ideal para asar o cocinar",
                price: 1.80,
                category: "vegetables",
                stock: 40,
                producerId: 0,
                image: "🌽"
            },
            {
                id: 5,
                name: "Huevos de Campo",
                description: "Huevos frescos de gallinas criadas en libertad",
                price: 5.00,
                category: "dairy",
                stock: 25,
                producerId: 0,
                image: "🥚"
            },
            {
                id: 6,
                name: "Fresas Silvestres",
                description: "Fresas pequeñas y dulces de cultivo natural",
                price: 4.20,
                category: "fruits",
                stock: 15,
                producerId: 0,
                image: "🍓"
            }
        ];
    }

    saveData() {
        localStorage.setItem('campomarket_users', JSON.stringify(this.users));
        localStorage.setItem('campomarket_products', JSON.stringify(this.products));
        localStorage.setItem('campomarket_orders', JSON.stringify(this.orders));
        localStorage.setItem('campomarket_cart', JSON.stringify(this.cart));
        if (this.currentUser) {
            localStorage.setItem('campomarket_currentUser', JSON.stringify(this.currentUser));
        } else {
            localStorage.removeItem('campomarket_currentUser');
        }
    }

    addUser(user) {
        user.id = this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1;
        this.users.push(user);
        this.saveData();
        return user;
    }

    findUserByEmail(email) {
        return this.users.find(user => user.email === email);
    }

    addProduct(product) {
        product.id = this.products.length > 0 ? Math.max(...this.products.map(p => p.id)) + 1 : 1;
        product.producerId = this.currentUser.id;
        this.products.push(product);
        this.saveData();
        return product;
    }

    getProductsByProducer(producerId) {
        return this.products.filter(product => product.producerId === producerId);
    }

    getAllProducts() {
        return this.products;
    }

    getProductById(id) {
        return this.products.find(product => product.id === id);
    }

    addToCart(productId, quantity = 1) {
        const existingItem = this.cart.find(item => item.productId === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                productId: productId,
                quantity: quantity
            });
        }

        this.saveData();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.productId !== productId);
        this.saveData();
    }

    updateCartItem(productId, quantity) {
        const item = this.cart.find(item => item.productId === productId);
        if (item) {
            item.quantity = quantity;
            this.saveData();
        }
    }

    getCartItems() {
        return this.cart.map(item => {
            const product = this.getProductById(item.productId);
            return {
                ...item,
                product: product
            };
        }).filter(item => item.product); // Filter out items with invalid products
    }

    clearCart() {
        this.cart = [];
        this.saveData();
    }

    createOrder() {
        const cartItems = this.getCartItems();
        if (cartItems.length === 0) return null;

        const order = {
            id: this.orders.length > 0 ? Math.max(...this.orders.map(o => o.id)) + 1 : 1,
            userId: this.currentUser.id,
            items: cartItems,
            total: this.calculateCartTotal(),
            date: new Date().toISOString(),
            status: 'pending'
        };

        this.orders.push(order);
        this.clearCart();
        this.saveData();

        return order;
    }

    getOrdersByUser(userId) {
        return this.orders.filter(order => order.userId === userId);
    }

    getOrdersForProducer(producerId) {
        return this.orders.filter(order =>
            order.items.some(item => {
                const product = this.getProductById(item.productId);
                return product && product.producerId === producerId;
            })
        );
    }

    calculateCartTotal() {
        const cartItems = this.getCartItems();
        return cartItems.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
    }
}

// UI Controller
class UIController {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.init();
    }

    init() {
        this.bindEvents();
        this.showPage('home');
        this.updateUI();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                this.showPage(page);
                this.closeMobileMenu();
            });
        });

        // Auth buttons
        document.getElementById('login-btn').addEventListener('click', () => {
            this.showPage('login');
        });

        document.getElementById('register-btn').addEventListener('click', () => {
            this.showPage('register');
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Mobile auth buttons
        document.getElementById('mobile-login-btn').addEventListener('click', () => {
            this.showPage('login');
            this.closeMobileMenu();
        });

        document.getElementById('mobile-register-btn').addEventListener('click', () => {
            this.showPage('register');
            this.closeMobileMenu();
        });

        document.getElementById('mobile-logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Auth forms
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        // Auth navigation
        document.getElementById('go-to-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('register');
        });

        document.getElementById('go-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('login');
        });

        // Explore products button
        document.getElementById('explore-products').addEventListener('click', () => {
            this.showPage('products');
        });

        // Dashboard tabs
        document.querySelectorAll('.dashboard-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.target.getAttribute('data-tab');
                this.showDashboardTab(tabName);
            });
        });

        // Add product form
        document.getElementById('add-product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });

        // Profile form
        document.getElementById('profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });

        // Contact form
        document.getElementById('contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitContactForm();
        });

        // Checkout button
        document.getElementById('checkout-btn').addEventListener('click', () => {
            this.checkout();
        });

        // Mobile menu
        document.getElementById('menu-toggle').addEventListener('click', () => {
            this.openMobileMenu();
        });

        document.getElementById('close-menu').addEventListener('click', () => {
            this.closeMobileMenu();
        });

        document.getElementById('overlay').addEventListener('click', () => {
            this.closeMobileMenu();
        });
    }

    showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Show selected page
        document.getElementById(`${pageName}-page`).classList.remove('hidden');

        // Update page-specific content
        if (pageName === 'home') {
            this.loadFeaturedProducts();
        } else if (pageName === 'products') {
            this.loadAllProducts();
        } else if (pageName === 'dashboard') {
            this.loadDashboard();
        } else if (pageName === 'cart') {
            this.loadCart();
        }
    }

    showDashboardTab(tabName) {
        // Update active tab
        document.querySelectorAll('.dashboard-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.dashboard-tab[data-tab="${tabName}"]`).classList.add('active');

        // Show active tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load tab-specific content
        if (tabName === 'products') {
            this.loadMyProducts();
        } else if (tabName === 'orders') {
            this.loadOrders();
        } else if (tabName === 'profile') {
            this.loadProfile();
        }
    }

    updateUI() {
        const user = this.dataStore.currentUser;
        const userMenu = document.getElementById('user-menu');
        const mobileUserMenu = document.getElementById('mobile-user-menu');
        const authButtons = document.getElementById('login-btn').parentElement;
        const mobileAuthButtons = document.getElementById('mobile-login-btn').parentElement;

        if (user) {
            // User is logged in
            authButtons.classList.add('hidden');
            userMenu.classList.remove('hidden');
            document.getElementById('user-name').textContent = user.name;

            mobileAuthButtons.classList.add('hidden');
            mobileUserMenu.classList.remove('hidden');
            document.getElementById('mobile-user-name').textContent = user.name;

            // Update navigation based on user type
            if (user.type === 'producer') {
                // Add dashboard link for producers
                if (!document.querySelector('.nav-link[data-page="dashboard"]')) {
                    const nav = document.querySelector('.desktop-nav ul');
                    const dashboardItem = document.createElement('li');
                    dashboardItem.innerHTML = '<a href="#" class="nav-link" data-page="dashboard">Mi Panel</a>';
                    nav.appendChild(dashboardItem);

                    // Re-bind events for new link
                    dashboardItem.querySelector('.nav-link').addEventListener('click', (e) => {
                        e.preventDefault();
                        this.showPage('dashboard');
                    });
                }

                // Add to mobile menu
                document.getElementById('mobile-dashboard-link').classList.remove('hidden');
            }

            // Add cart link for consumers
            if (!document.querySelector('.nav-link[data-page="cart"]')) {
                const nav = document.querySelector('.desktop-nav ul');
                const cartItem = document.createElement('li');
                cartItem.innerHTML = '<a href="#" class="nav-link" data-page="cart">Carrito</a>';
                nav.appendChild(cartItem);

                // Re-bind events for new link
                cartItem.querySelector('.nav-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showPage('cart');
                });
            }

            // Add to mobile menu
            document.getElementById('mobile-cart-link').classList.remove('hidden');
        } else {
            // User is not logged in
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');

            mobileAuthButtons.classList.remove('hidden');
            mobileUserMenu.classList.add('hidden');

            // Remove dashboard and cart links if present
            const dashboardLink = document.querySelector('.nav-link[data-page="dashboard"]');
            const cartLink = document.querySelector('.nav-link[data-page="cart"]');
            if (dashboardLink) dashboardLink.parentElement.remove();
            if (cartLink) cartLink.parentElement.remove();

            // Hide from mobile menu
            document.getElementById('mobile-dashboard-link').classList.add('hidden');
            document.getElementById('mobile-cart-link').classList.add('hidden');
        }
    }

    openMobileMenu() {
        document.getElementById('mobile-nav').classList.add('active');
        document.getElementById('overlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeMobileMenu() {
        document.getElementById('mobile-nav').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const user = this.dataStore.findUserByEmail(email);

        if (user && user.password === password) {
            this.dataStore.currentUser = user;
            this.dataStore.saveData();
            this.showNotification('Inicio de sesión exitoso', 'success');
            this.showPage('home');
            this.updateUI();
            this.closeMobileMenu();
        } else {
            this.showNotification('Email o contraseña incorrectos', 'error');
        }
    }

    register() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const type = document.getElementById('register-type').value;

        if (this.dataStore.findUserByEmail(email)) {
            this.showNotification('Este email ya está registrado', 'error');
            return;
        }

        const user = {
            name: name,
            email: email,
            password: password,
            type: type
        };

        this.dataStore.addUser(user);
        this.dataStore.currentUser = user;
        this.dataStore.saveData();

        this.showNotification('Registro exitoso', 'success');
        this.showPage('home');
        this.updateUI();
        this.closeMobileMenu();
    }

    logout() {
        this.dataStore.currentUser = null;
        this.dataStore.saveData();
        this.showNotification('Sesión cerrada', 'success');
        this.showPage('home');
        this.updateUI();
        this.closeMobileMenu();
    }

    loadFeaturedProducts() {
        const container = document.getElementById('featured-products');
        const products = this.dataStore.getAllProducts().slice(0, 3); // Show first 3 products as featured

        this.renderProducts(products, container);
    }

    loadAllProducts() {
        const container = document.getElementById('all-products');
        const products = this.dataStore.getAllProducts();

        this.renderProducts(products, container);
    }

    loadMyProducts() {
        const container = document.getElementById('my-products');
        const products = this.dataStore.getProductsByProducer(this.dataStore.currentUser.id);

        this.renderProducts(products, container, true);
    }

    renderProducts(products, container, showActions = false) {
        container.innerHTML = '';

        if (products.length === 0) {
            container.innerHTML = '<p>No hay productos disponibles</p>';
            return;
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';

            let actionsHTML = '';
            if (showActions) {
                actionsHTML = `
                            <div style="margin-top: 1rem;">
                                <button class="btn btn-outline" style="color: var(--primary); border-color: var(--primary);" onclick="uiController.editProduct(${product.id})">Editar</button>
                                <button class="btn btn-outline" style="color: #f44336; border-color: #f44336;" onclick="uiController.deleteProduct(${product.id})">Eliminar</button>
                            </div>
                        `;
            } else {
                actionsHTML = `
                            <button class="btn btn-primary" onclick="uiController.addToCart(${product.id})">Agregar al Carrito</button>
                        `;
            }

            productCard.innerHTML = `
                        <div class="product-image">
                            <span style="font-size: 3rem;">${product.image || '🌱'}</span>
                        </div>
                        <div class="product-info">
                            <h3 class="product-title">${product.name}</h3>
                            <p class="product-price">$${product.price.toFixed(2)}</p>
                            <p class="product-description">${product.description}</p>
                            <div class="product-meta">
                                <span>Categoría: ${this.getCategoryName(product.category)}</span>
                                <span>Stock: ${product.stock}</span>
                            </div>
                            ${actionsHTML}
                        </div>
                    `;

            container.appendChild(productCard);
        });
    }

    getCategoryName(category) {
        const categories = {
            'vegetables': 'Verduras',
            'fruits': 'Frutas',
            'grains': 'Granos',
            'dairy': 'Lácteos',
            'meat': 'Carnes',
            'other': 'Otros'
        };

        return categories[category] || category;
    }

    addProduct() {
        const name = document.getElementById('product-name').value;
        const description = document.getElementById('product-description').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const category = document.getElementById('product-category').value;
        const stock = parseInt(document.getElementById('product-stock').value);

        const product = {
            name: name,
            description: description,
            price: price,
            category: category,
            stock: stock,
            image: this.getProductEmoji(category)
        };

        this.dataStore.addProduct(product);
        this.showNotification('Producto agregado exitosamente', 'success');
        document.getElementById('add-product-form').reset();
        this.loadMyProducts();
    }

    getProductEmoji(category) {
        const emojis = {
            'vegetables': '🥦',
            'fruits': '🍎',
            'grains': '🌾',
            'dairy': '🥛',
            'meat': '🍖',
            'other': '🌱'
        };

        return emojis[category] || '🌱';
    }

    editProduct(productId) {
        // In a real application, this would open a form to edit the product
        this.showNotification('Funcionalidad de edición en desarrollo', 'info');
    }

    deleteProduct(productId) {
        if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            this.dataStore.products = this.dataStore.products.filter(p => p.id !== productId);
            this.dataStore.saveData();
            this.showNotification('Producto eliminado', 'success');
            this.loadMyProducts();
        }
    }

    loadDashboard() {
        this.showDashboardTab('products');
        this.loadMyProducts();
    }

    loadProfile() {
        const user = this.dataStore.currentUser;
        document.getElementById('profile-name').value = user.name || '';
        document.getElementById('profile-email').value = user.email || '';
        document.getElementById('profile-phone').value = user.phone || '';
        document.getElementById('profile-address').value = user.address || '';
    }

    updateProfile() {
        const user = this.dataStore.currentUser;
        user.name = document.getElementById('profile-name').value;
        user.email = document.getElementById('profile-email').value;
        user.phone = document.getElementById('profile-phone').value;
        user.address = document.getElementById('profile-address').value;

        this.dataStore.saveData();
        this.showNotification('Perfil actualizado', 'success');
        this.updateUI();
    }

    loadOrders() {
        const container = document.getElementById('orders-list');
        const user = this.dataStore.currentUser;

        let orders = [];
        if (user.type === 'producer') {
            orders = this.dataStore.getOrdersForProducer(user.id);
        } else {
            orders = this.dataStore.getOrdersByUser(user.id);
        }

        if (orders.length === 0) {
            container.innerHTML = '<p>No hay pedidos</p>';
            return;
        }

        container.innerHTML = '';

        orders.forEach(order => {
            const orderElement = document.createElement('div');
            orderElement.className = 'product-card';
            orderElement.style.marginBottom = '1rem';

            const orderDate = new Date(order.date).toLocaleDateString();

            let itemsHTML = '';
            order.items.forEach(item => {
                itemsHTML += `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>${item.product.name} x ${item.quantity}</span>
                                <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `;
            });

            orderElement.innerHTML = `
                        <div class="product-info">
                            <h3 class="product-title">Pedido #${order.id}</h3>
                            <p>Fecha: ${orderDate}</p>
                            <p>Estado: <span style="color: ${order.status === 'pending' ? '#ff9800' : '#4caf50'}">${order.status === 'pending' ? 'Pendiente' : 'Completado'}</span></p>
                            <div style="margin-top: 1rem;">
                                ${itemsHTML}
                            </div>
                            <div style="border-top: 1px solid #eee; margin-top: 1rem; padding-top: 1rem; font-weight: bold;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span>Total:</span>
                                    <span>$${order.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    `;

            container.appendChild(orderElement);
        });
    }

    addToCart(productId) {
        if (!this.dataStore.currentUser) {
            this.showNotification('Debes iniciar sesión para agregar productos al carrito', 'error');
            this.showPage('login');
            return;
        }

        this.dataStore.addToCart(productId);
        this.showNotification('Producto agregado al carrito', 'success');
    }

    loadCart() {
        const container = document.getElementById('cart-items');
        const cartItems = this.dataStore.getCartItems();

        if (cartItems.length === 0) {
            container.innerHTML = '<p>Tu carrito está vacío</p>';
            this.updateCartSummary(0);
            return;
        }

        container.innerHTML = '';

        cartItems.forEach(item => {
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';

            cartItemElement.innerHTML = `
                        <div class="cart-item-image">
                            <span style="font-size: 2rem;">${item.product.image || '🌱'}</span>
                        </div>
                        <div class="cart-item-details">
                            <h3 class="cart-item-title">${item.product.name}</h3>
                            <p class="cart-item-price">$${item.product.price.toFixed(2)}</p>
                        </div>
                        <div class="cart-item-actions">
                            <div class="quantity-control">
                                <button class="quantity-btn" onclick="uiController.updateCartItemQuantity(${item.productId}, ${item.quantity - 1})">-</button>
                                <input type="number" class="quantity-input" value="${item.quantity}" min="1" onchange="uiController.updateCartItemQuantity(${item.productId}, this.value)">
                                <button class="quantity-btn" onclick="uiController.updateCartItemQuantity(${item.productId}, ${item.quantity + 1})">+</button>
                            </div>
                            <button class="remove-btn" onclick="uiController.removeFromCart(${item.productId})">Eliminar</button>
                        </div>
                    `;

            container.appendChild(cartItemElement);
        });

        this.updateCartSummary(this.dataStore.calculateCartTotal());
    }

    updateCartItemQuantity(productId, quantity) {
        if (quantity < 1) quantity = 1;

        const product = this.dataStore.getProductById(productId);
        if (quantity > product.stock) {
            this.showNotification(`Solo hay ${product.stock} unidades disponibles`, 'error');
            return;
        }

        this.dataStore.updateCartItem(productId, parseInt(quantity));
        this.loadCart();
    }

    removeFromCart(productId) {
        this.dataStore.removeFromCart(productId);
        this.loadCart();
    }

    updateCartSummary(subtotal) {
        const shipping = subtotal > 0 ? 5.00 : 0; // Fixed shipping cost
        const total = subtotal + shipping;

        document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('cart-shipping').textContent = `$${shipping.toFixed(2)}`;
        document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
    }

    checkout() {
        if (this.dataStore.getCartItems().length === 0) {
            this.showNotification('Tu carrito está vacío', 'error');
            return;
        }

        const order = this.dataStore.createOrder();
        if (order) {
            this.showNotification(`Pedido #${order.id} realizado con éxito`, 'success');
            this.showPage('home');
        }
    }

    submitContactForm() {
        this.showNotification('Mensaje enviado. Te contactaremos pronto.', 'success');
        document.getElementById('contact-form').reset();
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;

        // Set background color based on type
        if (type === 'success') {
            notification.style.backgroundColor = '#4caf50';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#f44336';
        } else {
            notification.style.backgroundColor = '#2196f3';
        }

        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize the application
const dataStore = new DataStore();
const uiController = new UIController(dataStore);

// Make uiController globally available for onclick handlers
window.uiController = uiController;