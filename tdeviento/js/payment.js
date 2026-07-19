// ─────────────────────────────────────────────────
//  TopUp Zone — Payment Controller
// ─────────────────────────────────────────────────

class PaymentController {
  showDetails(paymentMethod) {
    const container = document.getElementById('payment-details');
    if (!container) return;

    container.innerHTML = '';
    container.classList.remove('visible');

    let html = '';

    if (paymentMethod.id === 'pago_movil') {
      const pmSettings = devSettings.getPagoMovil();
      html = `
        <div class="payment-detail-card pm-green-card fade-in">
          <div class="pd-header">
            <span class="pd-icon">📱</span>
            <span class="pd-title">Datos para Pago Móvil</span>
          </div>
          <div class="pd-rows">
            <div class="pd-row"><span>Banco</span><strong>${pmSettings.bank}</strong></div>
            <div class="pd-row"><span>Teléfono</span><strong>${pmSettings.phone}</strong></div>
            <div class="pd-row"><span>RIF/CI</span><strong>${pmSettings.rif}</strong></div>
          </div>
          <p class="pd-note">💡 Pon como concepto tu número de orden (se genera al confirmar)</p>
        </div>
      `;
    } else if (paymentMethod.id === 'binance') {
      html = `
        <div class="payment-detail-card pm-gold-card fade-in">
          <div class="pd-header">
            <span class="pd-icon">₿</span>
            <span class="pd-title">Datos Binance Pay / USDT</span>
          </div>
          <div class="pd-rows">
            <div class="pd-row"><span>Red</span><strong>BEP-20 (BSC)</strong></div>
            <div class="pd-row">
              <span>Wallet</span>
              <strong class="pd-wallet">0x742d35Cc66...C9F6
                <button class="copy-btn" onclick="navigator.clipboard.writeText('0x742d35Cc6634C0532925a3b8D4C9F6'); showToast('Dirección copiada 📋', 'success')">📋</button>
              </strong>
            </div>
          </div>
          <div class="pd-qr-placeholder">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
              <rect width="100" height="100" fill="#1a1a2e" rx="8"/>
              <!-- QR Pattern simulated -->
              <rect x="10" y="10" width="30" height="30" fill="none" stroke="#f59e0b" stroke-width="3" rx="2"/>
              <rect x="15" y="15" width="20" height="20" fill="#f59e0b" rx="1"/>
              <rect x="60" y="10" width="30" height="30" fill="none" stroke="#f59e0b" stroke-width="3" rx="2"/>
              <rect x="65" y="15" width="20" height="20" fill="#f59e0b" rx="1"/>
              <rect x="10" y="60" width="30" height="30" fill="none" stroke="#f59e0b" stroke-width="3" rx="2"/>
              <rect x="15" y="65" width="20" height="20" fill="#f59e0b" rx="1"/>
              <rect x="45" y="10" width="5" height="5" fill="#f59e0b" rx="1"/>
              <rect x="52" y="10" width="5" height="5" fill="#f59e0b" rx="1"/>
              <rect x="45" y="17" width="5" height="5" fill="#f59e0b" rx="1"/>
              <rect x="52" y="24" width="5" height="5" fill="#f59e0b" rx="1"/>
              <rect x="45" y="45" width="5" height="5" fill="#f59e0b" rx="1"/>
              <rect x="52" y="45" width="5" height="5" fill="#f59e0b" rx="1"/>
              <rect x="60" y="45" width="5" height="5" fill="#f59e0b" rx="1"/>
              <rect x="67" y="45" width="5" height="5" fill="#f59e0b" rx="1"/>
              <rect x="74" y="45" width="5" height="5" fill="#f59e0b" rx="1"/>
              <rect x="45" y="52" width="5" height="5" fill="#f59e0b" rx="1"/>
              <rect x="60" y="60" width="5" height="5" fill="#f59e0b" rx="1"/>
              <rect x="67" y="67" width="5" height="5" fill="#f59e0b" rx="1"/>
              <rect x="74" y="60" width="5" height="5" fill="#f59e0b" rx="1"/>
              <rect x="60" y="74" width="5" height="5" fill="#f59e0b" rx="1"/>
              <rect x="74" y="74" width="5" height="5" fill="#f59e0b" rx="1"/>
            </svg>
          </div>
          <p class="pd-note">⚡ Confirmación automática en 1–3 minutos tras el pago</p>
        </div>
      `;
    } else if (paymentMethod.id === 'card') {
      html = `
        <div class="payment-detail-card pm-purple-card fade-in">
          <div class="pd-header">
            <span class="pd-icon">💳</span>
            <span class="pd-title">Pago con Tarjeta</span>
          </div>
          <div class="card-form">
            <div class="card-visual" id="card-visual">
              <div class="card-chip">
                <svg viewBox="0 0 40 30" width="40" height="30">
                  <rect width="40" height="30" rx="4" fill="#c9a227" opacity="0.8"/>
                  <line x1="0" y1="10" x2="40" y2="10" stroke="#a07810" stroke-width="1"/>
                  <line x1="0" y1="20" x2="40" y2="20" stroke="#a07810" stroke-width="1"/>
                  <line x1="13" y1="0" x2="13" y2="30" stroke="#a07810" stroke-width="1"/>
                  <line x1="27" y1="0" x2="27" y2="30" stroke="#a07810" stroke-width="1"/>
                </svg>
              </div>
              <div class="card-number-display" id="card-num-display">•••• •••• •••• ••••</div>
              <div class="card-bottom">
                <div><p class="card-label">TITULAR</p><p class="card-value" id="card-holder-display">NOMBRE APELLIDO</p></div>
                <div><p class="card-label">EXPIRA</p><p class="card-value" id="card-expiry-display">MM/AA</p></div>
                <div class="card-network">
                  <span style="font-size:1.5rem">💳</span>
                </div>
              </div>
            </div>

            <div class="card-fields">
              <div class="card-field">
                <label>Número de tarjeta</label>
                <input type="text" id="card-number" class="form-input" placeholder="1234 5678 9012 3456"
                  maxlength="19"
                  oninput="paymentController.formatCard(this)"
                />
              </div>
              <div class="card-field-row">
                <div class="card-field">
                  <label>Titular</label>
                  <input type="text" id="card-holder" class="form-input" placeholder="Como aparece en la tarjeta"
                    oninput="document.getElementById('card-holder-display').textContent = this.value.toUpperCase() || 'NOMBRE APELLIDO'"
                  />
                </div>
                <div class="card-field" style="max-width:100px">
                  <label>Expira</label>
                  <input type="text" id="card-expiry" class="form-input" placeholder="MM/AA"
                    maxlength="5"
                    oninput="paymentController.formatExpiry(this)"
                  />
                </div>
                <div class="card-field" style="max-width:80px">
                  <label>CVV</label>
                  <input type="password" id="card-cvv" class="form-input" placeholder="•••" maxlength="4"/>
                </div>
              </div>
            </div>
          </div>
          <p class="pd-note">🔒 Pago encriptado con SSL 256-bit · PCI DSS Compliant</p>
        </div>
      `;
    }

    container.innerHTML = html;
    requestAnimationFrame(() => container.classList.add('visible'));
  }

  formatCard(input) {
    let v = input.value.replace(/\D/g, '').substring(0, 16);
    input.value = v.replace(/(.{4})/g, '$1 ').trim();
    const display = document.getElementById('card-num-display');
    if (display) {
      const shown = v.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
      display.textContent = shown;
    }
  }

  formatExpiry(input) {
    let v = input.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2);
    input.value = v;
    const display = document.getElementById('card-expiry-display');
    if (display) display.textContent = v || 'MM/AA';
  }
}

const paymentController = new PaymentController();
