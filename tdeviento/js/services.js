// ─────────────────────────────────────────────────
//  TopUp Zone — Services & Packages Data
// ─────────────────────────────────────────────────

const devSettings = {
  getExchangeRate() {
    const stored = localStorage.getItem('tasa_cambio');
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 36.2; // Default rate, matches current hardcoded prices
  },
  
  setExchangeRate(rate) {
    localStorage.setItem('tasa_cambio', rate);
    updatePackagePricesBs();
  },
  
  getPagoMovil() {
    const defaults = {
      bank: "Banco Nacional de Crédito",
      phone: "0424-7384795",
      rif: "V-30885729"
    };
    const stored = localStorage.getItem('pago_movil_settings');
    if (stored) {
      try {
        return { ...defaults, ...JSON.parse(stored) };
      } catch (e) {}
    }
    return defaults;
  },
  
  setPagoMovil(settings) {
    localStorage.setItem('pago_movil_settings', JSON.stringify(settings));
    updatePagoMovilDetails();
  }
};

function updatePackagePricesBs() {
  const rate = devSettings.getExchangeRate();
  SERVICES.forEach(svc => {
    svc.packages.forEach(pkg => {
      pkg.price_bs = pkg.price_usd * rate;
    });
  });
}

function updatePagoMovilDetails() {
  const pmSettings = devSettings.getPagoMovil();
  const pm = PAYMENT_METHODS.find(p => p.id === 'pago_movil');
  if (pm) {
    pm.details = {
      bank: pmSettings.bank,
      phone: pmSettings.phone,
      rif: pmSettings.rif,
      concept: "Tu orden será confirmada en 5–15 min"
    };
  }
}

const DEFAULT_SERVICES = [
  {
    id: "freefire",
    name: "Free Fire",
    category: "gaming",
    badge: "Popular",
    badgeType: "hot",
    logo: "./assets/logos/freefire.png",
    description: "Diamonds para Free Fire",
    color: "#ff6b00",
    glow: "rgba(255, 107, 0, 0.4)",
    idLabel: "ID del Jugador",
    idPlaceholder: "Ej: 123456789",
    idPattern: "^\\d{6,12}$",
    idHint: "Ingresa tu ID numérico de Free Fire (6–12 dígitos)",
    packages: [
      { id: "ff_100",  label: "100 Diamonds",            price_usd: 1.99,  price_bs: 0,   bonus: null },
      { id: "ff_310",  label: "310 Diamonds",            price_usd: 4.99,  price_bs: 0,  bonus: null },
      { id: "ff_520",  label: "520 + 52 Bonus Diamonds", price_usd: 7.99,  price_bs: 0,  bonus: "52 BONUS", popular: true },
      { id: "ff_1060", label: "1060 + 106 Bonus",        price_usd: 14.99, price_bs: 0,  bonus: "106 BONUS" },
      { id: "ff_2180", label: "2180 + 218 Bonus",        price_usd: 29.99, price_bs: 0, bonus: "218 BONUS" },
    ]
  },
  {
    id: "roblox",
    name: "Roblox",
    category: "gaming",
    badge: "Nuevo",
    badgeType: "new",
    logo: "./assets/logos/roblox.png",
    description: "Robux para Roblox",
    color: "#e53e3e",
    glow: "rgba(229, 62, 62, 0.4)",
    idLabel: "Usuario de Roblox",
    idPlaceholder: "Ej: MiUsuario123",
    idPattern: "^[a-zA-Z0-9_]{3,20}$",
    idHint: "Tu nombre de usuario de Roblox (3–20 caracteres)",
    requiresPassword: true,
    passwordLabel: "Contraseña de Roblox",
    passwordPlaceholder: "Introduce tu contraseña de Roblox",
    packages: [
      { id: "rbx_80",   label: "80 Robux",           price_usd: 0.99,  price_bs: 0,   bonus: null },
      { id: "rbx_400",  label: "400 Robux",           price_usd: 4.99,  price_bs: 0,  bonus: null },
      { id: "rbx_800",  label: "800 Robux",           price_usd: 9.99,  price_bs: 0,  popular: true },
      { id: "rbx_1700", label: "1700 Robux",          price_usd: 19.99, price_bs: 0,  bonus: null },
      { id: "rbx_4500", label: "4500 Robux",          price_usd: 49.99, price_bs: 0, bonus: null },
    ]
  },
  {
    id: "pubg",
    name: "PUBG Mobile",
    category: "gaming",
    badge: "Top",
    badgeType: "hot",
    logo: "./assets/logos/pubg.png",
    description: "UC para PUBG Mobile",
    color: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.4)",
    idLabel: "ID del Jugador PUBG",
    idPlaceholder: "Ej: 5123456789",
    idPattern: "^\\d{8,12}$",
    idHint: "ID numérico de PUBG Mobile (8–12 dígitos)",
    packages: [
      { id: "uc_60",   label: "60 UC",            price_usd: 0.99,  price_bs: 0,  bonus: null },
      { id: "uc_300",  label: "300 + 25 Bonus UC", price_usd: 4.99,  price_bs: 0, bonus: "25 BONUS" },
      { id: "uc_600",  label: "600 + 60 Bonus UC", price_usd: 9.99,  price_bs: 0, bonus: "60 BONUS", popular: true },
      { id: "uc_1500", label: "1500 + 300 UC",     price_usd: 24.99, price_bs: 0, bonus: "300 BONUS" },
      { id: "uc_3000", label: "3000 + 850 UC",     price_usd: 49.99, price_bs: 0, bonus: "850 BONUS" },
    ]
  },
  {
    id: "valorant",
    name: "Valorant",
    category: "gaming",
    badge: null,
    badgeType: null,
    logo: "./assets/logos/valorant.png",
    description: "VP para Valorant",
    color: "#ff4655",
    glow: "rgba(255, 70, 85, 0.4)",
    idLabel: "Riot ID",
    idPlaceholder: "Ej: PlayerName#TAG",
    idPattern: "^.{3,20}#[a-zA-Z0-9]{3,5}$",
    idHint: "Tu Riot ID con tag. Ej: ProPlayer#LATAM",
    packages: [
      { id: "vp_475",  label: "475 VP",            price_usd: 4.99,  price_bs: 0, bonus: null },
      { id: "vp_1000", label: "1000 VP",           price_usd: 9.99,  price_bs: 0, bonus: null },
      { id: "vp_2050", label: "2050 + 50 Bonus VP",price_usd: 19.99, price_bs: 0, bonus: "50 VP", popular: true },
      { id: "vp_3650", label: "3650 + 150 Bonus VP",price_usd: 34.99, price_bs: 0, bonus: "150 VP" },
      { id: "vp_5350", label: "5350 + 350 Bonus VP",price_usd: 49.99, price_bs: 0, bonus: "350 VP" },
    ]
  },
  {
    id: "mlbb",
    name: "Mobile Legends",
    category: "gaming",
    badge: "Trending",
    badgeType: "trend",
    logo: "./assets/logos/mobile-legends.png",
    description: "Diamonds para MLBB",
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.4)",
    idLabel: "ID + Zona del Jugador",
    idPlaceholder: "Ej: 123456789 (1234)",
    idPattern: "^\\d{6,12}\\s*\\(\\d{3,6}\\)$",
    idHint: "Tu User ID y Zone ID. Ej: 123456789 (1234)",
    packages: [
      { id: "ml_56",   label: "56 Diamonds",         price_usd: 0.99,  price_bs: 0,  bonus: null },
      { id: "ml_172",  label: "172 Diamonds",         price_usd: 2.99,  price_bs: 0, bonus: null },
      { id: "ml_257",  label: "257 + 30 Diamonds",    price_usd: 4.49,  price_bs: 0, bonus: "30 BONUS" },
      { id: "ml_570",  label: "570 + 30 Diamonds",    price_usd: 9.99,  price_bs: 0, bonus: "30 BONUS", popular: true },
      { id: "ml_1135", label: "1135 + 60 Diamonds",   price_usd: 19.99, price_bs: 0, bonus: "60 BONUS" },
    ]
  },
  {
    id: "minecraft",
    name: "Minecraft",
    category: "gaming",
    badge: null,
    badgeType: null,
    logo: "./assets/logos/minecraft.png",
    description: "Minecoins para Marketplace",
    color: "#22c55e",
    glow: "rgba(34, 197, 94, 0.4)",
    idLabel: "Gamertag / Xbox Live ID",
    idPlaceholder: "Ej: MiGamertag",
    idPattern: "^[a-zA-Z0-9\\s]{1,15}$",
    idHint: "Tu Gamertag de Microsoft / Xbox Live",
    packages: [
      { id: "mc_320",  label: "320 Minecoins",  price_usd: 1.99,  price_bs: 0,  bonus: null },
      { id: "mc_830",  label: "830 Minecoins",  price_usd: 4.99,  price_bs: 0, bonus: null },
      { id: "mc_1710", label: "1710 Minecoins", price_usd: 9.99,  price_bs: 0, popular: true },
      { id: "mc_3500", label: "3500 Minecoins", price_usd: 19.99, price_bs: 0, bonus: null },
    ]
  },
  {
    id: "codm",
    name: "Call of Duty Mobile",
    category: "gaming",
    badge: "Popular",
    badgeType: "hot",
    logo: null,
    description: "CP para Call of Duty Mobile",
    color: "#b45309",
    glow: "rgba(180, 83, 9, 0.4)",
    idLabel: "Usuario de Call of Duty",
    idPlaceholder: "Ej: MiUsuarioCOD",
    idPattern: "^.{3,30}$",
    idHint: "Tu nombre de usuario o UID de COD Mobile",
    requiresPassword: true,
    passwordLabel: "Contraseña de Activision / Facebook",
    passwordPlaceholder: "Contraseña de la cuenta",
    packages: [
      { id: "cod_80",   label: "80 CP",            price_usd: 0.99,  price_bs: 0, bonus: null },
      { id: "cod_420",  label: "400 + 20 CP",      price_usd: 4.99,  price_bs: 0, bonus: "20 BONUS" },
      { id: "cod_880",  label: "800 + 80 CP",      price_usd: 9.99,  price_bs: 0, bonus: "80 BONUS", popular: true },
      { id: "cod_2400", label: "2000 + 400 CP",    price_usd: 24.99, price_bs: 0, bonus: "400 BONUS" }
    ]
  },
  {
    id: "genshin",
    name: "Genshin Impact",
    category: "gaming",
    badge: "Top",
    badgeType: "trend",
    logo: null,
    description: "Cristales Génesis para Genshin",
    color: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.4)",
    idLabel: "UID + Servidor",
    idPlaceholder: "Ej: 712345678 (America)",
    idPattern: "^\\d{9}\\s*\\([a-zA-Z\\s]{4,10}\\)$",
    idHint: "Tu UID de 9 dígitos y Servidor (America, Europe, Asia, TW/HK/MO)",
    packages: [
      { id: "gen_60",   label: "60 Cristales",        price_usd: 0.99,  price_bs: 0, bonus: null },
      { id: "gen_300",  label: "300 + 30 Cristales",   price_usd: 4.99,  price_bs: 0, bonus: "30 BONUS" },
      { id: "gen_980",  label: "980 + 110 Cristales",  price_usd: 14.99, price_bs: 0, bonus: "110 BONUS" },
      { id: "gen_1980", label: "1980 + 260 Cristales", price_usd: 29.99, price_bs: 0, bonus: "260 BONUS", popular: true }
    ]
  },
  {
    id: "bloodstrike",
    name: "Blood Strike",
    category: "gaming",
    badge: "Nuevo",
    badgeType: "new",
    logo: null,
    description: "Oro para Blood Strike",
    color: "#ef4444",
    glow: "rgba(239, 68, 68, 0.4)",
    idLabel: "ID de Blood Strike",
    idPlaceholder: "Ej: 12345678",
    idPattern: "^\\d{6,12}$",
    idHint: "Tu ID numérico de Blood Strike (6-12 dígitos)",
    packages: [
      { id: "bs_100",  label: "100 Gold",  price_usd: 0.99,  price_bs: 0, bonus: null },
      { id: "bs_500",  label: "500 Gold",  price_usd: 4.99,  price_bs: 0, bonus: null },
      { id: "bs_1000", label: "1000 Gold", price_usd: 9.99,  price_bs: 0, popular: true },
      { id: "bs_2500", label: "2500 Gold", price_usd: 24.99, price_bs: 0, bonus: null }
    ]
  }
];

function loadCatalog() {
  const stored = localStorage.getItem('tuz_catalog');
  let parsed = null;
  if (stored) {
    try {
      parsed = JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing catalog from localStorage, resetting:', e);
    }
  }
  
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
    parsed = JSON.parse(JSON.stringify(DEFAULT_SERVICES));
    localStorage.setItem('tuz_catalog', JSON.stringify(parsed));
  }
  
  // Reconstruct regex objects from pattern strings
  parsed.forEach(svc => {
    if (svc.idPattern && typeof svc.idPattern === 'string') {
      try {
        svc.idPattern = new RegExp(svc.idPattern);
      } catch (err) {
        svc.idPattern = /.*/;
      }
    }
  });
  
  return parsed;
}

function saveCatalog(catalog) {
  const serializable = JSON.parse(JSON.stringify(catalog));
  serializable.forEach((svc, idx) => {
    const original = catalog[idx];
    if (original.idPattern instanceof RegExp) {
      svc.idPattern = original.idPattern.source;
    }
  });
  localStorage.setItem('tuz_catalog', JSON.stringify(serializable));
  SERVICES = loadCatalog();
  updatePackagePricesBs();
  
  // Re-render main grid
  if (typeof renderServicesGrid === 'function') {
    renderServicesGrid();
  }
}

let SERVICES = loadCatalog();

const PAYMENT_METHODS = [
  {
    id: "pago_movil",
    name: "Pago Móvil",
    icon: "📱",
    description: "Transferencia bancaria inmediata",
    gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    glow: "rgba(16, 185, 129, 0.4)",
    details: {
      bank: "Banco de Venezuela",
      phone: "0414-1234567",
      rif: "V-12345678",
      concept: "Tu orden será confirmada en 5–15 min"
    }
  },
  {
    id: "binance",
    name: "Binance Pay",
    icon: "₿",
    description: "Pago con USDT / BNB / BUSD",
    gradient: "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)",
    glow: "rgba(245, 158, 11, 0.4)",
    details: {
      wallet: "0x742d35Cc6634C0532925a3b8D4C9F6",
      network: "BEP-20 (BSC)",
      concept: "Confirmación en 1–3 minutos"
    }
  },
  {
    id: "card",
    name: "Tarjeta de Crédito",
    icon: "💳",
    description: "Visa · Mastercard · Amex",
    gradient: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)",
    glow: "rgba(124, 58, 237, 0.4)",
    details: {
      concept: "Pago seguro con encriptación SSL"
    }
  }
];

// SVG icons inline para servicios sin imagen
const MOBILE_SVG = {
  movistar: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="38" fill="#1a1a2e" stroke="#3b82f6" stroke-width="2"/>
    <rect x="27" y="15" width="26" height="42" rx="4" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1.5"/>
    <rect x="30" y="20" width="20" height="28" rx="2" fill="#3b82f6" opacity="0.3"/>
    <circle cx="40" cy="52" r="2.5" fill="#60a5fa"/>
    <path d="M33 32 Q40 24 47 32" stroke="#60a5fa" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M29 28 Q40 16 51 28" stroke="#3b82f6" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M26 24 Q40 8 54 24" stroke="#1d4ed8" stroke-width="1" fill="none" stroke-linecap="round"/>
  </svg>`,
  digitel: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="38" fill="#1a1a2e" stroke="#8b5cf6" stroke-width="2"/>
    <rect x="27" y="15" width="26" height="42" rx="4" fill="#2d1b69" stroke="#8b5cf6" stroke-width="1.5"/>
    <rect x="30" y="20" width="20" height="28" rx="2" fill="#7c3aed" opacity="0.3"/>
    <circle cx="40" cy="52" r="2.5" fill="#a78bfa"/>
    <text x="40" y="39" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#a78bfa">4G</text>
    <path d="M33 28 Q40 22 47 28" stroke="#a78bfa" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`
};

// Inicializar precios dinámicos y datos de pago móvil
updatePackagePricesBs();
updatePagoMovilDetails();
