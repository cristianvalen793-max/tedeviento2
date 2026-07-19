// ─────────────────────────────────────────────────
//  TopUp Zone — Main App Controller
// ─────────────────────────────────────────────────

// ── Toast Notification ────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
  }, 3500);
}

function createToastContainer() {
  const el = document.createElement('div');
  el.id = 'toast-container';
  document.body.appendChild(el);
  return el;
}

// ── Confetti Effect ───────────────────────────────
function launchConfetti() {
  const colors = ['#7c3aed','#06b6d4','#f59e0b','#22c55e','#ff6b00','#ff4655'];
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay: ${Math.random() * 0.5}s;
      animation-duration: ${0.8 + Math.random() * 1.2}s;
      width: ${4 + Math.random() * 8}px;
      height: ${4 + Math.random() * 8}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    container.appendChild(piece);
  }

  setTimeout(() => {
    if (container.parentNode) container.parentNode.removeChild(container);
  }, 3000);
}

// ── Render Services Grid ──────────────────────────
function renderServicesGrid() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;

  grid.innerHTML = SERVICES.map((svc, i) => {
    const badgeColors = {
      hot:   'badge-hot',
      new:   'badge-new',
      trend: 'badge-trend',
      fast:  'badge-fast',
    };
    const badgeClass = svc.badgeType ? badgeColors[svc.badgeType] : '';

    const logoHTML = svc.logo
      ? `<img src="${svc.logo}" alt="${svc.name}" class="card-logo" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">`
      : '';

    const svgHTML = (!svc.logo || svc.id === 'movistar' || svc.id === 'digitel')
      ? `<div class="card-logo-svg" style="${svc.logo ? 'display:none' : 'display:flex'}">${
          svc.id === 'movistar' ? MOBILE_SVG.movistar :
          svc.id === 'digitel'  ? MOBILE_SVG.digitel  : ''
        }</div>`
      : '<div class="card-logo-svg" style="display:none"></div>';

    return `
      <div class="service-card"
           data-service-id="${svc.id}"
           style="--card-color:${svc.color}; --card-glow:${svc.glow}; animation-delay:${i * 0.07}s"
           role="button" tabindex="0"
           aria-label="Recargar ${svc.name}"
           id="card-${svc.id}">
        <div class="card-glow-bg"></div>
        ${svc.badge ? `<div class="card-badge ${badgeClass}">${svc.badge}</div>` : ''}
        <div class="card-logo-container">
          ${logoHTML}
          ${svgHTML}
        </div>
        <div class="card-info">
          <h3 class="card-title">${svc.name}</h3>
          <p class="card-desc">${svc.description}</p>
        </div>
        <div class="card-cta">
          <span>Recargar ahora</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    `;
  }).join('');

  // Attach click events
  document.querySelectorAll('.service-card').forEach(card => {
    const handler = () => {
      const id = card.dataset.serviceId;
      modalController.open(id);
      card.classList.add('card-clicked');
      setTimeout(() => card.classList.remove('card-clicked'), 300);
    };
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') handler(); });
  });
}

// ── Category Filter ───────────────────────────────
function initCategoryFilter() {
  const filters = document.querySelectorAll('.filter-btn');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.dataset.category;
      document.querySelectorAll('.service-card').forEach(card => {
        const svc = SERVICES.find(s => s.id === card.dataset.serviceId);
        if (!svc) return;
        const match = category === 'all' || svc.category === category;
        card.style.display = match ? '' : 'none';
      });
    });
  });
}

// ── Header scroll effect ──────────────────────────
function initHeader() {
  const header = document.getElementById('main-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

// ── Hero particles ────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 2 + 0.5,
      vx:    (Math.random() - 0.5) * 0.4,
      vy:    -Math.random() * 0.6 - 0.2,
      alpha: Math.random() * 0.6 + 0.2,
      color: ['#7c3aed','#06b6d4','#f59e0b'][Math.floor(Math.random() * 3)]
    };
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (particles.length < 70) particles.push(createParticle());
    particles = particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.alpha -= 0.002;
      if (p.y < 0 || p.alpha <= 0) return false;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2,'0');
      ctx.fill();
      return true;
    });
    requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  animate();
}

// ── Scroll animations (Intersection Observer) ─────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// ── Stats counter animation ───────────────────────
function animateCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.counter);
      const suffix = el.dataset.suffix || '';
      let current = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = Math.floor(current).toLocaleString() + suffix;
      }, 16);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => observer.observe(el));
}

// ── Order Status Watcher ──────────────────────────
// Detecta cuando el admin aprueba una orden y notifica al usuario

const orderWatcher = {
  watchedOrders: new Map(), // orderId → { status, data }
  pollTimer: null,

  // Registra una orden para ser vigilada
  watch(orderId, orderData) {
    // Evitar guardar capturas pesadas en el watcher para no llenar el localStorage
    const safeData = { ...orderData, paymentScreenshot: null };
    this.watchedOrders.set(orderId, { status: 'pending', data: safeData });
    this._saveToPersist();
    this._startPolling();
  },

  // Carga órdenes pendientes al iniciar la página
  init() {
    const saved = localStorage.getItem('__tuz_watching');
    if (saved) {
      try {
        const entries = JSON.parse(saved);
        entries.forEach(([id, val]) => this.watchedOrders.set(id, val));
      } catch(e) {}
    }
    // Solo vigilar si hay órdenes pendientes
    if (this.watchedOrders.size > 0) this._startPolling();

    // Escuchar cambios de localStorage desde otra pestaña (panel admin)
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('order_')) {
        const orderId = e.key.replace('order_', '');
        if (this.watchedOrders.has(orderId)) {
          try {
            const updated = JSON.parse(e.newValue);
            this._checkAndNotify(orderId, updated);
          } catch(err) {}
        }
      }
    });
  },

  // Polling cada 8s para mismo-tab y actualizaciones tardías
  _startPolling() {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => this._pollAll(), 8000);
  },

  _stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  },

  _pollAll() {
    if (this.watchedOrders.size === 0) { this._stopPolling(); return; }
    this.watchedOrders.forEach((val, orderId) => {
      const raw = localStorage.getItem(`order_${orderId}`);
      if (!raw) return;
      try {
        const updated = JSON.parse(raw);
        this._checkAndNotify(orderId, updated);
      } catch(e) {}
    });
  },

  _checkAndNotify(orderId, updated) {
    const entry = this.watchedOrders.get(orderId);
    if (!entry) return;
    const prevStatus = entry.status;
    const newStatus  = updated.status;

    if (prevStatus === 'pending' && newStatus === 'completed') {
      // ¡Aprobado! Mostrar notificación
      entry.status = 'completed';
      this.watchedOrders.set(orderId, entry);
      this._saveToPersist();
      this._showApprovedNotification(updated);

      // Si ya no quedan órdenes pendientes, detener polling
      const stillPending = [...this.watchedOrders.values()].some(v => v.status === 'pending');
      if (!stillPending) this._stopPolling();
    } else if (prevStatus === 'pending' && newStatus === 'rejected') {
      entry.status = 'rejected';
      this.watchedOrders.set(orderId, entry);
      this._saveToPersist();
      this._showRejectedNotification(updated);
    }
  },

  _saveToPersist() {
    // Solo persistir pendientes (no saturar)
    const pending = [...this.watchedOrders.entries()].filter(([, v]) => v.status === 'pending');
    if (pending.length > 0) {
      try {
        localStorage.setItem('__tuz_watching', JSON.stringify(pending));
      } catch (e) {
        console.warn('[TopUpZone] No se pudo guardar el watcher en localStorage', e);
      }
    } else {
      localStorage.removeItem('__tuz_watching');
    }
  },

  _showApprovedNotification(order) {
    // Lanzar confetti primero
    launchConfetti();
    setTimeout(() => launchConfetti(), 600);

    const overlay = document.createElement('div');
    overlay.id = 'order-approved-overlay';
    overlay.className = 'order-notify-overlay';
    overlay.innerHTML = `
      <div class="order-notify-card approved-card" id="order-notify-card">
        <button class="notify-close-btn" onclick="document.getElementById('order-approved-overlay').remove()" aria-label="Cerrar">✕</button>

        <!-- Icono animado -->
        <div class="notify-icon-wrap">
          <div class="notify-ring notify-ring-1"></div>
          <div class="notify-ring notify-ring-2"></div>
          <div class="notify-checkmark">⚡</div>
        </div>

        <h2 class="notify-title">¡Recarga Aprobada!</h2>
        <p class="notify-subtitle">Tu pago fue verificado y tu recarga<br>está siendo procesada ahora mismo</p>

        <!-- Barra de progreso animada -->
        <div class="notify-progress-wrap">
          <div class="notify-progress-track">
            <div class="notify-progress-bar" id="notify-progress-bar"></div>
          </div>
          <div class="notify-progress-steps">
            <span class="nps-item nps-done">✓ Pago verificado</span>
            <span class="nps-item nps-active">⚡ Procesando recarga</span>
            <span class="nps-item">🎮 Entrega</span>
          </div>
        </div>

        <!-- Detalles del pedido -->
        <div class="notify-order-details">
          <div class="notify-row"><span>Orden</span><code>${order.orderId}</code></div>
          <div class="notify-row"><span>Servicio</span><strong>${order.serviceName}</strong></div>
          <div class="notify-row"><span>Paquete</span><strong>${order.package?.label || '—'}</strong></div>
          <div class="notify-row"><span>ID / Tel</span><strong>${order.playerId}</strong></div>
          <div class="notify-row highlight-row"><span>Total</span><strong>$${parseFloat(order.totalUSD).toFixed(2)}</strong></div>
        </div>

        <p class="notify-eta">🎮 Tu recarga llegará en los próximos minutos</p>

        <button class="btn-notify-close" onclick="document.getElementById('order-approved-overlay').remove()">
          ¡Genial, gracias! 🎉
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
      document.getElementById('order-notify-card')?.classList.add('visible');
    });

    // Animar barra de progreso
    setTimeout(() => {
      const bar = document.getElementById('notify-progress-bar');
      if (bar) bar.style.width = '66%';
    }, 300);
  },

  _showRejectedNotification(order) {
    showToast(`❌ Tu orden ${order.orderId} fue rechazada. Contáctanos por WhatsApp.`, 'error');
  }
};

// ── Auth button ───────────────────────────────────
function initAuth() {
  const btn = document.getElementById('auth-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (window.currentUser) {
      firebase.logout();
    } else {
      firebase.loginWithGoogle();
    }
  });
}

// ── Smooth scroll nav ─────────────────────────────
function initNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ── App Init ──────────────────────────────────────
async function initApp() {
  await firebase.init();
  renderServicesGrid();
  initCategoryFilter();
  initHeader();
  initParticles();
  initScrollAnimations();
  animateCounters();
  initAuth();
  initNavigation();
  orderWatcher.init();
  console.log('[TopUpZone] 🚀 App inicializada correctamente');
}

document.addEventListener('DOMContentLoaded', initApp);
