/**
 * MicroPay - Ledger & State Management
 * Handles persistent balance, transaction logs, statistics and fee savings calculations.
 */

const STORAGE_KEY = 'micropay_ledger_v2';
const SETTINGS_KEY = 'micropay_settings_v2';

// Default initial demo state
const DEFAULT_LEDGER_DATA = {
  transactions: [
    {
      id: 'tx_sol_8f29ab',
      timestamp: Date.now() - 3600000 * 2,
      rail: 'solana',
      railLabel: 'Solana Pay (USDC)',
      amount: 0.10,
      fee: 0.00025,
      savedFee: 0.30,
      status: 'confirmed',
      reference: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      memo: 'Pago micropago artículo digital',
      customer: 'Phantom Wallet (*82b1)'
    },
    {
      id: 'tx_card_19cf82',
      timestamp: Date.now() - 3600000 * 5,
      rail: 'card',
      railLabel: 'Tarjeta Visa (*4242)',
      amount: 0.50,
      fee: 0.31,
      savedFee: 0.00,
      status: 'confirmed',
      reference: 'auth_928173491823',
      memo: 'Cobro con tarjeta MicroPay',
      customer: 'Carlos Gomez'
    },
    {
      id: 'tx_gift_77ad90',
      timestamp: Date.now() - 3600000 * 12,
      rail: 'giftcard',
      railLabel: 'Steam Gift Card',
      amount: 5.00,
      fee: 0.00,
      savedFee: 0.45,
      status: 'confirmed',
      reference: 'STEAM-DEMO-VAL5',
      memo: 'Canje de saldo Steam Gateway',
      customer: 'Steam User (*9921)'
    },
    {
      id: 'tx_sol_110aef',
      timestamp: Date.now() - 3600000 * 24,
      rail: 'solana',
      railLabel: 'Solana Pay (USDC)',
      amount: 0.10,
      fee: 0.00025,
      savedFee: 0.30,
      status: 'confirmed',
      reference: '3kX2aZc9v8b7n6m5l4k3j2h1g9f8e7d6c5b4a3z2y1x0',
      memo: 'Acceso API por consulta micro',
      customer: 'Solflare (*c014)'
    }
  ]
};

// Default merchant settings
const DEFAULT_SETTINGS = {
  merchantName: 'Mi Tienda de Micropagos',
  merchantWallet: 'D53pBLGzm3xis5msdwJcgTz2duTwAGXvKiCdFHSMpreS', // From project spec
  usdcMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',       // Solana Mainnet USDC
  network: 'mainnet-beta', // 'mainnet-beta' or 'devnet'
  currency: 'USDC',
  defaultMemo: 'Pago de micropago por contenido o servicio'
};

class LedgerStore {
  constructor() {
    this.data = this.loadLedger();
    this.settings = this.loadSettings();
    this.listeners = [];
  }

  loadLedger() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading ledger from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_LEDGER_DATA));
  }

  saveLedger() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Error saving ledger:', e);
    }
    this.notify();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Error reading settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    listener(this);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l(this));
  }

  addTransaction(tx) {
    const fullTx = {
      id: tx.id || 'tx_' + Math.random().toString(36).substring(2, 9),
      timestamp: tx.timestamp || Date.now(),
      rail: tx.rail || 'solana',
      railLabel: tx.railLabel || 'Solana Pay',
      amount: parseFloat(tx.amount) || 0.10,
      fee: tx.fee !== undefined ? tx.fee : (tx.rail === 'solana' ? 0.00025 : 0.00),
      savedFee: tx.savedFee !== undefined ? tx.savedFee : (tx.rail === 'solana' ? 0.30 : 0.00),
      status: tx.status || 'confirmed',
      reference: tx.reference || 'ref_' + Math.random().toString(36).substring(2, 10),
      memo: tx.memo || this.settings.defaultMemo,
      customer: tx.customer || 'Cliente Web'
    };

    this.data.transactions.unshift(fullTx);
    this.saveLedger();
    return fullTx;
  }

  getTotals() {
    let total = 0;
    let solanaTotal = 0;
    let giftTotal = 0;
    let cardTotal = 0;
    let feesSaved = 0;
    let feesPaid = 0;

    for (const tx of this.data.transactions) {
      if (tx.status === 'confirmed') {
        const amt = parseFloat(tx.amount) || 0;
        total += amt;
        if (tx.rail === 'solana') {
          solanaTotal += amt;
          feesSaved += (tx.savedFee || 0.30);
          feesPaid += (tx.fee || 0.00025);
        } else if (tx.rail === 'giftcard') {
          giftTotal += amt;
          feesSaved += (tx.savedFee || 0.20);
        } else if (tx.rail === 'card') {
          cardTotal += amt;
          feesPaid += (tx.fee || (amt * 0.029 + 0.30));
        }
      }
    }

    return {
      total,
      solanaTotal,
      giftTotal,
      cardTotal,
      feesSaved,
      feesPaid,
      txCount: this.data.transactions.length
    };
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_LEDGER_DATA));
    this.saveLedger();
  }

  clearAll() {
    this.data = { transactions: [] };
    this.saveLedger();
  }

  exportCSV() {
    const headers = ['ID', 'Fecha', 'Metodo', 'Monto USD', 'Comision Red', 'Ahorro Comision', 'Referencia', 'Detalle'];
    const rows = this.data.transactions.map(t => [
      t.id,
      new Date(t.timestamp).toISOString(),
      `"${t.railLabel}"`,
      t.amount.toFixed(2),
      t.fee.toFixed(6),
      t.savedFee.toFixed(2),
      `"${t.reference}"`,
      `"${t.memo}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `micropay-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Global singleton instance
window.ledgerStore = new LedgerStore();
