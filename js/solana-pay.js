/**
 * MicroPay - Solana Pay Module
 * Spec compliant with Solana Pay standards:
 * - solana:<recipient>?amount=<amt>&spl-token=<mint>&reference=<ref>&label=<lbl>&message=<msg>
 * - Native Base58 encoder for Solana Public Key reference generation
 * - Phantom & Solflare browser wallet detection & simulation hooks
 */

// Base58 characters used by Solana
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(buffer) {
  const digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    for (let j = 0; j < digits.length; j++) digits[j] <<= 8;
    digits[0] += buffer[i];
    let carry = 0;
    for (let j = 0; j < digits.length; j++) {
      digits[j] += carry;
      carry = (digits[j] / 58) | 0;
      digits[j] %= 58;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    digits.push(0);
  }
  return digits.reverse().map(d => BASE58_ALPHABET[d]).join('');
}

// Generate a cryptographically valid 32-byte Solana reference public key
function generateSolanaReferenceKey() {
  const randomBytes = new Uint8Array(32);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 32; i++) randomBytes[i] = Math.floor(Math.random() * 256);
  }
  return encodeBase58(randomBytes);
}

class SolanaPayManager {
  constructor() {
    this.currentOrder = null;
    this.isMonitoring = false;
    this.pollInterval = null;
  }

  createOrder(amount, options = {}) {
    const settings = window.ledgerStore ? window.ledgerStore.settings : {};
    const merchantWallet = options.recipient || settings.merchantWallet || 'D53pBLGzm3xis5msdwJcgTz2duTwAGXvKiCdFHSMpreS';
    const usdcMint = options.splToken || settings.usdcMint || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const label = encodeURIComponent(options.label || settings.merchantName || 'MicroPay Gateway');
    const message = encodeURIComponent(options.message || `Micropago de $${amount.toFixed(2)} USD`);
    
    // Generate unique 32-byte Base58 reference key
    const reference = generateSolanaReferenceKey();

    // Construct standard Solana Pay URL
    let url = `solana:${merchantWallet}?amount=${amount.toFixed(2)}`;
    
    // If token is USDC (default) include spl-token
    if (options.tokenType !== 'SOL') {
      url += `&spl-token=${usdcMint}`;
    }
    url += `&reference=${reference}&label=${label}&message=${message}`;

    this.currentOrder = {
      amount,
      reference,
      merchantWallet,
      tokenType: options.tokenType || 'USDC',
      url,
      timestamp: Date.now(),
      status: 'pending'
    };

    return this.currentOrder;
  }

  renderQR(canvasId, url) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
      QRCode.toCanvas(canvas, url, {
        width: 190,
        margin: 1,
        color: {
          dark: '#020617',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) {
          console.error('[SolanaPay] Error rendering QR code:', error);
          this.renderFallbackQR(canvas, url);
        }
      });
    } else {
      this.renderFallbackQR(canvas, url);
    }
  }

  renderFallbackQR(canvas, url) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = 190;
      canvas.height = 190;
      ctx.drawImage(img, 0, 0, 190, 190);
    };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=190x190&data=${encodeURIComponent(url)}&color=020617&bgcolor=ffffff`;
  }

  hasWalletExtension() {
    return typeof window.solana !== 'undefined' && (window.solana.isPhantom || window.solana.isSolflare);
  }

  async connectWallet() {
    if (!this.hasWalletExtension()) {
      window.open('https://phantom.app/', '_blank');
      throw new Error('No se detectó billetera Solana (Phantom/Solflare)');
    }
    try {
      const resp = await window.solana.connect();
      return resp.publicKey.toString();
    } catch (err) {
      console.warn('Usuario canceló conexión con wallet:', err);
      throw err;
    }
  }

  simulateLivePayment(onStepProgress, onCompleted) {
    if (!this.currentOrder) return;
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Step 1: Wallet scanned QR
    if (onStepProgress) onStepProgress(1, 'Código QR escaneado por billetera externa...');

    setTimeout(() => {
      // Step 2: Transaction detected in Solana Mempool
      if (onStepProgress) onStepProgress(2, 'Transacción detectada en Solana Mempool...');

      setTimeout(() => {
        // Step 3: Block finalized & confirmed
        if (onStepProgress) onStepProgress(3, 'Bloque confirmado (Finalized). ¡Saldo acreditado!');
        this.isMonitoring = false;
        this.currentOrder.status = 'confirmed';

        const addedTx = window.ledgerStore.addTransaction({
          rail: 'solana',
          railLabel: `Solana Pay (${this.currentOrder.tokenType})`,
          amount: this.currentOrder.amount,
          fee: 0.00025,
          savedFee: 0.30,
          status: 'confirmed',
          reference: this.currentOrder.reference,
          memo: `Micropago de $${this.currentOrder.amount.toFixed(2)} USD vía Solana Pay`,
          customer: `Solana Wallet (${this.currentOrder.reference.slice(0, 4)}...${this.currentOrder.reference.slice(-4)})`
        });

        if (onCompleted) onCompleted(addedTx);
      }, 1400);
    }, 1200);
  }
}

window.solanaPayManager = new SolanaPayManager();
