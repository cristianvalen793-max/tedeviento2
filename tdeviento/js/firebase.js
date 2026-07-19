// ─────────────────────────────────────────────────
//  TopUp Zone — Firebase Configuration
// ─────────────────────────────────────────────────
// IMPORTANTE: Reemplaza estos valores con los de tu
// proyecto Firebase en https://console.firebase.google.com
// ─────────────────────────────────────────────────

const FIREBASE_CONFIG = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// ─── Firebase SDK (CDN) ───────────────────────────
// Se carga desde index.html via <script type="module">
// Este archivo se comporta como módulo ES6

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.auth = null;
    this.initialized = false;
    this.demoMode = true; // Activar para demo sin Firebase real
  }

  async init() {
    if (this.demoMode) {
      console.log('[TopUpZone] 🎮 Modo Demo activo — Firebase simulado');
      this.initialized = true;
      return;
    }

    try {
      // Firebase v9+ modular (CDN)
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp } =
        await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } =
        await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

      this.app  = initializeApp(FIREBASE_CONFIG);
      this.db   = getFirestore(this.app);
      this.auth = getAuth(this.app);

      // Guardar refs de funciones Firestore
      this._addDoc       = addDoc;
      this._collection   = collection;
      this._query        = query;
      this._where        = where;
      this._getDocs      = getDocs;
      this._timestamp    = serverTimestamp;
      this._provider     = new GoogleAuthProvider();
      this._signInPopup  = signInWithPopup;
      this._signOut      = signOut;
      this._onAuthChange = onAuthStateChanged;

      // Escuchar cambios de sesión
      this._onAuthChange(this.auth, (user) => {
        window.currentUser = user;
        this._updateAuthUI(user);
      });

      this.initialized = true;
      console.log('[TopUpZone] ✅ Firebase conectado correctamente');
    } catch (err) {
      console.error('[TopUpZone] ❌ Error Firebase — activando modo Demo:', err);
      this.demoMode = true;
      this.initialized = true;
    }
  }

  // ── Auth ──────────────────────────────────────
  async loginWithGoogle() {
    if (this.demoMode) {
      window.currentUser = { displayName: 'Usuario Demo', email: 'demo@topupzone.ve', uid: 'demo-uid' };
      this._updateAuthUI(window.currentUser);
      showToast('¡Bienvenido en modo Demo! 🎮', 'success');
      return window.currentUser;
    }
    try {
      const result = await this._signInPopup(this.auth, this._provider);
      showToast(`¡Bienvenido, ${result.user.displayName}! 🎉`, 'success');
      return result.user;
    } catch (err) {
      showToast('Error al iniciar sesión', 'error');
      throw err;
    }
  }

  async logout() {
    if (this.demoMode) {
      window.currentUser = null;
      this._updateAuthUI(null);
      showToast('Sesión cerrada', 'info');
      return;
    }
    await this._signOut(this.auth);
    showToast('Sesión cerrada', 'info');
  }

  _updateAuthUI(user) {
    const btn = document.getElementById('auth-btn');
    const avatar = document.getElementById('user-avatar');
    if (!btn) return;

    if (user) {
      btn.textContent = 'Cerrar Sesión';
      btn.classList.add('logged-in');
      if (avatar) {
        avatar.textContent = user.displayName ? user.displayName[0].toUpperCase() : 'U';
        avatar.style.display = 'flex';
      }
    } else {
      btn.textContent = 'Iniciar Sesión';
      btn.classList.remove('logged-in');
      if (avatar) avatar.style.display = 'none';
    }
  }

  // ── Firestore — Órdenes ───────────────────────
  async createOrder(orderData) {
    const order = {
      ...orderData,
      status:        'pending',
      createdAt:     this.demoMode ? new Date().toISOString() : this._timestamp(),
      userId:        window.currentUser?.uid || 'anonymous',
      userName:      window.currentUser?.displayName || 'Cliente Anónimo',
      // Use client-provided reference number, or generate a fallback
      paymentRef:    orderData.paymentRef || ('REF-' + Date.now().toString().slice(-10)),
      contactNumber: orderData.contactNumber || null,
      orderId:       this._generateOrderId()
    };

    if (this.demoMode) {
      console.log('[TopUpZone] 📦 Orden simulada:', order);
      try {
        localStorage.setItem(`order_${order.orderId}`, JSON.stringify(order));
      } catch (storageErr) {
        // QuotaExceededError: localStorage lleno (probable por capturas grandes)
        // Intentar sin la captura para que la orden pase igual
        console.warn('[TopUpZone] localStorage lleno, guardando sin captura:', storageErr.name);
        const orderWithoutScreenshot = { ...order, paymentScreenshot: null };
        try {
          localStorage.setItem(`order_${order.orderId}`, JSON.stringify(orderWithoutScreenshot));
        } catch (secondErr) {
          // Si aun así falla, limpiar TODAS las capturas (recolectar keys primero
          // para evitar que el índice cambie mientras iteramos)
          console.warn('[TopUpZone] Limpiando capturas antiguas para liberar espacio...');
          const orderKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('order_')) orderKeys.push(k);
          }
          for (const key of orderKeys) {
            try {
              const o = JSON.parse(localStorage.getItem(key));
              if (o && o.paymentScreenshot) {
                o.paymentScreenshot = null;
                localStorage.setItem(key, JSON.stringify(o));
              }
            } catch(e) {}
          }
          // Último intento: si sigue sin espacio, borrar órdenes completadas antiguas
          try {
            localStorage.setItem(`order_${order.orderId}`, JSON.stringify(orderWithoutScreenshot));
          } catch (thirdErr) {
            console.warn('[TopUpZone] Eliminando órdenes completadas antiguas...');
            const completed = orderKeys
              .map(k => { try { return { key: k, o: JSON.parse(localStorage.getItem(k)) }; } catch(e) { return null; } })
              .filter(x => x && x.o && x.o.status === 'completed')
              .sort((a, b) => new Date(a.o.createdAt) - new Date(b.o.createdAt));
            for (const item of completed) {
              localStorage.removeItem(item.key);
              try {
                localStorage.setItem(`order_${order.orderId}`, JSON.stringify(orderWithoutScreenshot));
                break; // éxito — dejar de borrar
              } catch(e) { /* seguir borrando */ }
            }
          }
        }
      }
      return order;
    }

    try {
      const docRef = await this._addDoc(
        this._collection(this.db, 'orders'),
        order
      );
      order.firestoreId = docRef.id;
      return order;
    } catch (err) {
      console.error('[TopUpZone] Error creando orden:', err);
      throw err;
    }
  }

  async getUserOrders(uid) {
    if (this.demoMode) {
      // Recuperar órdenes del localStorage en demo
      const orders = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('order_')) {
          try { orders.push(JSON.parse(localStorage.getItem(key))); } catch(e) {}
        }
      }
      return orders;
    }

    try {
      const q = this._query(
        this._collection(this.db, 'orders'),
        this._where('userId', '==', uid)
      );
      const snap = await this._getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('[TopUpZone] Error obteniendo órdenes:', err);
      return [];
    }
  }

  _generateOrderId() {
    return 'TUZ-' + Date.now().toString(36).toUpperCase() + '-' +
           Math.random().toString(36).substr(2, 4).toUpperCase();
  }
}

// Instancia global
const firebase = new FirebaseService();
