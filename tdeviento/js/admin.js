// ─────────────────────────────────────────────────
//  TopUp Zone — Admin Panel Controller
// ─────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────
const PAYMENT_ICONS = { pago_movil: '📱', binance: '₿', card: '💳' };
const PAYMENT_NAMES = { pago_movil: 'Pago Móvil', binance: 'Binance Pay', card: 'Tarjeta' };
const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',  cls: 'status-pending',   icon: '⏳' },
  approved:  { label: 'Verificado', cls: 'status-approved',  icon: '✔️' },
  completed: { label: 'Completado', cls: 'status-completed', icon: '✅' },
  rejected:  { label: 'Rechazado',  cls: 'status-rejected',  icon: '❌' },
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-VE', { day:'2-digit', month:'short' }) +
    ' ' + d.toLocaleTimeString('es-VE', { hour:'2-digit', minute:'2-digit' });
}

function formatUSD(n) { return '$' + parseFloat(n || 0).toFixed(2); }
function formatBs(n)  { return parseFloat(n || 0).toFixed(2) + ' Bs'; }

// ── AdminController ────────────────────────────────
class AdminController {
  constructor() {
    this.allOrders      = [];
    this.filteredOrders = [];
    this.activeFilter   = 'all';
    this.searchQuery    = '';
    this.selectedOrder  = null;
    this.refreshTimer   = null;
    this.lastSync       = null;
  }

  // ── Init ─────────────────────────────────────────
  init() {
    this.loadOrders();
    this._bindFilters();
    this._bindSearch();
    this._bindDrawerClose();
    this._listenStorageEvents();
    this._startAutoRefresh();
    this._updateSyncTime();

    document.getElementById('refresh-btn')?.addEventListener('click', () => {
      this.loadOrders();
      this._showRefreshFeedback();
    });

    document.getElementById('export-btn')?.addEventListener('click', () => this.exportCSV());
    document.getElementById('clear-demo-btn')?.addEventListener('click', () => this._clearDemoOrders());
    document.getElementById('inject-demo-btn')?.addEventListener('click', () => this._injectDemoOrders());

    console.log('[Admin] ✅ Panel de administración listo');
  }

  // ── Load all orders from localStorage ────────────
  loadOrders() {
    const orders = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('order_')) {
        try {
          const o = JSON.parse(localStorage.getItem(key));
          if (o && o.orderId) orders.push(o);
        } catch(e) { /* skip malformed */ }
      }
    }
    // Sort newest first
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    this.allOrders = orders;
    this.lastSync  = new Date();
    this._applyFiltersAndSearch();
    this.renderMetrics();
    this._updateSyncTime();
  }

  // ── Metrics ───────────────────────────────────────
  renderMetrics() {
    const orders = this.allOrders;
    const today  = new Date().toDateString();

    const totalRevenue  = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.totalUSD || 0), 0);
    const todayCount    = orders.filter(o => new Date(o.createdAt).toDateString() === today).length;
    const pendingCount  = orders.filter(o => o.status === 'pending').length;
    const approvedCount = orders.filter(o => o.status === 'approved').length;
    const rejectedCount = orders.filter(o => o.status === 'rejected').length;

    this._animateCounter('kpi-revenue',  totalRevenue,  true);
    this._animateCounter('kpi-today',    todayCount,    false);
    this._animateCounter('kpi-pending',  pendingCount,  false);
    this._animateCounter('kpi-rejected', rejectedCount, false);

    // Pending badge pulse (pending = requiere verificación, approved = requiere entrega)
    const pendingKpi = document.getElementById('kpi-pending-card');
    if (pendingKpi) {
      pendingKpi.classList.toggle('kpi-alert', pendingCount > 0 || approvedCount > 0);
    }

    // Update sidebar badge (pendientes + verificados aún activos)
    const navBadge = document.getElementById('nav-pending-badge');
    if (navBadge) {
      const total = pendingCount + approvedCount;
      navBadge.textContent = total;
      navBadge.style.display = total > 0 ? 'flex' : 'none';
    }
  }

  _animateCounter(id, target, isMoney) {
    const el = document.getElementById(id);
    if (!el) return;
    const current = parseFloat(el.dataset.raw || 0);
    if (current === target) return;
    el.dataset.raw = target;
    const steps = 40;
    const diff   = target - current;
    const step   = diff / steps;
    let val      = current;
    let s        = 0;
    const tick = setInterval(() => {
      val += step; s++;
      if (s >= steps) { val = target; clearInterval(tick); }
      el.textContent = isMoney ? '$' + val.toFixed(2) : Math.round(val).toString();
    }, 16);
  }

  // ── Filter & Search ──────────────────────────────
  _applyFiltersAndSearch() {
    let result = [...this.allOrders];

    if (this.activeFilter !== 'all') {
      result = result.filter(o => o.status === this.activeFilter);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(o =>
        (o.userName    || '').toLowerCase().includes(q) ||
        (o.playerId    || '').toLowerCase().includes(q) ||
        (o.serviceName || '').toLowerCase().includes(q) ||
        (o.paymentRef  || '').toLowerCase().includes(q) ||
        (o.orderId     || '').toLowerCase().includes(q)
      );
    }

    this.filteredOrders = result;
    this.renderTable();
  }

  _bindFilters() {
    document.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.status;
        this._applyFiltersAndSearch();
      });
    });
  }

  _bindSearch() {
    const input = document.getElementById('table-search');
    if (!input) return;
    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        this.searchQuery = input.value.trim();
        this._applyFiltersAndSearch();
      }, 250);
    });
  }

  // ── Render Table ─────────────────────────────────
  renderTable() {
    const tbody = document.getElementById('transactions-tbody');
    const empty = document.getElementById('table-empty');
    if (!tbody) return;

    const orders = this.filteredOrders;

    if (orders.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }

    if (empty) empty.style.display = 'none';

    tbody.innerHTML = orders.map((o, i) => {
      const sc  = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
      const pm  = PAYMENT_ICONS[o.paymentMethod] || '💳';
      const pmN = PAYMENT_NAMES[o.paymentMethod] || o.paymentMethod;
      const rowClass = o.status === 'completed' ? 'row-completed'
                     : o.status === 'rejected'  ? 'row-rejected'
                     : o.status === 'approved'  ? 'row-approved'
                     : 'row-pending';
      return `
        <tr class="tx-row ${rowClass}" data-order-id="${o.orderId}" id="row-${o.orderId}">
          <td class="td-num">${i + 1}</td>
          <td class="td-user">
            <div class="user-cell">
              <div class="user-avatar-sm">${(o.userName || 'C')[0].toUpperCase()}</div>
              <span>${o.userName || 'Cliente Anónimo'}</span>
            </div>
          </td>
          <td class="td-id">
            <code class="id-code">${o.playerId || '—'}</code>
          </td>
          <td class="td-service">
            <div class="service-cell">
              <span class="service-dot" style="background:${this._serviceColor(o.serviceId)}"></span>
              ${o.serviceName || '—'}
            </div>
          </td>
          <td class="td-package" title="${o.package?.label || ''}">
            ${this._truncate(o.package?.label || '—', 22)}
          </td>
          <td class="td-amount">
            <span class="amount-usd">${formatUSD(o.totalUSD)}</span>
            <span class="amount-bs">${formatBs(o.totalBs)}</span>
          </td>
          <td class="td-method">
            <span class="pm-chip">${pm} ${pmN}</span>
          </td>
          <td class="td-ref">
            <code class="ref-code">${o.paymentRef || '—'}</code>
          </td>
          <td class="td-date">${formatDate(o.createdAt)}</td>
          <td class="td-status">
            <span class="status-badge ${sc.cls}">${sc.icon} ${sc.label}</span>
          </td>
          <td class="td-actions">
            ${o.status === 'pending' ? `
              <button class="btn-approve" onclick="admin.approveOrder('${o.orderId}')" title="Verificar pago">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                Verificar
              </button>
              <button class="btn-reject" onclick="admin.rejectOrder('${o.orderId}')" title="Rechazar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Rechazar
              </button>
            ` : o.status === 'approved' ? `
              <button class="btn-complete" onclick="admin.completeOrder('${o.orderId}')" title="Marcar recarga como entregada">
                ✅ Finalizar
              </button>
              <button class="btn-reject" onclick="admin.rejectOrder('${o.orderId}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Rechazar
              </button>
            ` : `
              <button class="btn-detail" onclick="admin.openDetail('${o.orderId}')">
                Ver detalle
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');

    // Row click → drawer detail
    tbody.querySelectorAll('.tx-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        this.openDetail(row.dataset.orderId);
      });
    });
  }

  // ── Approve / Reject ─────────────────────────────
  approveOrder(orderId) {
    this._updateOrderStatus(orderId, 'completed');

    const row = document.getElementById(`row-${orderId}`);
    if (row) {
      row.classList.add('row-flash-green');
      row.classList.remove('row-pending');
      row.classList.add('row-completed');
      const statusCell = row.querySelector('.status-badge');
      if (statusCell) {
        statusCell.className = 'status-badge status-completed';
        statusCell.textContent = '✅ Completado';
      }
      const actionsCell = row.querySelector('.td-actions');
      if (actionsCell) {
        actionsCell.innerHTML = `<button class="btn-detail" onclick="admin.openDetail('${orderId}')">Ver detalle</button>`;
      }
      setTimeout(() => row.classList.remove('row-flash-green'), 1500);
    }

    this.renderMetrics();
    this._showToast(`✅ Orden ${orderId} aprobada`, 'success');
    if (this.selectedOrder?.orderId === orderId) {
      this.openDetail(orderId);
    }
  }

  rejectOrder(orderId) {
    const modal = document.getElementById('confirm-modal');
    if (modal) {
      modal.style.display = 'flex';
      document.getElementById('confirm-order-id').textContent = orderId;
      document.getElementById('confirm-reject-btn').onclick = () => {
        this._updateOrderStatus(orderId, 'rejected');
        modal.style.display = 'none';

        const row = document.getElementById(`row-${orderId}`);
        if (row) {
          row.classList.add('row-flash-red');
          row.classList.remove('row-pending');
          row.classList.add('row-rejected');
          const statusCell = row.querySelector('.status-badge');
          if (statusCell) {
            statusCell.className = 'status-badge status-rejected';
            statusCell.textContent = '❌ Rechazado';
          }
          const actionsCell = row.querySelector('.td-actions');
          if (actionsCell) {
            actionsCell.innerHTML = `<button class="btn-detail" onclick="admin.openDetail('${orderId}')">Ver detalle</button>`;
          }
          setTimeout(() => row.classList.remove('row-flash-red'), 1500);
        }

        this.renderMetrics();
        this._showToast(`❌ Orden ${orderId} rechazada`, 'error');
        if (this.selectedOrder?.orderId === orderId) this.openDetail(orderId);
      };
      document.getElementById('confirm-cancel-btn').onclick = () => {
        modal.style.display = 'none';
      };
    } else {
      // Fallback sin modal
      if (confirm(`¿Rechazar la orden ${orderId}?`)) {
        this._updateOrderStatus(orderId, 'rejected');
        this.loadOrders();
      }
    }
  }

  _updateOrderStatus(orderId, status) {
    const key  = `order_${orderId}`;
    const raw  = localStorage.getItem(key);
    if (!raw) return;
    try {
      const order = JSON.parse(raw);
      order.status = status;
      order.updatedAt = new Date().toISOString();
      try {
        localStorage.setItem(key, JSON.stringify(order));
      } catch (quotaErr) {
        // Si la orden tiene captura grande, guardar sin ella para que el estado persista
        const slim = { ...order, paymentScreenshot: null };
        localStorage.setItem(key, JSON.stringify(slim));
      }
      // Update in memory
      const idx = this.allOrders.findIndex(o => o.orderId === orderId);
      if (idx >= 0) { this.allOrders[idx].status = status; this.allOrders[idx].updatedAt = order.updatedAt; }
      const idx2 = this.filteredOrders.findIndex(o => o.orderId === orderId);
      if (idx2 >= 0) { this.filteredOrders[idx2].status = status; }
    } catch(e) { console.error('[Admin] Error actualizando orden:', e); }
  }

  // ── Detail Drawer ─────────────────────────────────
  openDetail(orderId) {
    const order = this.allOrders.find(o => o.orderId === orderId);
    if (!order) return;
    this.selectedOrder = order;

    const sc  = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const pm  = PAYMENT_ICONS[order.paymentMethod] || '💳';
    const pmN = PAYMENT_NAMES[order.paymentMethod] || order.paymentMethod;

    const drawer = document.getElementById('detail-drawer');
    const content = document.getElementById('drawer-content');
    if (!drawer || !content) return;

    const isManual = order.paymentMethod === 'pago_movil' || order.paymentMethod === 'binance';

    content.innerHTML = `
      <div class="drawer-header">
        <div>
          <p class="drawer-label">Orden</p>
          <code class="drawer-order-id">${order.orderId}</code>
        </div>
        <span class="status-badge ${sc.cls}">${sc.icon} ${sc.label}</span>
      </div>

      ${order.status === 'pending' && isManual ? `
        <div class="pending-verify-banner">
          <span class="pvb-icon">🔔</span>
          <div>
            <strong>Pago pendiente de verificación</strong>
            <p>Revisa el comprobante y los datos antes de aprobar</p>
          </div>
        </div>
      ` : ''}

      <!-- VERIFICACIÓN DE PAGO -->
      ${isManual ? `
        <div class="drawer-section drawer-payment-verify">
          <h4 class="drawer-section-title verify-title">🔍 Verificación de Pago</h4>

          <div class="verify-data-grid">
            <div class="verify-data-item">
              <span class="verify-label">🔢 N° Referencia</span>
              <code class="verify-value ref-highlight">${order.paymentRef || '—'}</code>
            </div>
            <div class="verify-data-item">
              <span class="verify-label">📞 N° Contacto</span>
              <code class="verify-value contact-highlight">${order.contactNumber || '—'}</code>
            </div>
          </div>

          ${order.paymentScreenshot ? `
            <div class="screenshot-section">
              <p class="screenshot-label">📸 Captura del Comprobante</p>
              <img
                src="${order.paymentScreenshot}"
                class="screenshot-img"
                alt="Comprobante de pago"
                onclick="this.classList.toggle('screenshot-zoom')"
                title="Haz clic para ampliar"
              />
              <p class="screenshot-hint">Haz clic en la imagen para ampliar</p>
            </div>
          ` : `
            <div class="no-screenshot">⚠️ No se adjuntó captura de comprobante</div>
          `}
        </div>
      ` : ''}

      <div class="drawer-section">
        <h4 class="drawer-section-title">Cliente</h4>
        <div class="drawer-row"><span>Nombre</span><strong>${order.userName || '—'}</strong></div>
        <div class="drawer-row"><span>ID / Teléfono</span><code>${order.playerId || '—'}</code></div>
        <div class="drawer-row"><span>User ID</span><code class="text-muted">${order.userId || '—'}</code></div>
        ${order.contactNumber ? `<div class="drawer-row"><span>📞 Contacto</span><strong style="color:var(--accent-green,#22c55e)">${order.contactNumber}</strong></div>` : ''}
      </div>

      <div class="drawer-section">
        <h4 class="drawer-section-title">Servicio</h4>
        <div class="drawer-row"><span>Servicio</span><strong>${order.serviceName || '—'}</strong></div>
        <div class="drawer-row"><span>Paquete</span><strong>${order.package?.label || '—'}</strong></div>
        <div class="drawer-row"><span>Monto USD</span><strong class="text-green">${formatUSD(order.totalUSD)}</strong></div>
        <div class="drawer-row"><span>Monto Bs</span><strong>${formatBs(order.totalBs)}</strong></div>
      </div>

      <div class="drawer-section">
        <h4 class="drawer-section-title">Pago</h4>
        <div class="drawer-row"><span>Método</span><strong>${pm} ${pmN}</strong></div>
        <div class="drawer-row"><span>Referencia</span><code class="ref-code ref-highlight-sm">${order.paymentRef || '—'}</code></div>
        <div class="drawer-row"><span>Fecha</span><strong>${formatDate(order.createdAt)}</strong></div>
        ${order.updatedAt ? `<div class="drawer-row"><span>Actualizado</span><strong>${formatDate(order.updatedAt)}</strong></div>` : ''}
      </div>

      ${order.status === 'pending' ? `
        <div class="drawer-actions">
          <button class="btn-approve btn-full" onclick="admin.approveOrder('${order.orderId}')">
            ✅ Aprobar Recarga
          </button>
          <button class="btn-reject btn-full" onclick="admin.rejectOrder('${order.orderId}')">
            ❌ Rechazar
          </button>
        </div>
      ` : ''}
    `;

    drawer.classList.add('open');
    document.getElementById('drawer-overlay')?.classList.add('visible');
  }

  closeDetail() {
    document.getElementById('detail-drawer')?.classList.remove('open');
    document.getElementById('drawer-overlay')?.classList.remove('visible');
    this.selectedOrder = null;
  }

  _bindDrawerClose() {
    document.getElementById('drawer-close-btn')?.addEventListener('click', () => this.closeDetail());
    document.getElementById('drawer-overlay')?.addEventListener('click', () => this.closeDetail());
  }

  // ── Real-time sync via StorageEvent ──────────────
  _listenStorageEvents() {
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('order_')) {
        this.loadOrders();
        this._showToast('🔄 Nueva actividad detectada', 'info');
        this._pulseSync();
      }
    });
  }

  _startAutoRefresh() {
    this.refreshTimer = setInterval(() => {
      this.loadOrders();
    }, 10000); // every 10s
  }

  _updateSyncTime() {
    const el = document.getElementById('last-sync');
    if (el && this.lastSync) {
      el.textContent = 'Sync: ' + this.lastSync.toLocaleTimeString('es-VE', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    }
  }

  _pulseSync() {
    const dot = document.getElementById('sync-dot');
    if (!dot) return;
    dot.classList.add('pulse-fast');
    setTimeout(() => dot.classList.remove('pulse-fast'), 2000);
  }

  _showRefreshFeedback() {
    const btn = document.getElementById('refresh-btn');
    if (!btn) return;
    btn.textContent = '✓ Actualizado';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = '🔄 Actualizar'; btn.disabled = false; }, 1500);
  }

  // ── Export CSV ────────────────────────────────────
  exportCSV() {
    const headers = ['#','Orden','Usuario','ID/Teléfono','Contacto','Servicio','Paquete','USD','Bs','Método','Referencia','Fecha','Estado'];
    const rows = this.filteredOrders.map((o, i) => [
      i+1, o.orderId, o.userName || '', o.playerId || '',
      o.contactNumber || '',
      o.serviceName || '', o.package?.label || '',
      o.totalUSD?.toFixed(2) || '', o.totalBs?.toFixed(2) || '',
      PAYMENT_NAMES[o.paymentMethod] || o.paymentMethod || '',
      o.paymentRef || '', o.createdAt ? new Date(o.createdAt).toLocaleString('es-VE') : '',
      o.status || ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `topupzone_transacciones_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    this._showToast('📥 CSV exportado correctamente', 'success');
  }

  // ── Demo helpers ──────────────────────────────────
  _injectDemoOrders() {
    const demoOrders = [
      { orderId:'TUZ-DEMO001-AA', serviceName:'Free Fire', serviceId:'freefire', playerId:'987654321',
        package:{ label:'520 + 52 Bonus Diamonds', price_usd:7.99 }, paymentMethod:'pago_movil',
        paymentRef:'REF-2026071422100', contactNumber:'04241112233', totalUSD:7.99, totalBs:28.92, status:'pending',
        userName:'Carlos Martínez', userId:'demo-1', createdAt: new Date(Date.now()-300000).toISOString() },
      { orderId:'TUZ-DEMO002-BB', serviceName:'Roblox', serviceId:'roblox', playerId:'GamerVzla99',
        package:{ label:'800 Robux', price_usd:9.99 }, paymentMethod:'binance',
        paymentRef:'REF-2026071422200', contactNumber:'04261234567', totalUSD:9.99, totalBs:36.16, status:'pending',
        userName:'María García', userId:'demo-2', createdAt: new Date(Date.now()-180000).toISOString() },
      { orderId:'TUZ-DEMO003-CC', serviceName:'PUBG Mobile', serviceId:'pubg', playerId:'5123456789',
        package:{ label:'600 + 60 Bonus UC', price_usd:9.99 }, paymentMethod:'card',
        paymentRef:'REF-2026071422300', contactNumber:null, totalUSD:9.99, totalBs:36.16, status:'completed',
        userName:'Luisa Pérez', userId:'demo-3', createdAt: new Date(Date.now()-600000).toISOString() },
      { orderId:'TUZ-DEMO004-DD', serviceName:'Valorant', serviceId:'valorant', playerId:'ProPlayer#LATAM',
        package:{ label:'2050 + 50 Bonus VP', price_usd:19.99 }, paymentMethod:'pago_movil',
        paymentRef:'REF-2026071422400', contactNumber:'04141234567', totalUSD:19.99, totalBs:72.36, status:'pending',
        userName:'Andrés López', userId:'demo-4', createdAt: new Date(Date.now()-60000).toISOString() },
      { orderId:'TUZ-DEMO005-EE', serviceName:'Saldo Movistar', serviceId:'movistar', playerId:'04141234567',
        package:{ label:'10 USD de saldo', price_usd:10.50 }, paymentMethod:'pago_movil',
        paymentRef:'REF-2026071422500', contactNumber:'04169876543', totalUSD:10.50, totalBs:38.01, status:'rejected',
        userName:'Pedro Rodríguez', userId:'demo-5', createdAt: new Date(Date.now()-900000).toISOString() },
    ];
    demoOrders.forEach(o => localStorage.setItem(`order_${o.orderId}`, JSON.stringify(o)));
    this.loadOrders();
    this._showToast('🎮 5 órdenes demo inyectadas', 'success');
  }

  _clearDemoOrders() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('order_')) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    this.loadOrders();
    this._showToast('🗑️ Todas las órdenes eliminadas', 'warning');
  }

  // ── Toast ─────────────────────────────────────────
  _showToast(message, type = 'info') {
    const container = document.getElementById('admin-toast-container') || this._createToastContainer();
    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.parentNode?.removeChild(toast), 400);
    }, 3000);
  }

  _createToastContainer() {
    const el = document.createElement('div');
    el.id = 'admin-toast-container';
    document.body.appendChild(el);
    return el;
  }

  // ── Utils ─────────────────────────────────────────
  _serviceColor(serviceId) {
    const colors = { freefire:'#ff6b00', roblox:'#e53e3e', pubg:'#06b6d4',
      valorant:'#ff4655', mlbb:'#f59e0b', minecraft:'#22c55e',
      movistar:'#3b82f6', digitel:'#8b5cf6' };
    return colors[serviceId] || '#7c3aed';
  }

  _truncate(str, len) {
    return str.length > len ? str.substring(0, len) + '…' : str;
  }
}

// ── Global instance ───────────────────────────────
const admin = new AdminController();
document.addEventListener('DOMContentLoaded', () => admin.init());
