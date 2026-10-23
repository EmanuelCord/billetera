/**
 * MicroPay - Main Application Coordinator
 * Handles Navigation, PWA Installation, UI States, Card Flip, and Modals.
 */

// Global State
let currentAmount = 0.10;
let activeMethod = 'solana'; // 'solana' or 'card'
let activeTab = 'checkout';  // 'checkout', 'giftcards', 'ledger', 'settings'
let selectedProvider = 'steam';
let activeFilter = 'all';
let deferredInstallPrompt = null;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initPWA();
  initLedgerSubscription();
  initSettingsForm();
  initAmountButtons();
  selectGiftProvider('steam');
  renderCurrentOrder();
  setupCardVisualListeners();

  // Listen to hash changes for direct routing (#checkout, #giftcard, #ledger, #settings)
  window.addEventListener('hashchange', handleHashRouting);
  if (window.location.hash) {
    handleHashRouting();
  }
});

// PWA Install Prompt Listener
function initPWA() {
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[PWA] Service Worker registrado con éxito:', reg.scope))
      .catch(err => console.warn('[PWA] Error registrando Service Worker:', err));
  }

  // Capture install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const installBtn = document.getElementById('pwaInstallBtn');
    const installBanner = document.getElementById('pwaBanner');
    if (installBtn) installBtn.classList.remove('hidden');
    if (installBanner) installBanner.classList.remove('hidden');
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Aplicación instalada');
    deferredInstallPrompt = null;
    const installBtn = document.getElementById('pwaInstallBtn');
    const installBanner = document.getElementById('pwaBanner');
    if (installBtn) installBtn.classList.add('hidden');
    if (installBanner) installBanner.classList.add('hidden');
    showToast('¡MicroPay instalado como aplicación en tu pantalla de inicio!', 'success');
  });
}

function promptPWAInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] Usuario aceptó instalar');
      }
      deferredInstallPrompt = null;
      const installBtn = document.getElementById('pwaInstallBtn');
      const installBanner = document.getElementById('pwaBanner');
      if (installBtn) installBtn.classList.add('hidden');
      if (installBanner) installBanner.classList.add('hidden');
    });
  } else {
    showToast('Para instalar: usa el menú de tu navegador y selecciona "Instalar app" o "Agregar a inicio"', 'info');
  }
}

// Theme handling
function initTheme() {
  const savedTheme = localStorage.getItem('micropay_theme') || 'dark';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('micropay_theme', newTheme);
}

function applyTheme(theme) {
  const html = document.documentElement;
  const icon = document.getElementById('themeIcon');
  if (theme === 'dark') {
    html.classList.add('dark');
    html.classList.remove('light');
    if (icon) icon.className = 'fa-solid fa-moon text-amber-400';
  } else {
    html.classList.remove('dark');
    html.classList.add('light');
    if (icon) icon.className = 'fa-solid fa-sun text-amber-500';
  }
}

// Navigation Tabs
function switchTab(tabId) {
  activeTab = tabId;
  const tabs = ['checkout', 'giftcards', 'ledger', 'settings'];

  tabs.forEach(t => {
    const section = document.getElementById(`section-${t}`);
    const navBtn = document.getElementById(`nav-${t}`);
    const bottomNavBtn = document.getElementById(`bottom-nav-${t}`);

    if (t === tabId) {
      if (section) section.classList.remove('hidden');
      if (navBtn) {
        navBtn.classList.add('bg-slate-800', 'text-emerald-400', 'border-emerald-500/30');
        navBtn.classList.remove('text-slate-400');
      }
      if (bottomNavBtn) {
        bottomNavBtn.classList.add('text-emerald-400', 'border-t-2', 'border-emerald-400');
        bottomNavBtn.classList.remove('text-slate-400');
      }
    } else {
      if (section) section.classList.add('hidden');
      if (navBtn) {
        navBtn.classList.remove('bg-slate-800', 'text-emerald-400', 'border-emerald-500/30');
        navBtn.classList.add('text-slate-400');
      }
      if (bottomNavBtn) {
        bottomNavBtn.classList.remove('text-emerald-400', 'border-t-2', 'border-emerald-400');
        bottomNavBtn.classList.add('text-slate-400');
      }
    }
  });

  if (tabId === 'ledger') {
    renderLedger();
  } else if (tabId === 'checkout') {
    renderCurrentOrder();
  }
}

function handleHashRouting() {
  const hash = window.location.hash.replace('#', '');
  if (['checkout', 'giftcard', 'giftcards', 'ledger', 'settings'].includes(hash)) {
    const target = hash === 'giftcard' ? 'giftcards' : hash;
    switchTab(target);
  }
}

// Quick Amounts Selection
function initAmountButtons() {
  const customInput = document.getElementById('customAmount');
  if (customInput) {
    customInput.value = currentAmount.toFixed(2);
  }
}

function selectQuickAmount(val) {
  currentAmount = parseFloat(val);
  const customInput = document.getElementById('customAmount');
  if (customInput) customInput.value = currentAmount.toFixed(2);

  document.querySelectorAll('.quick-btn').forEach(btn => {
    if (parseFloat(btn.getAttribute('data-val')) === val) {
      btn.classList.add('border-emerald-500', 'bg-emerald-500/10', 'text-emerald-400');
      btn.classList.remove('border-slate-800', 'text-slate-300');
    } else {
      btn.classList.remove('border-emerald-500', 'bg-emerald-500/10', 'text-emerald-400');
      btn.classList.add('border-slate-800', 'text-slate-300');
    }
  });

  renderCurrentOrder();
}

function handleAmountInput() {
  const input = document.getElementById('customAmount');
  let val = parseFloat(input.value);
  if (isNaN(val) || val < 0.10) {
    currentAmount = 0.10;
  } else {
    currentAmount = val;
  }

  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.classList.remove('border-emerald-500', 'bg-emerald-500/10', 'text-emerald-400');
  });

  renderCurrentOrder();
}

// Payment method tab switch (Solana vs Card)
function switchMethod(method) {
  activeMethod = method;
  const tabSolana = document.getElementById('tabSolana');
  const tabCard = document.getElementById('tabCard');
  const viewSolana = document.getElementById('solanaPaymentView');
  const viewCard = document.getElementById('cardPaymentView');

  if (method === 'solana') {
    viewSolana.classList.remove('hidden');
    viewCard.classList.add('hidden');
    tabSolana.className = "flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition bg-slate-800 text-purple-400 shadow border border-purple-500/20";
    tabCard.className = "flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition text-slate-400 hover:text-white";
    renderCurrentOrder();
  } else {
    viewSolana.classList.add('hidden');
    viewCard.classList.remove('hidden');
    tabCard.className = "flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition bg-slate-800 text-emerald-400 shadow border border-emerald-500/20";
    tabSolana.className = "flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition text-slate-400 hover:text-white";
  }
}

// Solana Pay dynamic QR & deep link
function renderCurrentOrder() {
  if (window.solanaPayManager) {
    const settings = window.ledgerStore.settings;
    const order = window.solanaPayManager.createOrder(currentAmount, {
      tokenType: settings.currency || 'USDC',
      label: settings.merchantName,
      message: `Micropago de $${currentAmount.toFixed(2)} USD`
    });

    const deepLink = document.getElementById('solanaDeepLink');
    if (deepLink) deepLink.href = order.url;

    const refLabel = document.getElementById('solanaRefKey');
    if (refLabel) {
      refLabel.innerText = `${order.reference.slice(0, 8)}...${order.reference.slice(-8)}`;
      refLabel.title = order.reference;
    }

    const amtLabel = document.getElementById('solanaAmountLabel');
    if (amtLabel) amtLabel.innerText = `$${currentAmount.toFixed(2)} ${settings.currency} (Solana Network)`;

    const cardPayBtnText = document.getElementById('cardPayBtnText');
    if (cardPayBtnText) cardPayBtnText.innerText = `Pagar $${currentAmount.toFixed(2)} USD Ahora`;

    // Render Canvas QR
    window.solanaPayManager.renderQR('solanaQrCode', order.url);
  }
}

// Copy Reference Key to Clipboard
function copyReferenceKey() {
  if (!window.solanaPayManager.currentOrder) return;
  const ref = window.solanaPayManager.currentOrder.reference;
  navigator.clipboard.writeText(ref).then(() => {
    showToast('Referencia Solana copiada al portapapeles', 'success');
  });
}

// Simulate Solana Pay scan & confirmation
function triggerSolanaSimulation() {
  const btn = document.getElementById('solanaSimulateBtn');
  const statusContainer = document.getElementById('solanaStatusStep');
  if (btn) btn.disabled = true;

  if (statusContainer) {
    statusContainer.classList.remove('hidden');
    statusContainer.innerText = 'Buscando transacción en Solana...';
  }

  window.solanaPayManager.simulateLivePayment(
    (step, message) => {
      if (statusContainer) {
        statusContainer.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-purple-400 mr-2"></i> ${message}`;
      }
    },
    (confirmedTx) => {
      if (statusContainer) {
        statusContainer.innerHTML = `<span class="text-emerald-400 font-bold"><i class="fa-solid fa-check mr-1"></i> ¡Confirmado en Blockchain!</span>`;
      }
      if (btn) btn.disabled = false;
      showReceiptModal(confirmedTx);
      // Re-generate next order reference
      renderCurrentOrder();
    }
  );
}

// Connect Direct Phantom Wallet
async function handleConnectSolanaWallet() {
  try {
    const pubKey = await window.solanaPayManager.connectWallet();
    showToast(`Billetera conectada: ${pubKey.slice(0, 4)}...${pubKey.slice(-4)}`, 'success');
    triggerSolanaSimulation();
  } catch (err) {
    showToast(err.message || 'No se pudo conectar con Phantom', 'error');
  }
}

// Interactive Credit Card
function setupCardVisualListeners() {
  const numInput = document.getElementById('cardNumber');
  const nameInput = document.getElementById('cardName');
  const expInput = document.getElementById('cardExp');
  const cvvInput = document.getElementById('cardCvv');

  if (numInput) {
    numInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      e.target.value = val.replace(/(.{4})/g, '$1 ').trim();
      updateCardVisual();
    });
  }

  if (expInput) {
    expInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 3) {
        e.target.value = val.substring(0, 2) + '/' + val.substring(2);
      } else {
        e.target.value = val;
      }
      updateCardVisual();
    });
  }

  if (nameInput) nameInput.addEventListener('input', updateCardVisual);
  if (cvvInput) cvvInput.addEventListener('input', updateCardVisual);
}

function updateCardVisual() {
  const num = document.getElementById('cardNumber')?.value || '•••• •••• •••• ••••';
  const name = document.getElementById('cardName')?.value || 'NOMBRE Y APELLIDO';
  const exp = document.getElementById('cardExp')?.value || 'MM/AA';
  const cvv = document.getElementById('cardCvv')?.value || '•••';

  const dispNum = document.getElementById('cardDisplayNumber');
  const dispName = document.getElementById('cardDisplayName');
  const dispExp = document.getElementById('cardDisplayExp');
  const dispCvv = document.getElementById('cardDisplayCvv');

  if (dispNum) dispNum.innerText = num || '•••• •••• •••• ••••';
  if (dispName) dispName.innerText = name || 'NOMBRE Y APELLIDO';
  if (dispExp) dispExp.innerText = exp || 'MM/AA';
  if (dispCvv) dispCvv.innerText = cvv || '•••';

  // Card brand detection
  const logo = document.getElementById('cardBrandLogo');
  if (logo) {
    const raw = num.replace(/\s/g, '');
    if (raw.startsWith('4')) {
      logo.innerHTML = '<i class="fa-brands fa-cc-visa text-2xl text-blue-400"></i>';
    } else if (/^5[1-5]/.test(raw)) {
      logo.innerHTML = '<i class="fa-brands fa-cc-mastercard text-2xl text-orange-400"></i>';
    } else if (/^3[47]/.test(raw)) {
      logo.innerHTML = '<i class="fa-brands fa-cc-amex text-2xl text-cyan-400"></i>';
    } else {
      logo.innerHTML = '<i class="fa-solid fa-credit-card text-2xl text-slate-400"></i>';
    }
  }
}

function flipCard(forceBack) {
  const card = document.getElementById('visualCard');
  if (!card) return;
  if (forceBack !== undefined) {
    if (forceBack) card.classList.add('rotate-y-180');
    else card.classList.remove('rotate-y-180');
  } else {
    card.classList.toggle('rotate-y-180');
  }
}

// Process Card Payment
function processCardPayment() {
  const btn = document.getElementById('payCardBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Procesando micropago seguro...`;
  btn.disabled = true;

  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.disabled = false;

    const num = (document.getElementById('cardNumber')?.value || '').replace(/\s/g, '');
    const last4 = num.length >= 4 ? num.slice(-4) : '4242';

    const tx = window.ledgerStore.addTransaction({
      rail: 'card',
      railLabel: `Tarjeta Crédito/Débito (*${last4})`,
      amount: currentAmount,
      fee: currentAmount * 0.029 + 0.30, // Traditional processor standard fee
      savedFee: 0.00,
      status: 'confirmed',
      reference: 'auth_' + Math.random().toString(36).substring(2, 12),
      memo: `Cobro de micropago con tarjeta de débito/crédito`,
      customer: document.getElementById('cardName')?.value || 'Titular Tarjeta'
    });

    showReceiptModal(tx);
  }, 1000);
}

// Gift Card Flow
function selectGiftProvider(providerId) {
  selectedProvider = providerId;
  const provider = window.GIFT_PROVIDERS[providerId];
  if (!provider) return;

  document.querySelectorAll('.gift-provider-btn').forEach(btn => {
    if (btn.getAttribute('data-provider') === providerId) {
      btn.classList.add('border-emerald-500', 'bg-emerald-500/10', 'text-white');
      btn.classList.remove('border-slate-800', 'text-slate-400');
    } else {
      btn.classList.remove('border-emerald-500', 'bg-emerald-500/10', 'text-white');
      btn.classList.add('border-slate-800', 'text-slate-400');
    }
  });

  const input = document.getElementById('giftCardCodeInput');
  if (input) {
    input.placeholder = provider.placeholder;
  }
}

function fillDemoGiftCode(code, providerId) {
  selectGiftProvider(providerId);
  const input = document.getElementById('giftCardCodeInput');
  if (input) {
    input.value = code;
    input.focus();
  }
  showToast(`Código de prueba cargado: ${code}`, 'info');
}

async function handleGiftCardRedeem() {
  const input = document.getElementById('giftCardCodeInput');
  const code = (input?.value || '').trim();
  const btn = document.getElementById('giftRedeemBtn');

  if (!code) {
    showToast('Por favor introduce un código de tarjeta de regalo', 'warning');
    return;
  }

  const originalContent = btn.innerHTML;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Verificando con Gateway API...`;
  btn.disabled = true;

  try {
    // Check card details
    const cardInfo = await window.giftCardGateway.verifyCode(selectedProvider, code);

    // Consume full balance or custom amount
    const result = await window.giftCardGateway.redeemCode(selectedProvider, code, cardInfo.availableBalance);

    btn.innerHTML = originalContent;
    btn.disabled = false;
    input.value = '';

    showToast(`¡Código validado! Se han acreditado +$${result.redeemedAmount.toFixed(2)} USD`, 'success');
    showReceiptModal(result.tx);
  } catch (err) {
    btn.innerHTML = originalContent;
    btn.disabled = false;
    showToast(err.message || 'Error validando código de tarjeta', 'error');
  }
}

// Ledger Subscription & Rendering
function initLedgerSubscription() {
  if (window.ledgerStore) {
    window.ledgerStore.subscribe(() => {
      updateTopLedgerDisplay();
      if (activeTab === 'ledger') renderLedger();
    });
  }
}

function updateTopLedgerDisplay() {
  const totals = window.ledgerStore.getTotals();
  const merchantBalance = document.getElementById('merchantBalance');
  if (merchantBalance) {
    merchantBalance.innerText = `$${totals.total.toFixed(2)} USD`;
  }
}

function filterLedger(filter) {
  activeFilter = filter;
  document.querySelectorAll('.ledger-filter-btn').forEach(btn => {
    if (btn.getAttribute('data-filter') === filter) {
      btn.classList.add('bg-emerald-500/10', 'border-emerald-500', 'text-emerald-400');
      btn.classList.remove('border-slate-800', 'text-slate-400');
    } else {
      btn.classList.remove('bg-emerald-500/10', 'border-emerald-500', 'text-emerald-400');
      btn.classList.add('border-slate-800', 'text-slate-400');
    }
  });
  renderLedger();
}

function renderLedger() {
  const totals = window.ledgerStore.getTotals();

  // Metrics cards
  const elTotal = document.getElementById('ledgerTotalAmount');
  const elSolana = document.getElementById('ledgerSolanaAmount');
  const elGift = document.getElementById('ledgerGiftAmount');
  const elCard = document.getElementById('ledgerCardAmount');
  const elSaved = document.getElementById('ledgerSavedFees');
  const elTxCount = document.getElementById('ledgerTxCount');

  if (elTotal) elTotal.innerText = `$${totals.total.toFixed(2)}`;
  if (elSolana) elSolana.innerText = `$${totals.solanaTotal.toFixed(2)}`;
  if (elGift) elGift.innerText = `$${totals.giftTotal.toFixed(2)}`;
  if (elCard) elCard.innerText = `$${totals.cardTotal.toFixed(2)}`;
  if (elSaved) elSaved.innerText = `$${totals.feesSaved.toFixed(2)}`;
  if (elTxCount) elTxCount.innerText = totals.txCount;

  // Transaction Table
  const tableBody = document.getElementById('ledgerTableBody');
  if (!tableBody) return;

  const allTx = window.ledgerStore.data.transactions;
  const filtered = allTx.filter(t => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'solana') return t.rail === 'solana';
    if (activeFilter === 'giftcard') return t.rail === 'giftcard';
    if (activeFilter === 'card') return t.rail === 'card';
    return true;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-slate-500 text-xs">
          No hay transacciones registradas para este filtro.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(tx => {
    const dateStr = new Date(tx.timestamp).toLocaleString('es-ES', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let badgeClass = 'bg-slate-800 text-slate-300';
    let iconClass = 'fa-solid fa-receipt';
    if (tx.rail === 'solana') {
      badgeClass = 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      iconClass = 'fa-brands fa-ethereum text-purple-400';
    } else if (tx.rail === 'giftcard') {
      badgeClass = 'bg-teal-500/10 text-teal-400 border border-teal-500/30';
      iconClass = 'fa-solid fa-gift text-teal-400';
    } else if (tx.rail === 'card') {
      badgeClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      iconClass = 'fa-solid fa-credit-card text-blue-400';
    }

    return `
      <tr class="border-b border-slate-800/60 hover:bg-slate-800/30 transition text-xs">
        <td class="py-3 px-3">
          <div class="flex items-center space-x-2">
            <span class="p-1.5 rounded-lg ${badgeClass}">
              <i class="${iconClass}"></i>
            </span>
            <div>
              <div class="font-semibold text-white">${tx.railLabel}</div>
              <div class="text-[10px] text-slate-500">${dateStr}</div>
            </div>
          </div>
        </td>
        <td class="py-3 px-3 font-mono text-slate-400 hidden sm:table-cell">
          <span class="truncate block max-w-[120px]" title="${tx.reference}">${tx.reference}</span>
        </td>
        <td class="py-3 px-3 font-mono font-bold text-emerald-400 text-right">
          +$${tx.amount.toFixed(2)}
        </td>
        <td class="py-3 px-3 font-mono text-[11px] text-slate-400 text-right hidden sm:table-cell">
          $${tx.fee.toFixed(5)}
        </td>
        <td class="py-3 px-3 text-right">
          <button onclick="viewReceipt('${tx.id}')">
            <i class="fa-solid fa-file-invoice text-slate-400 hover:text-emerald-400 transition p-1.5 rounded-lg bg-slate-900 border border-slate-800"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Receipt Modal Handling
function showReceiptModal(tx) {
  const modal = document.getElementById('receiptModal');
  if (!modal) return;

  const dateStr = new Date(tx.timestamp).toLocaleString('es-ES');
  document.getElementById('receiptAmount').innerText = `$${tx.amount.toFixed(2)} USD`;
  document.getElementById('receiptMethod').innerText = tx.railLabel;
  document.getElementById('receiptTxId').innerText = tx.id;
  document.getElementById('receiptTxId').title = tx.reference;
  document.getElementById('receiptDate').innerText = dateStr;
  document.getElementById('receiptFee').innerText = `$${tx.fee.toFixed(6)} USD`;
  document.getElementById('receiptMemo').innerText = tx.memo || 'Micropago acreditado';

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function viewReceipt(txId) {
  const tx = window.ledgerStore.data.transactions.find(t => t.id === txId);
  if (tx) showReceiptModal(tx);
}

function closeModal() {
  const modal = document.getElementById('receiptModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// Settings form
function initSettingsForm() {
  const settings = window.ledgerStore.settings;
  const nameInput = document.getElementById('settingsMerchantName');
  const walletInput = document.getElementById('settingsMerchantWallet');
  const networkSelect = document.getElementById('settingsNetwork');
  const currencySelect = document.getElementById('settingsCurrency');

  if (nameInput) nameInput.value = settings.merchantName;
  if (walletInput) walletInput.value = settings.merchantWallet;
  if (networkSelect) networkSelect.value = settings.network;
  if (currencySelect) currencySelect.value = settings.currency;
}

function saveMerchantSettings() {
  const newSettings = {
    merchantName: document.getElementById('settingsMerchantName')?.value || 'Mi Comercio',
    merchantWallet: document.getElementById('settingsMerchantWallet')?.value || 'D53pBLGzm3xis5msdwJcgTz2duTwAGXvKiCdFHSMpreS',
    network: document.getElementById('settingsNetwork')?.value || 'mainnet-beta',
    currency: document.getElementById('settingsCurrency')?.value || 'USDC'
  };

  window.ledgerStore.saveSettings(newSettings);
  renderCurrentOrder();
  showToast('¡Ajustes guardados correctamente!', 'success');
  switchTab('checkout');
}

// Toast notification helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  let bg = 'bg-slate-900 border-slate-700 text-slate-100';
  let icon = 'fa-info-circle text-cyan-400';

  if (type === 'success') {
    bg = 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200';
    icon = 'fa-circle-check text-emerald-400';
  } else if (type === 'error') {
    bg = 'bg-rose-950/90 border-rose-500/40 text-rose-200';
    icon = 'fa-circle-xmark text-rose-400';
  } else if (type === 'warning') {
    bg = 'bg-amber-950/90 border-amber-500/40 text-amber-200';
    icon = 'fa-triangle-exclamation text-amber-400';
  }

  toast.className = `fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-medium transition-all duration-300 opacity-0 translate-y-2 ${bg}`;
  toast.innerHTML = `<i class="fa-solid ${icon} text-base"></i><span>${message}</span>`;
  document.body.appendChild(toast);

  // Fade in
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
  });

  // Fade out and remove
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      if (document.body.contains(toast)) document.body.removeChild(toast);
    }, 300);
  }, 3200);
}
