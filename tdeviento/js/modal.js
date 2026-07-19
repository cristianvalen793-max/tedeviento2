// ─────────────────────────────────────────────────
//  TopUp Zone — Modal Controller (3-Step Form)
// ─────────────────────────────────────────────────

class ModalController {
  constructor() {
    this.currentService  = null;
    this.currentStep     = 1;
    this.selectedPackage = null;
    this.selectedPayment = null;
    this.playerIdValue   = '';
    this.playerPasswordValue = '';
    this.screenshotBase64 = null;
    this.paymentRefValue  = '';
    this.contactNumber   = '';
    this.overlay         = null;
    this.modal           = null;
  }

  open(serviceId) {
    this.currentService  = SERVICES.find(s => s.id === serviceId);
    if (!this.currentService) return;
    this.currentStep     = 1;
    this.selectedPackage = null;
    this.selectedPayment = null;
    this.playerIdValue   = '';
    this.playerPasswordValue = '';
    this.screenshotBase64 = null;
    this.paymentRefValue  = '';
    this.contactNumber   = '';

    this._inject();
    requestAnimationFrame(() => {
      this.overlay.classList.add('visible');
      this.modal.classList.add('visible');
    });

    document.body.style.overflow = 'hidden';
    this._renderStep(1);
  }

  close() {
    if (!this.overlay) return;
    this.overlay.classList.remove('visible');
    this.modal.classList.remove('visible');

    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      document.body.style.overflow = '';
      this.overlay = null;
      this.modal   = null;
    }, 350);
  }

  refreshCurrentStep() {
    if (this.overlay && this.modal) {
      this._renderStep(this.currentStep);
    }
  }

  sendToWhatsApp(order) {
    if (!order) return;
    const pmSettings = order.paymentDetails || devSettings.getPagoMovil();
    
    // Format phone: e.g. "0424-7384795" -> "584247384795"
    let rawPhone = pmSettings.phone.replace(/\D/g, '');
    if (rawPhone.startsWith('0')) {
      rawPhone = '58' + rawPhone.slice(1);
    } else if (!rawPhone.startsWith('58')) {
      rawPhone = '58' + rawPhone;
    }
    
    const textPlain = `¡Hola TopUp Zone! Realicé un pago para mi orden:
- Orden ID: ${order.orderId}
- Servicio: ${order.serviceName}
- ID Jugador: ${order.playerId}
- Paquete: ${order.package.label}
- Monto: $${order.totalUSD.toFixed(2)} / ${order.totalBs.toFixed(2)} Bs
- Método: ${order.paymentMethod === 'pago_movil' ? 'Pago Móvil' : order.paymentMethod === 'binance' ? 'Binance Pay' : 'Tarjeta'}

Adjunto capture del comprobante de pago.`;

    const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(textPlain)}`;

    navigator.clipboard.writeText(textPlain).then(() => {
      showToast('Detalles copiados al portapapeles 📋', 'success');
      setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 800);
    }).catch(() => {
      window.location.href = whatsappUrl;
    });
  }

  _inject() {
    // Remover modal anterior si existe
    const prev = document.getElementById('modal-overlay');
    if (prev) prev.parentNode.removeChild(prev);

    const svc = this.currentService;
    const logoHTML = svc.logo
      ? `<img src="${svc.logo}" alt="${svc.name}" class="modal-logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">`
      : '';
    const svgFallback = svc.id === 'movistar' ? MOBILE_SVG.movistar
                      : svc.id === 'digitel'   ? MOBILE_SVG.digitel
                      : '';

    this.overlay = document.createElement('div');
    this.overlay.id = 'modal-overlay';
    this.overlay.className = 'modal-overlay';
    this.overlay.innerHTML = `
      <div class="modal-container" id="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="modal-close" id="modal-close-btn" aria-label="Cerrar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div class="modal-header" style="--svc-color:${svc.color}; --svc-glow:${svc.glow}">
          <div class="modal-logo-wrap">
            ${logoHTML}
            <div class="modal-logo-svg" style="${svc.logo ? 'display:none' : 'display:flex'}">${svgFallback}</div>
          </div>
          <div class="modal-header-text">
            <h2 id="modal-title" class="modal-service-name">${svc.name}</h2>
            <p class="modal-service-desc">${svc.description}</p>
          </div>
        </div>

        <div class="modal-stepper">
          <div class="step-item" id="step-item-1">
            <div class="step-circle" data-step="1">1</div>
            <span>ID / Teléfono</span>
          </div>
          <div class="step-line"></div>
          <div class="step-item" id="step-item-2">
            <div class="step-circle" data-step="2">2</div>
            <span>Paquete</span>
          </div>
          <div class="step-line"></div>
          <div class="step-item" id="step-item-3">
            <div class="step-circle" data-step="3">3</div>
            <span>Pago</span>
          </div>
        </div>

        <div class="modal-body" id="modal-body"></div>

        <div class="modal-actions">
          <button class="btn-secondary" id="modal-back-btn" style="display:none">← Atrás</button>
          <button class="btn-primary" id="modal-next-btn" style="--svc-color:${svc.color}">
            Continuar →
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.modal = this.overlay.querySelector('#modal-container');

    // Events
    document.getElementById('modal-close-btn').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
    document.getElementById('modal-next-btn').addEventListener('click', () => this._nextStep());
    document.getElementById('modal-back-btn').addEventListener('click', () => this._prevStep());
  }

  _renderStep(step) {
    const body    = document.getElementById('modal-body');
    const nextBtn = document.getElementById('modal-next-btn');
    const backBtn = document.getElementById('modal-back-btn');
    const svc     = this.currentService;

    // Update stepper visuals
    [1, 2, 3].forEach(n => {
      const item = document.getElementById(`step-item-${n}`);
      const circle = item?.querySelector('.step-circle');
      if (!item || !circle) return;
      item.classList.toggle('active', n === step);
      item.classList.toggle('done',   n < step);
      if (n < step) circle.innerHTML = '✓';
      else circle.textContent = n;
    });

    backBtn.style.display = step > 1 ? 'flex' : 'none';

    // ── Step 1: Player ID ──────────────────────
    if (step === 1) {
      nextBtn.textContent = 'Continuar →';
      
      const passwordFieldHTML = svc.requiresPassword ? `
        <label class="form-label" for="player-password" style="margin-top:1.25rem;">${svc.passwordLabel || 'Contraseña del juego'}</label>
        <div class="input-wrap">
          <input
            type="password"
            id="player-password"
            class="form-input"
            placeholder="${svc.passwordPlaceholder || '••••'}"
            value="${this.playerPasswordValue || ''}"
          />
          <span class="input-icon">🔑</span>
        </div>
      ` : '';

      body.innerHTML = `
        <div class="step-content fade-in">
          <label class="form-label" for="player-id">${svc.idLabel}</label>
          <div class="input-wrap">
            <input
              type="text"
              id="player-id"
              class="form-input"
              placeholder="${svc.idPlaceholder}"
              autocomplete="off"
              value="${this.playerIdValue}"
            />
            <span class="input-icon">🎮</span>
          </div>
          <p class="form-hint" id="id-hint">${svc.idHint}</p>
          <div class="id-validation" id="id-validation"></div>
          ${passwordFieldHTML}
        </div>
      `;

      const input = document.getElementById('player-id');
      const passInput = document.getElementById('player-password');
      const validation = document.getElementById('id-validation');

      input.addEventListener('input', () => {
        this.playerIdValue = input.value.trim();
        const valid = svc.idPattern.test(this.playerIdValue);
        input.classList.toggle('input-valid', valid);
        input.classList.toggle('input-error', this.playerIdValue.length > 0 && !valid);
        validation.innerHTML = this.playerIdValue.length > 0
          ? valid
            ? `<span class="valid-msg">✅ ID válido</span>`
            : `<span class="error-msg">⚠️ Formato incorrecto</span>`
          : '';
      });

      if (passInput) {
        passInput.addEventListener('input', () => {
          this.playerPasswordValue = passInput.value;
          passInput.classList.toggle('input-valid', this.playerPasswordValue.length >= 4);
        });
      }

      setTimeout(() => input.focus(), 100);
    }

    // ── Step 2: Package Selection ──────────────
    else if (step === 2) {
      nextBtn.textContent = 'Continuar →';
      body.innerHTML = `
        <div class="step-content fade-in">
          <p class="step-subtitle">Selecciona el paquete para <strong>${this.playerIdValue}</strong></p>
          <div class="packages-grid" id="packages-grid">
            ${svc.packages.map(pkg => `
              <div class="package-card ${pkg.popular ? 'package-popular' : ''} ${this.selectedPackage?.id === pkg.id ? 'selected' : ''}"
                   data-pkg-id="${pkg.id}"
                   role="button" tabindex="0"
                   aria-pressed="${this.selectedPackage?.id === pkg.id}">
                ${pkg.popular ? '<div class="pkg-popular-badge">⭐ MÁS POPULAR</div>' : ''}
                ${pkg.bonus   ? `<div class="pkg-bonus-badge">+${pkg.bonus}</div>` : ''}
                <div class="pkg-label">${pkg.label}</div>
                <div class="pkg-prices">
                  <span class="pkg-price-usd">$${pkg.price_usd.toFixed(2)}</span>
                  <span class="pkg-price-bs">${pkg.price_bs.toFixed(2)} Bs</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      document.querySelectorAll('.package-card').forEach(card => {
        const handler = () => {
          const pkgId = card.dataset.pkgId;
          this.selectedPackage = svc.packages.find(p => p.id === pkgId);
          document.querySelectorAll('.package-card').forEach(c => {
            c.classList.remove('selected');
            c.setAttribute('aria-pressed', 'false');
          });
          card.classList.add('selected');
          card.setAttribute('aria-pressed', 'true');
          nextBtn.textContent = `Continuar → $${this.selectedPackage.price_usd.toFixed(2)}`;
        };
        card.addEventListener('click', handler);
        card.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') handler(); });
      });
    }

    // ── Step 3: Payment Method ─────────────────
    else if (step === 3) {
      const pkg = this.selectedPackage;
      nextBtn.textContent = `Confirmar Recarga $${pkg.price_usd.toFixed(2)}`;
      nextBtn.classList.add('btn-confirm');

      body.innerHTML = `
        <div class="step-content fade-in">
          <div class="order-summary">
            <div class="summary-row">
              <span>Servicio</span><strong>${svc.name}</strong>
            </div>
            <div class="summary-row">
              <span>ID / Teléfono</span><strong>${this.playerIdValue}</strong>
            </div>
            ${svc.requiresPassword ? `
              <div class="summary-row">
                <span>Contraseña</span><strong>••••••••</strong>
              </div>
            ` : ''}
            <div class="summary-row">
              <span>Paquete</span><strong>${pkg.label}</strong>
            </div>
            <div class="summary-row total">
              <span>Total</span>
              <strong>$${pkg.price_usd.toFixed(2)} <small>/ ${pkg.price_bs.toFixed(2)} Bs</small></strong>
            </div>
          </div>

          <p class="step-subtitle" style="margin-top:1.5rem">Método de pago</p>
          <div class="payment-methods-grid" id="payment-methods-grid">
            ${PAYMENT_METHODS.map(pm => `
              <div class="payment-method-card ${this.selectedPayment?.id === pm.id ? 'selected' : ''}"
                   data-payment-id="${pm.id}"
                   style="--pm-gradient:${pm.gradient}; --pm-glow:${pm.glow}"
                   role="button" tabindex="0">
                <span class="pm-icon">${pm.icon}</span>
                <div class="pm-info">
                  <span class="pm-name">${pm.name}</span>
                  <span class="pm-desc">${pm.description}</span>
                </div>
                <span class="pm-check">✓</span>
              </div>
            `).join('')}
          </div>

          <div class="payment-details-container" id="payment-details"></div>

          <!-- SCREENSHOT UPLOAD BLOCK -->
          <div id="screenshot-upload-wrap" style="display:none; margin-top:1.5rem;">
            <label class="form-label" for="screenshot-input" style="font-weight:700; display:flex; align-items:center; gap:0.5rem;">
              📸 Capture del Comprobante
              <span style="background:#ff4757; color:#fff; font-size:0.65rem; padding:0.15rem 0.45rem; border-radius:99px; font-weight:700; letter-spacing:0.04em;">OBLIGATORIO</span>
            </label>
            <div id="screenshot-dropzone"
                 style="margin-top:0.6rem; border:2px dashed rgba(99,102,241,0.4); border-radius:var(--radius-lg); padding:1.25rem; text-align:center; cursor:pointer; transition:all 0.25s ease; background:rgba(99,102,241,0.04);"
                 onclick="document.getElementById('screenshot-input').click()"
                 ondragover="event.preventDefault(); this.style.borderColor='#6366f1'; this.style.background='rgba(99,102,241,0.1)'"
                 ondragleave="this.style.borderColor='rgba(99,102,241,0.4)'; this.style.background='rgba(99,102,241,0.04)'"
                 ondrop="event.preventDefault(); this.style.borderColor='rgba(99,102,241,0.4)'; this.style.background='rgba(99,102,241,0.04)'; document.getElementById('screenshot-input').files = event.dataTransfer.files; document.getElementById('screenshot-input').dispatchEvent(new Event('change'))">
              <div id="screenshot-dropzone-inner">
                <div style="font-size:2rem; margin-bottom:0.4rem;">📷</div>
                <p style="font-size:0.82rem; color:var(--text-secondary); font-weight:600; margin:0 0 0.2rem;">Haz clic o arrastra tu capture aquí</p>
                <p style="font-size:0.72rem; color:var(--text-muted); margin:0;">JPG, PNG, WEBP — Max 5MB</p>
              </div>
              <input type="file" id="screenshot-input" accept="image/*" style="display:none;" />
              <div id="screenshot-preview-wrap" style="display:none; margin-top:0.75rem;">
                <img id="screenshot-preview-img" style="max-height:130px; max-width:100%; border-radius:var(--radius-sm); border:2px solid rgba(34,197,94,0.5); display:block; margin:0 auto;" />
                <p style="font-size:0.72rem; color:#4ade80; margin:0.4rem 0 0; font-weight:600;">✅ Capture cargado correctamente</p>
              </div>
            </div>
          </div>


          <!-- PAYMENT REFERENCE INPUT -->
          <div id="payment-ref-wrap" style="display:none; margin-top:1.25rem;">
            <label class="form-label" for="payment-ref-input" style="font-weight:700;">🔢 Número de Referencia <span style="color:var(--accent-red,#ff4757);font-size:0.8rem;">* Obligatorio</span></label>
            <div class="input-wrap" style="margin-top:0.4rem;">
              <input
                type="text"
                id="payment-ref-input"
                class="form-input"
                placeholder="Ej: 123456789 (número de confirmación del banco o Binance)"
                value="${this.paymentRefValue || ''}"
                autocomplete="off"
                oninput="modalController.paymentRefValue = this.value.trim()"
              />
              <span class="input-icon">🔢</span>
            </div>
            <p class="form-hint" style="margin-top:0.35rem;">Escribe el número de referencia que aparece en tu comprobante de pago.</p>

            <!-- CONTACT NUMBER -->
            <label class="form-label" for="contact-number-input" style="font-weight:700; margin-top:1rem; display:block;">📞 Número de Contacto (WhatsApp) <span style="color:var(--accent-red,#ff4757);font-size:0.8rem;">* Obligatorio</span></label>
            <div class="input-wrap" style="margin-top:0.4rem;">
              <input
                type="tel"
                id="contact-number-input"
                class="form-input"
                placeholder="Ej: 04241234567"
                value="${this.contactNumber || ''}"
                autocomplete="tel"
                maxlength="15"
                oninput="modalController.contactNumber = this.value.trim()"
              />
              <span class="input-icon">📞</span>
            </div>
            <p class="form-hint" style="margin-top:0.35rem;">Te notificaremos por WhatsApp cuando tu recarga sea procesada.</p>
          </div>
        </div>
      `;

      const checkScreenshotVisibility = () => {
        const wrap    = document.getElementById('screenshot-upload-wrap');
        const refWrap = document.getElementById('payment-ref-wrap');
        const isManual = (this.selectedPayment?.id === 'pago_movil' || this.selectedPayment?.id === 'binance');
        if (wrap)    wrap.style.display    = isManual ? 'block' : 'none';
        if (refWrap) refWrap.style.display = isManual ? 'block' : 'none';
      };

      document.querySelectorAll('.payment-method-card').forEach(card => {
        const handler = () => {
          const pmId = card.dataset.paymentId;
          this.selectedPayment = PAYMENT_METHODS.find(p => p.id === pmId);
          document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          paymentController.showDetails(this.selectedPayment);
          checkScreenshotVisibility();
          // Bind ref input after payment detail renders
          setTimeout(() => {
            const refInput = document.getElementById('payment-ref-input');
            if (refInput) {
              refInput.value = this.paymentRefValue || '';
              // Fallback listener (oninput inline ya cubre esto)
              refInput.addEventListener('input', () => { this.paymentRefValue = refInput.value.trim(); });
            }
            const contactInput = document.getElementById('contact-number-input');
            if (contactInput) {
              contactInput.value = this.contactNumber || '';
              // Fallback listener (oninput inline ya cubre esto)
              contactInput.addEventListener('input', () => { this.contactNumber = contactInput.value.trim(); });
            }
          }, 50);
        };
        card.addEventListener('click', handler);
        card.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') handler(); });
      });

      // Bind file input listener
      const fileInput = document.getElementById('screenshot-input');
      const previewImg = document.getElementById('screenshot-preview-img');
      const previewWrap = document.getElementById('screenshot-preview-wrap');

      fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) {
          this.screenshotBase64 = null;
          if (previewWrap) previewWrap.style.display = 'none';
          return;
        }

        // Comprimir imagen antes de guardar (evita QuotaExceededError en localStorage)
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            // Redimensionar a max 900px manteniendo proporción
            const MAX_W = 900;
            let w = img.width;
            let h = img.height;
            if (w > MAX_W) {
              h = Math.round((h * MAX_W) / w);
              w = MAX_W;
            }
            const canvas = document.createElement('canvas');
            canvas.width  = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            // Comprimir a JPEG 65% calidad (~80-150KB para foto normal)
            const compressed = canvas.toDataURL('image/jpeg', 0.65);
            this.screenshotBase64 = compressed;
            if (previewImg) {
              previewImg.src = compressed;
              if (previewWrap) previewWrap.style.display = 'block';
            }
          };
          img.onerror = () => {
            // Fallback: usar la imagen original sin comprimir
            this.screenshotBase64 = event.target.result;
            if (previewImg) {
              previewImg.src = event.target.result;
              if (previewWrap) previewWrap.style.display = 'block';
            }
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });

      // Initial check
      checkScreenshotVisibility();
    }
  }

  _nextStep() {
    if (this.currentStep === 1) {
      const svc = this.currentService;
      if (!this.playerIdValue || !svc.idPattern.test(this.playerIdValue)) {
        const input = document.getElementById('player-id');
        if (input) {
          input.classList.add('shake', 'input-error');
          setTimeout(() => input.classList.remove('shake'), 600);
        }
        showToast('Por favor ingresa un ID válido', 'warning');
        return;
      }
      
      if (svc.requiresPassword && (!this.playerPasswordValue || this.playerPasswordValue.length < 4)) {
        const passInput = document.getElementById('player-password');
        if (passInput) {
          passInput.classList.add('shake', 'input-error');
          setTimeout(() => passInput.classList.remove('shake'), 600);
        }
        showToast('Por favor ingresa tu contraseña de cuenta', 'warning');
        return;
      }
      
      this.currentStep = 2;
      this._renderStep(2);

    } else if (this.currentStep === 2) {
      if (!this.selectedPackage) {
        showToast('Selecciona un paquete para continuar', 'warning');
        const grid = document.getElementById('packages-grid');
        if (grid) { grid.classList.add('shake'); setTimeout(() => grid.classList.remove('shake'), 600); }
        return;
      }
      this.currentStep = 3;
      this._renderStep(3);

    } else if (this.currentStep === 3) {
      if (!this.selectedPayment) {
        showToast('Selecciona un método de pago', 'warning');
        return;
      }
      this._confirmOrder();
    }
  }

  _prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      document.getElementById('modal-next-btn').classList.remove('btn-confirm');
      this._renderStep(this.currentStep);
    }
  }

  async _confirmOrder() {
    const nextBtn = document.getElementById('modal-next-btn');
    nextBtn.disabled = true;
    nextBtn.textContent = '⏳ Procesando...';
    nextBtn.classList.add('loading');

    // ── Leer valores del DOM primero (fallback robusto) ──────────
    // Garantiza que los valores se capturen incluso si el event listener
    // no se conectó (ej: pegar texto, autocompletar del navegador)
    const refInputDOM     = document.getElementById('payment-ref-input');
    const contactInputDOM = document.getElementById('contact-number-input');
    if (refInputDOM     && refInputDOM.value.trim())     this.paymentRefValue = refInputDOM.value.trim();
    if (contactInputDOM && contactInputDOM.value.trim()) this.contactNumber   = contactInputDOM.value.trim();

    // Capture de comprobante OBLIGATORIO para pagos manuales
    if ((this.selectedPayment.id === 'pago_movil' || this.selectedPayment.id === 'binance') && !this.screenshotBase64) {
      showToast('📸 Debes subir la captura de tu comprobante de pago', 'warning');
      const wrap = document.getElementById('screenshot-upload-wrap');
      if (wrap) {
        wrap.classList.add('shake');
        wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => wrap.classList.remove('shake'), 600);
      }
      nextBtn.disabled = false;
      nextBtn.textContent = `Confirmar Recarga $${this.selectedPackage.price_usd.toFixed(2)}`;
      nextBtn.classList.remove('loading');
      return;
    }

    // Verify reference number is entered for manual payments
    if ((this.selectedPayment.id === 'pago_movil' || this.selectedPayment.id === 'binance') && !this.paymentRefValue) {
      showToast('🔢 Por favor ingresa el número de referencia de tu pago', 'warning');
      const refInput = document.getElementById('payment-ref-input');
      if (refInput) {
        refInput.classList.add('shake', 'input-error');
        setTimeout(() => refInput.classList.remove('shake', 'input-error'), 600);
        refInput.focus();
      }
      nextBtn.disabled = false;
      nextBtn.textContent = `Confirmar Recarga $${this.selectedPackage.price_usd.toFixed(2)}`;
      nextBtn.classList.remove('loading');
      return;
    }

    // Verify contact number is entered for manual payments
    if ((this.selectedPayment.id === 'pago_movil' || this.selectedPayment.id === 'binance') && !this.contactNumber) {
      showToast('📞 Por favor ingresa tu número de contacto (WhatsApp)', 'warning');
      const contactInput = document.getElementById('contact-number-input');
      if (contactInput) {
        contactInput.classList.add('shake', 'input-error');
        setTimeout(() => contactInput.classList.remove('shake', 'input-error'), 600);
        contactInput.focus();
      }
      nextBtn.disabled = false;
      nextBtn.textContent = `Confirmar Recarga $${this.selectedPackage.price_usd.toFixed(2)}`;
      nextBtn.classList.remove('loading');
      return;
    }

    const pmSettings = devSettings.getPagoMovil();
    const orderData = {
      serviceId:         this.currentService.id,
      serviceName:       this.currentService.name,
      playerId:          this.playerIdValue,
      playerPassword:    this.currentService.requiresPassword ? this.playerPasswordValue : null,
      package:           this.selectedPackage,
      paymentMethod:     this.selectedPayment.id,
      totalUSD:          this.selectedPackage.price_usd,
      totalBs:           this.selectedPackage.price_bs,
      paymentDetails:    this.selectedPayment.id === 'pago_movil' ? pmSettings : null,
      paymentRef:        this.paymentRefValue || ('REF-' + Date.now().toString().slice(-10)),
      contactNumber:     this.contactNumber || null,
      paymentScreenshot: this.screenshotBase64 || null
    };

    try {
      const order = await firebase.createOrder(orderData);
      this.lastConfirmedOrder = order;

      // Registrar orden para seguimiento en tiempo real
      if (order.paymentMethod === 'pago_movil' || order.paymentMethod === 'binance') {
        if (typeof orderWatcher !== 'undefined') {
          orderWatcher.watch(order.orderId, order);
        }
      }

      // Mostrar éxito
      this._showSuccess(order);
    } catch (err) {
      showToast('Error procesando la orden. Intenta nuevamente.', 'error');
      nextBtn.disabled = false;
      nextBtn.textContent = `Confirmar Recarga $${this.selectedPackage.price_usd.toFixed(2)}`;
      nextBtn.classList.remove('loading');
    }
  }

  _showSuccess(order) {
    const body = document.getElementById('modal-body');
    const actions = document.querySelector('.modal-actions');
    const stepper = document.querySelector('.modal-stepper');
    if (stepper) stepper.style.display = 'none';
    if (actions) actions.style.display = 'none';

    const isManual = order.paymentMethod === 'pago_movil' || order.paymentMethod === 'binance';

    body.innerHTML = `
      <div class="success-screen fade-in">

        ${isManual ? `
          <!-- VERIFICACIÓN EN PROCESO -->
          <div class="processing-banner">
            <div class="processing-spinner"></div>
            <div class="processing-text">
              <strong>⏳ Verificando tu pago…</strong>
              <span>Nuestro equipo está revisando tu comprobante</span>
            </div>
          </div>
        ` : `
          <div class="success-icon-wrap">
            <div class="success-ring"></div>
            <div class="success-checkmark">✓</div>
          </div>
        `}

        <h3 class="success-title">${isManual ? '¡Pedido Recibido!' : '¡Orden Confirmada!'}</h3>
        <p class="success-subtitle">
          ${isManual
            ? 'Tu pago está siendo procesado y verificado por nuestro equipo'
            : 'Tu recarga está siendo procesada'}
        </p>

        <div class="success-order-id">
          <span>Orden:</span> <strong>${order.orderId}</strong>
        </div>

        <div class="success-details">
          <div class="success-row"><span>Servicio</span><strong>${order.serviceName}</strong></div>
          <div class="success-row"><span>ID / Teléfono</span><strong>${order.playerId}</strong></div>
          <div class="success-row"><span>Paquete</span><strong>${order.package.label}</strong></div>
          <div class="success-row"><span>Total</span><strong>$${order.totalUSD.toFixed(2)} <small>/ ${order.totalBs.toFixed(2)} Bs</small></strong></div>
          <div class="success-row"><span>Método</span><strong>${PAYMENT_METHODS.find(p=>p.id===order.paymentMethod)?.name}</strong></div>
          ${order.paymentRef ? `<div class="success-row"><span>Referencia</span><strong style="color:var(--accent-green,#22c55e)">${order.paymentRef}</strong></div>` : ''}
          ${order.contactNumber ? `<div class="success-row"><span>Contacto</span><strong>${order.contactNumber}</strong></div>` : ''}
        </div>

        ${isManual ? `
          <div class="verification-status-box">
            <div class="vsb-icon">🔍</div>
            <div class="vsb-content">
              <p class="vsb-title">Verificación en progreso</p>
              <p class="vsb-desc">Te contactaremos al <strong>${order.contactNumber || 'número indicado'}</strong> cuando tu recarga sea confirmada. Tiempo estimado: <strong>5–15 minutos</strong>.</p>
            </div>
          </div>
        ` : `
          <div class="payment-info-box pm-purple">
            <p class="pm-info-title">💳 Procesando pago con tarjeta</p>
            <p class="pm-info-note">🔒 Tu pago está siendo procesado de forma segura</p>
          </div>
        `}

        <button class="btn-primary" onclick="modalController.close()" style="margin-top:1.5rem; width:100%">
          Entendido ✓
        </button>
      </div>
    `;

    // Solo confetti en tarjeta (no en pagos manuales que están pendientes)
    if (!isManual) launchConfetti();
  }
}

const modalController = new ModalController();
