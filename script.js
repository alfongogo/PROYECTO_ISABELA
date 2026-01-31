// Función para contactar por WhatsApp
// Número configurado: formato internacional sin el signo + ni espacios (ej: 521234567890)
const WHATSAPP_NUMBER = '5215587703453'; // +52 1 55 8770 3453

function contactarWhatsApp(producto) {
    let mensaje;
    if (producto) {
        mensaje = `Hola Isabela, me interesa el ${producto}. ¿Podrías darme informes o precio?`;
    } else {
        mensaje = `Hola Isabela, quiero hacer un pedido o pedir informes. ¿Me ayudas?`;
    }
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
} 

// Función para añadir al carrito (mejorada con animación y lógica)
function agregarAlCarrito(producto) {
    // Obtener info del producto (precio e imagen)
    const info = getProductInfoByName(producto);

    // Encontrar el nodo del producto para animar desde su imagen
    const node = getProductNodeByName(producto);
    let fromRect = null;
    let imgSrc = info.img || 'LOGO_ISABELA-Photoroom.png';

    if (node) {
        const imgEl = node.querySelector('.product-image img');
        if (imgEl) {
            fromRect = imgEl.getBoundingClientRect();
            imgSrc = imgEl.src || imgSrc;
        } else {
            // usar bounding de contenedor si no hay img
            const bg = node.querySelector('.product-image');
            if (bg) fromRect = bg.getBoundingClientRect();
        }
    }

    // Añadir al carrito inmediatamente (estado)
    addToCart(producto, info.price, imgSrc);
    mostrarNotificacion(`✓ ${producto} agregado al carrito`);

    // Animación de vuelo hacia el carrito
    const cartBtn = document.getElementById('cart-btn');
    const toRect = cartBtn ? cartBtn.getBoundingClientRect() : { left: window.innerWidth - 60, top: 20, width: 40, height: 40 };
    if (fromRect && cartBtn) {
        animateFlyToCart(imgSrc, fromRect, toRect);
    } else {
        // si no hay rect, emitir corazones desde centro
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        emitHearts(x, y, 6);
    }

    // Pulso al icono del carrito
    if (cartBtn) {
        cartBtn.classList.add('pulse');
        setTimeout(() => cartBtn.classList.remove('pulse'), 900);
    }

    console.log(`Producto agregado: ${producto}`);
}

// Encuentra el nodo .product-container por nombre exacto
function getProductNodeByName(name) {
    const nodes = document.querySelectorAll('.product-container');
    for (const node of nodes) {
        const titleEl = node.querySelector('h4');
        if (titleEl && titleEl.textContent.trim() === name) return node;
    }
    return null;
}

// Anima una imagen volando desde fromRect hasta toRect
function animateFlyToCart(imgSrc, fromRect, toRect) {
    const fly = document.createElement('img');
    fly.src = imgSrc;
    fly.style.position = 'fixed';
    fly.style.left = `${fromRect.left}px`;
    fly.style.top = `${fromRect.top}px`;
    fly.style.width = `${fromRect.width}px`;
    fly.style.height = `${fromRect.height}px`;
    fly.style.borderRadius = '8px';
    fly.style.zIndex = 3000;
    fly.style.transition = 'transform 700ms cubic-bezier(.2,.8,.2,1), opacity 700ms ease';
    fly.style.pointerEvents = 'none';
    document.body.appendChild(fly);

    // calcular desplazamiento al centro del carrito
    const fromCenterX = fromRect.left + fromRect.width / 2;
    const fromCenterY = fromRect.top + fromRect.height / 2;
    const toCenterX = toRect.left + toRect.width / 2;
    const toCenterY = toRect.top + toRect.height / 2;
    const translateX = toCenterX - fromCenterX;
    const translateY = toCenterY - fromCenterY;
    const rotate = (Math.random() - 0.5) * 40;

    requestAnimationFrame(() => {
        fly.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.2) rotate(${rotate}deg)`;
        fly.style.opacity = '0.9';
    });

    // al terminar la animación, limpiar y emitir corazones en el icono del carrito
    setTimeout(() => {
        fly.remove();
        // corazón en la posición del carrito
        emitHearts(toCenterX, toCenterY, 5);
    }, 800);
}


// Helpers para obtener información del producto desde el DOM
function normalizeText(s) {
    return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getProductInfoByName(name) {
    const nodes = document.querySelectorAll('.product-container');
    const nameNorm = normalizeText(name);

    for (const node of nodes) {
        const titleEl = node.querySelector('h4');
        const titleText = titleEl ? titleEl.textContent.trim() : '';
        const titleNorm = normalizeText(titleText);

        // heurística de coincidencia: exacta, contains o palabras comunes
        let matched = false;
        if (nameNorm === titleNorm) matched = true;
        else if (titleNorm.includes(nameNorm) || nameNorm.includes(titleNorm)) matched = true;
        else {
            const nameWords = nameNorm.split(/\s+/).filter(w => w.length > 2);
            const titleWords = titleNorm.split(/\s+/).filter(w => w.length > 2);
            const common = nameWords.filter(w => titleWords.includes(w));
            if (common.length > 0) matched = true;
        }

        if (matched) {
            // Extracción robusta de precio: buscar $ seguido de número
            const priceEl = node.querySelector('.price');
            let price = 0;
            if (priceEl) {
                const text = priceEl.textContent || '';
                let m;
                const dollarRegex = /\$\s*([0-9]+(?:[.,][0-9]+)?)/g;
                let lastDollar = null;
                while ((m = dollarRegex.exec(text)) !== null) lastDollar = m[1];
                if (lastDollar) price = parseFloat(lastDollar.replace(',', '.')) || 0;
                else {
                    const nums = text.match(/\d+[.,]?\d*/g);
                    if (nums && nums.length) price = parseFloat(nums[nums.length - 1].replace(',', '.')) || 0;
                }
            }

            // imagen
            let img = '';
            const imgEl = node.querySelector('.product-image img');
            if (imgEl) img = imgEl.src;
            else {
                const bg = node.querySelector('.product-image');
                if (bg) {
                    const m = (bg.style.backgroundImage || '').match(/url\(["']?([^"')]+)["']?\)/);
                    if (m) img = m[1];
                }
            }

            return { price, img };
        }
    }
    return { price: 0, img: '' };
}

// Carrito — estado y persistencia
let CART = [];
function loadCart() {
    try {
        const s = localStorage.getItem('isabela_cart');
        CART = s ? JSON.parse(s) : [];
    } catch (e) {
        CART = [];
    }
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('isabela_cart', JSON.stringify(CART));
    updateCartUI();
}

function addToCart(name, price = 0, img = '') {
    const existing = CART.find(i => i.name === name);
    if (existing) existing.qty += 1;
    else CART.push({ name, price, qty: 1, img });
    saveCart();
}

function removeFromCart(index) {
    CART.splice(index,1);
    saveCart();
}

function changeQty(index, delta) {
    if (!CART[index]) return;
    CART[index].qty = Math.max(0, CART[index].qty + delta);
    if (CART[index].qty === 0) CART.splice(index,1);
    saveCart();
}

function clearCart() {
    CART = [];
    saveCart();
    mostrarNotificacion('Carrito vaciado');
}

function updateCartUI() {
    const count = CART.reduce((s,i) => s + i.qty, 0);
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = count;
        if (count > 0) {
            cartCount.classList.remove('visually-hidden');
            cartCount.classList.add('visible');
        } else {
            cartCount.classList.add('visually-hidden');
            cartCount.classList.remove('visible');
        }
    }
    const container = document.getElementById('cart-items');
    if (container) {
        container.innerHTML = '';
        CART.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <img src="${item.img || 'LOGO_ISABELA-Photoroom.png'}" alt="${item.name}">
                <div class="meta">
                    <h5>${item.name}</h5>
                    <p>${formatCurrency(item.price)} x ${item.qty}</p>
                </div>
                <div class="controls">
                    <button class="btn btn-sm" onclick="changeQty(${idx}, -1)">-</button>
                    <button class="btn btn-sm" onclick="changeQty(${idx}, 1)">+</button>
                    <button class="btn btn-sm btn-secondary" onclick="removeFromCart(${idx})">Eliminar</button>
                </div>
            `;
            container.appendChild(div);
        });
    }
    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = formatCurrency(CART.reduce((s,i) => s + (i.price * i.qty), 0));
}

function formatCurrency(n) {
    return `$${n.toFixed(2)} MXN`;
}

function toggleCart() {
    const panel = document.getElementById('cart-panel');
    if (!panel) return;
    const open = panel.classList.toggle('open');
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
}

function checkout() {
    if (CART.length === 0) { mostrarNotificacion('El carrito está vacío'); return; }
    // En lugar de procesar pago en la página, abrimos WhatsApp con el resumen del pedido
    sendCartToWhatsApp();
    // Cerramos el panel del carrito para que el usuario complete desde WhatsApp
    toggleCart();
}

// Construye el mensaje y abre WhatsApp con el pedido completo
function sendCartToWhatsApp() {
    if (CART.length === 0) { mostrarNotificacion('El carrito está vacío'); return; }

    let lines = [];
    lines.push('Hola Isabela 👋, quiero hacer el siguiente pedido desde la web Isabela Repostería:');
    lines.push('');
    CART.forEach(item => {
        lines.push(`- ${item.qty} x ${item.name} (${formatCurrency(item.price)})`);
    });
    lines.push('');
    const total = CART.reduce((s,i) => s + i.price * i.qty, 0);
    lines.push(`Total: ${formatCurrency(total)}`);
    lines.push('');
    lines.push('Datos de contacto:');
    lines.push('Nombre:');
    lines.push('Dirección:');
    lines.push('Teléfono:');
    lines.push('');
    lines.push('¿Pueden confirmar disponibilidad y tiempo de entrega? Gracias.');

    const mensaje = lines.join('\n');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    mostrarNotificacion('Se abrió WhatsApp con tu pedido. Por favor revisa y envía el mensaje.');
    // Limpiar carrito (persistente) después de abrir WhatsApp
    setTimeout(() => {
        clearCart();
        mostrarNotificacion('Carrito limpiado');
    }, 600);
}

// Emitir corazones desde coordenadas x,y
function emitHearts(x, y, count = 6) {
    const container = document.getElementById('heart-container');
    if (!container) return;
    for (let i=0;i<count;i++) {
        const span = document.createElement('div');
        span.className = 'heart';
        span.textContent = '💖';
        const offsetX = (Math.random() - 0.5) * 80;
        const delay = Math.random() * 200;
        span.style.left = `${x + offsetX}px`;
        span.style.top = `${y}px`;
        span.style.animationDelay = `${delay}ms`;
        container.appendChild(span);
        setTimeout(()=> span.remove(), 1400 + delay);
    }
}

// Inicializar carrito al cargar
window.addEventListener('load', () => {
    loadCart();
});

// Función para mostrar notificaciones elegantes
function mostrarNotificacion(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);

    setTimeout(() => {
        notificacion.classList.add('mostrar');
    }, 10);

    setTimeout(() => {
        notificacion.classList.remove('mostrar');
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// Función para suavizar el desplazamiento a secciones
function desplazarA(id) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth' });
    }
}

// Función para animar números en contadores
function animarContador(elemento, numero) {
    let contador = 0;
    const incremento = numero / 30;
    const intervalo = setInterval(() => {
        contador += incremento;
        if (contador >= numero) {
            elemento.textContent = numero;
            clearInterval(intervalo);
        } else {
            elemento.textContent = Math.floor(contador);
        }
    }, 50);
}

// Función para filtrar productos
function filtrarProductos(categoria) {
    const items = document.querySelectorAll('.item');
    items.forEach(item => {
        if (categoria === 'todos' || item.dataset.categoria === categoria) {
            item.style.display = 'block';
            item.classList.add('animacion-entrada');
        } else {
            item.style.display = 'none';
        }
    });
    mostrarNotificacion(`Mostrando: ${categoria}`);
}

// Función para buscar productos
function buscarProducto(termino) {
    const items = document.querySelectorAll('.product-container');
    const termino_lower = termino.trim().toLowerCase();
    let matches = 0;

    if (!termino_lower) {
        items.forEach(item => {
            item.style.display = '';
            item.classList.remove('search-highlight');
        });
        mostrarNotificacion('Mostrando todos los productos');
        return;
    }

    items.forEach(item => {
        const tituloEl = item.querySelector('h4');
        const titulo = tituloEl ? tituloEl.textContent.toLowerCase() : '';
        if (titulo.includes(termino_lower)) {
            item.style.display = '';
            item.classList.add('search-highlight');
            matches++;
        } else {
            item.style.display = 'none';
            item.classList.remove('search-highlight');
        }
    });

    mostrarNotificacion(`Resultados: ${matches} producto(s)`);
    return matches;
} 

// Handler para el formulario del header
function buscarProductosHeader(event) {
    event.preventDefault();
    const input = document.getElementById('search-input') || document.getElementById('mobile-search-input');
    const termino = input ? input.value : '';
    const matches = buscarProducto(termino);

    if (matches > 0) {
        // Desplazar al primer resultado
        const first = document.querySelector('.product-container.search-highlight');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Autocomplete helpers
function highlightMatch(text, query) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return text.slice(0, idx) + '<strong>' + text.slice(idx, idx + query.length) + '</strong>' + text.slice(idx + query.length);
}

function attachAutocomplete(inputId, suggestionsId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(suggestionsId);
    if (!input || !container) return;
    let activeIndex = -1;

    input.addEventListener('input', () => {
        const q = input.value.trim();
        container.innerHTML = '';
        if (!q) {
            input.setAttribute('aria-expanded','false');
            return;
        }
        const matches = window.__productNames.filter(name => name.toLowerCase().includes(q.toLowerCase())).slice(0,6);
        if (matches.length === 0) {
            input.setAttribute('aria-expanded','false');
            return;
        }
        input.setAttribute('aria-expanded','true');
        matches.forEach((m, i) => {
            const div = document.createElement('div');
            div.className = 'search-suggestion';
            div.innerHTML = highlightMatch(m, q);
            div.setAttribute('role','option');
            div.setAttribute('data-value', m);
            div.tabIndex = 0;
            div.addEventListener('click', () => {
                input.value = m;
                container.innerHTML = '';
                buscarProducto(m);
            });
            div.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    div.click();
                }
            });
            container.appendChild(div);
        });
        activeIndex = -1;
    });

    input.addEventListener('keydown', (e) => {
        const items = container.querySelectorAll('.search-suggestion');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = Math.min(activeIndex + 1, items.length - 1);
            updateActive(items, activeIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = Math.max(activeIndex - 1, 0);
            updateActive(items, activeIndex);
        } else if (e.key === 'Enter') {
            const active = container.querySelector('.search-suggestion.active');
            if (active) {
                e.preventDefault();
                active.click();
            }
        } else if (e.key === 'Escape') {
            container.innerHTML = '';
            input.setAttribute('aria-expanded','false');
        }
    });

    input.addEventListener('blur', () => {
        setTimeout(()=> { container.innerHTML = ''; input.setAttribute('aria-expanded','false'); }, 150);
    });

    function updateActive(items, index) {
        items.forEach((it, idx) => {
            if (idx === index) {
                it.classList.add('active');
                it.focus();
            } else {
                it.classList.remove('active');
            }
        });
    }
}

// Función para cambiar tema (oscuro/claro)
function cambiarTema() {
    document.body.classList.toggle('tema-oscuro');
    const tema = document.body.classList.contains('tema-oscuro') ? 'Oscuro' : 'Claro';
    localStorage.setItem('tema', tema);
    mostrarNotificacion(`Tema ${tema} activado`);
}

// Cargar tema guardado y configurar autocompletado
window.addEventListener('load', () => {
    const temaSaved = localStorage.getItem('tema');
    if (temaSaved === 'Oscuro') {
        document.body.classList.add('tema-oscuro');
    }

    // Inicializar lista de productos para autocompletar
    const productEls = document.querySelectorAll('.product-container h4');
    window.__productNames = Array.from(productEls).map(el => el.textContent.trim());

    // Adjuntar autocompletado a inputs (desktop y móvil)
    attachAutocomplete('search-input', 'search-suggestions');
    attachAutocomplete('mobile-search-input', 'mobile-search-suggestions');

    // Aplicar preferencia guardada (si existe)
    const savedPref = localStorage.getItem('isabela_pref') || 'ninguna';
    applyPreference(savedPref, false);
});

// Map de etiquetas legibles
const PREF_LABELS = {
    'ninguna': 'Ninguna',
    'sin-gluten': 'Sin gluten',
    'vegano': 'Vegano',
    'sin-azucar': 'Sin azúcar'
};

// Aplica la preferencia sin guardarla (opción de cargar en inicio)
function applyPreference(pref, save = true) {
    const items = document.querySelectorAll('.product-container');
    items.forEach(item => {
        const diet = item.dataset.diet || 'ninguna';
        if (pref === 'ninguna' || diet === pref) {
            item.style.display = '';
            item.classList.remove('pref-hidden');
        } else {
            item.style.display = 'none';
            item.classList.add('pref-hidden');
        }
    });

    const badge = document.getElementById('pref-badge');
    if (badge) {
        if (pref === 'ninguna') {
            badge.classList.add('d-none');
            badge.textContent = '';
        } else {
            badge.classList.remove('d-none');
            badge.textContent = `Preferencia: ${PREF_LABELS[pref] || pref}`;
        }
    }

    if (save) {
        localStorage.setItem('isabela_pref', pref);
        mostrarNotificacion(`Preferencia aplicada: ${PREF_LABELS[pref] || pref}`);
    }
}

// Wrapper llamado por los botones
function setPreference(pref) {
    applyPreference(pref, true);
}

// Función para validar formularios
function validarFormulario(formulario) {
    const campos = formulario.querySelectorAll('input, textarea');
    let valido = true;

    campos.forEach(campo => {
        if (!campo.value.trim()) {
            campo.style.borderColor = '#d81b60';
            valido = false;
        } else {
            campo.style.borderColor = '#ddd';
        }
    });

    if (valido) {
        mostrarNotificacion('✓ Formulario enviado correctamente');
    } else {
        mostrarNotificacion('⚠ Por favor completa todos los campos');
    }
    return valido;
}

// Event listener para animaciones al hacer scroll
window.addEventListener('scroll', () => {
    const elementos = document.querySelectorAll('section');
    elementos.forEach(elemento => {
        const rect = elemento.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8) {
            elemento.classList.add('visible');
        }
    });
});

// Efecto parallax ligero en hero
document.addEventListener('mousemove', (e) => {
    const hero = document.querySelector('h1');
    if (hero) {
        const moveX = (e.clientX / window.innerWidth) * 10;
        const moveY = (e.clientY / window.innerHeight) * 10;
        hero.style.transform = `perspective(1000px) rotateX(${moveY}deg) rotateY(${moveX}deg)`;
    }
});