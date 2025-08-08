document.addEventListener('DOMContentLoaded', () => {

    // --- SELECTORES DEL DOM (Sin cambios) ---
    const productsContainer = document.getElementById('productsContainer');
    const loadingContainer = document.getElementById('loadingContainer');
    const searchInput = document.getElementById('searchInput');
    const cartCountSpan = document.getElementById('cartCount');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const processPaymentBtn = document.getElementById('processPaymentBtn');
    
    // Selectores de Modales
    const quantityModalEl = document.getElementById('quantityModal');
    const cartModalEl = document.getElementById('cartModal');
    const paymentModalEl = document.getElementById('paymentModal');
    
    // Instancias de Modales de Bootstrap
    const quantityModal = new bootstrap.Modal(quantityModalEl);
    const cartModal = new bootstrap.Modal(cartModalEl);
    const paymentModal = new bootstrap.Modal(paymentModalEl);

    // --- ESTADO DE LA APLICACIÓN ---
    let allComics = [];
    let cart = [];
    let currentComic = null;

    // --- CONSTANTES ---
    const API_URL = 'https://cdn.jsdelivr.net/gh/Tiresmoney830/json/comics.json';

    // --- LÓGICA PRINCIPAL ---

    const loadComics = async () => {
        try {
            loadingContainer.style.display = 'flex';
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Error en la red: ${response.statusText}`);
            }
            const data = await response.json();
            allComics = data.filter(comic => comic && comic.codigo); 
            displayComics(allComics);
        } catch (error) {
            console.error('Error al cargar los comics:', error);
            loadingContainer.innerHTML = `<p class="text-center text-danger">No se pudieron cargar los productos.</p>`;
        } finally {
            if (loadingContainer.style.display !== 'none') {
                 loadingContainer.style.display = 'none';
            }
        }
    };

    const displayComics = (comics) => {
        productsContainer.innerHTML = '';
        if (!comics || comics.length === 0) {
            productsContainer.innerHTML = '<p class="text-center col-12">No se encontraron comics.</p>';
            return;
        }
        comics.forEach(comic => {
            if (!comic) return;
            const card = document.createElement('div');
            card.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
            const generoOriginal = comic.genero || 'No especificado';
            const generoLimpio = generoOriginal.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
            const imageUrl = comic.imagen || 'https://placeholder.com/350x500.png?text=Imagen+no+disponible';
            card.innerHTML = `
                <div class="card h-100">
                    <img src="${imageUrl}" class="card-img-top" alt="${comic.titulo || 'N/A'}" loading="lazy">
                    <div class="card-body">
                        <h5 class="card-title">${comic.titulo || 'N/A'}</h5>
                        <p class="card-text description"><strong>Editorial:</strong> ${comic.editorial || 'N/A'}</p>
                        <p class="card-text"><strong>Género:</strong> ${generoLimpio}</p>
                        <p class="card-text fw-bold fs-5 text-primary">${formatCurrency(comic.precio_venta)}</p>
                        <button class="btn btn-primary w-100 btn-add-to-cart" data-codigo="${comic.codigo}" aria-label="Añadir ${comic.titulo || 'comic'} al carrito">
                            <i class="fas fa-cart-plus me-2"></i>Añadir al Carrito
                        </button>
                    </div>
                </div>
            `;
            productsContainer.appendChild(card);
        });
        addAddToCartListeners();
    };

    const addAddToCartListeners = () => {
        const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const codigo = event.currentTarget.dataset.codigo;
                currentComic = allComics.find(c => c && c.codigo === codigo);
                if (currentComic) {
                    showQuantityModal();
                } else {
                    console.error(`No se encontró el comic con el código: ${codigo}`);
                }
            });
        });
    };
    
    const showQuantityModal = () => {
        document.getElementById('quantityInput').value = 1;
        quantityModal.show();
    };

    document.getElementById('addToCartBtnModal').addEventListener('click', () => {
        const quantity = parseInt(document.getElementById('quantityInput').value, 10);
        if (currentComic && quantity > 0) {
            addItemToCart(currentComic, quantity);
            quantityModal.hide();
        } else {
            alert('Por favor, introduce una cantidad válida.');
        }
    });

    const addItemToCart = (comic, quantity) => {
        const existingItem = cart.find(item => item.codigo === comic.codigo);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ ...comic, quantity });
        }
        updateCartUI();
    };

    // ==========================================================
    // ========== NUEVA FUNCIÓN PARA ELIMINAR DEL CARRITO =========
    // ==========================================================
    const removeItemFromCart = (codigo) => {
        // Filtramos el carrito para mantener todos los artículos EXCEPTO el que coincida con el código
        cart = cart.filter(item => item.codigo !== codigo);
        // Actualizamos la UI para reflejar el cambio
        updateCartUI();
    };

    // ==========================================================
    // ====== NUEVA FUNCIÓN PARA ACTIVAR BOTONES DE ELIMINAR ======
    // ==========================================================
    const addRemoveFromCartListeners = () => {
        const removeFromCartButtons = document.querySelectorAll('.btn-remove-from-cart');
        removeFromCartButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                // Obtenemos el código del artículo a eliminar del atributo data-codigo
                const codigo = event.currentTarget.dataset.codigo;
                removeItemFromCart(codigo);
            });
        });
    };

    const updateCartUI = () => {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let totalItems = 0;
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Tu carrito está vacío.</p>';
        } else {
            cart.forEach(item => {
                const cartImageUrl = item.imagen || 'https://placeholder.com/80x120.png?text=N/A';
                const subtotal = (item.precio_venta || 0) * item.quantity;
                total += subtotal;
                totalItems += item.quantity;
                const cartItemDiv = document.createElement('div');
                cartItemDiv.className = 'cart-item';

                // ==========================================================
                // ========= CAMBIO: AÑADIMOS EL BOTÓN DE ELIMINAR AQUÍ =======
                // ==========================================================
                cartItemDiv.innerHTML = `
                    <img src="${cartImageUrl}" alt="${item.titulo || 'N/A'}">
                    <div class="cart-item-details">
                        <h6 class="mb-1">${item.titulo || 'N/A'}</h6>
                        <p class="mb-1 text-muted">Cantidad: ${item.quantity}</p>
                        <p class="mb-0 fw-bold">${formatCurrency(subtotal)}</p>
                    </div>
                    <button class="btn btn-danger btn-sm btn-remove-from-cart" data-codigo="${item.codigo}" aria-label="Eliminar ${item.titulo} del carrito">
                        <i class="fas fa-trash-can"></i>
                    </button>
                `;
                cartItemsContainer.appendChild(cartItemDiv);
            });
            // ==========================================================
            // ====== CAMBIO: LLAMAMOS A LA FUNCIÓN PARA ACTIVAR BOTONES ====
            // ==========================================================
            addRemoveFromCartListeners();
        }
        cartTotalSpan.textContent = formatCurrency(total);
        cartCountSpan.textContent = totalItems;
        cartCountSpan.classList.add('updated');
        setTimeout(() => cartCountSpan.classList.remove('updated'), 500);
    };

    // El resto del código permanece exactamente igual
    const filterComics = () => {
        const query = searchInput.value.toLowerCase().trim();
        const filteredComics = allComics.filter(comic => 
            comic && 
            ((comic.titulo && comic.titulo.toLowerCase().includes(query)) ||
            (comic.editorial && comic.editorial.toLowerCase().includes(query)))
        );
        displayComics(filteredComics);
    };

    const handlePayment = () => {
        if (cart.length === 0) {
            alert('Tu carrito está vacío. Añade productos antes de pagar.');
            return;
        }
        const cardName = document.getElementById('cardName').value;
        const cardNumber = document.getElementById('cardNumber').value;
        if (!cardName || !cardNumber) {
            alert('Por favor, completa los datos de pago.');
            return;
        }
        alert('¡Pago procesado con éxito! Generando tu factura...');
        generateInvoice(cardName);
        cart = [];
        updateCartUI();
        paymentModal.hide();
        const cartModalInstance = bootstrap.Modal.getInstance(cartModalEl);
        if (cartModalInstance && cartModalInstance._isShown) {
             cartModalInstance.hide();
        }
    };
    
    const generateInvoice = (customerName) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 20;
        let total = 0;
        doc.setFontSize(22);
        doc.text("Factura - Comic Hub", 105, y, { align: 'center' });
        y += 10;
        doc.setFontSize(12);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, y);
        doc.text(`Cliente: ${customerName}`, 20, y += 7);
        y += 10;
        doc.setFontSize(14);
        doc.text("Detalle de la Compra:", 20, y);
        y += 10;
        doc.setFontSize(10);
        cart.forEach(item => {
            const subtotal = (item.precio_venta || 0) * item.quantity;
            total += subtotal;
            doc.text(`${item.quantity}x - ${item.titulo || 'N/A'} (${item.editorial || 'N/A'})`, 20, y);
            doc.text(`${formatCurrency(subtotal)}`, 190, y, { align: 'right' });
            y += 7;
        });
        y += 5;
        doc.line(20, y, 190, y);
        y += 7;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text("Total:", 150, y);
        doc.text(`${formatCurrency(total)}`, 190, y, { align: 'right' });
        doc.save(`factura-comichub-${new Date().getTime()}.pdf`);
    };

    const formatCurrency = (value) => {
        if (typeof value !== 'number') {
            return '$0.00';
        }
        return value.toLocaleString('en-US', { style: 'currency', 'currency': 'USD' });
    };

    // --- EVENT LISTENERS ---
    searchInput.addEventListener('input', filterComics);
    checkoutBtn.addEventListener('click', () => paymentModal.show());
    processPaymentBtn.addEventListener('click', handlePayment);

    // --- INICIALIZACIÓN ---
    loadComics();
});