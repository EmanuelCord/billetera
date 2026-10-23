/**
 * MicroPay - Gift Card Gateway Module
 * Integrates Steam, Tremendous, Amazon and Digital Gift Card rails.
 * Features validation masks, balance verification, micropayment consumption,
 * and built-in demo credentials for immediate testing.
 */

const GIFT_PROVIDERS = {
  steam: {
    id: 'steam',
    name: 'Steam Wallet Card',
    icon: 'fa-brands fa-steam',
    color: '#1b2838',
    textColor: '#66c0f4',
    placeholder: 'XXXXX-XXXXX-XXXXX',
    maskRegex: /^([A-Z0-9]{5})-?([A-Z0-9]{5})-?([A-Z0-9]{5})$/i
  },
  tremendous: {
    id: 'tremendous',
    name: 'Tremendous Rewards API',
    icon: 'fa-solid fa-gift',
    color: '#0d9488',
    textColor: '#5eead4',
    placeholder: 'TRM-XXXX-XXXX-XXXX',
    maskRegex: /^TRM-?([A-Z0-9]{4})-?([A-Z0-9]{4})-?([A-Z0-9]{4})$/i
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon e-Gift Card',
    icon: 'fa-brands fa-amazon',
    color: '#ea580c',
    textColor: '#fed7aa',
    placeholder: 'AMZN-XXXX-XXXXXX',
    maskRegex: /^AMZN-?([A-Z0-9]{4})-?([A-Z0-9]{6})$/i
  },
  google_apple: {
    id: 'google_apple',
    name: 'App Store / Play Card',
    icon: 'fa-brands fa-google-play',
    color: '#6366f1',
    textColor: '#c7d2fe',
    placeholder: 'PLAY-XXXX-XXXX-XXXX',
    maskRegex: /^PLAY-?([A-Z0-9]{4})-?([A-Z0-9]{4})-?([A-Z0-9]{4})$/i
  }
};

// Built-in test codes with pre-configured values
const DEMO_GIFT_CODES = {
  'STEAM-DEMO-10': { provider: 'steam', balance: 10.00, currency: 'USD' },
  'STEAM-MICRO-01': { provider: 'steam', balance: 0.50, currency: 'USD' },
  'TREM-DEMO-25': { provider: 'tremendous', balance: 25.00, currency: 'USD' },
  'TREM-MICRO-10': { provider: 'tremendous', balance: 0.10, currency: 'USD' },
  'AMZN-DEMO-05': { provider: 'amazon', balance: 5.00, currency: 'USD' },
  'PLAY-DEMO-02': { provider: 'google_apple', balance: 2.00, currency: 'USD' }
};

class GiftCardGateway {
  constructor() {
    this.redeemedCodes = new Set();
  }

  // Format code on typing (auto uppercase and clean symbols)
  formatInputCode(value) {
    return value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  }

  // Verify code with simulated Gateway API
  async verifyCode(providerId, rawCode) {
    const code = this.formatInputCode(rawCode);

    // Simulate API roundtrip latency (400 - 800ms)
    await new Promise(resolve => setTimeout(resolve, 600));

    if (this.redeemedCodes.has(code)) {
      throw new Error('Este código de tarjeta ya ha sido canjeado anteriormente.');
    }

    // Check predefined demo codes
    if (DEMO_GIFT_CODES[code]) {
      const info = DEMO_GIFT_CODES[code];
      return {
        valid: true,
        code,
        provider: info.provider,
        providerName: GIFT_PROVIDERS[info.provider]?.name || 'Gift Card',
        availableBalance: info.balance,
        currency: info.currency
      };
    }

    // Generic fallback validation: if length >= 8 characters, accept as valid test code
    if (code.replace(/-/g, '').length >= 8) {
      // Deterministic balance based on string hash for testing
      const balance = 5.00;
      return {
        valid: true,
        code,
        provider: providerId,
        providerName: GIFT_PROVIDERS[providerId]?.name || 'Gift Card',
        availableBalance: balance,
        currency: 'USD'
      };
    }

    throw new Error('Código inválido. Verifica el formato o prueba uno de los códigos de prueba sugeridos.');
  }

  // Process redemption into Ledger
  async redeemCode(providerId, code, amountToRedeem) {
    const cardInfo = await this.verifyCode(providerId, code);

    if (amountToRedeem > cardInfo.availableBalance) {
      throw new Error(`Saldo insuficiente en la tarjeta ($${cardInfo.availableBalance.toFixed(2)} USD disponibles).`);
    }

    // Mark as redeemed in session
    this.redeemedCodes.add(code);

    // Record in ledger
    const addedTx = window.ledgerStore.addTransaction({
      rail: 'giftcard',
      railLabel: cardInfo.providerName,
      amount: amountToRedeem,
      fee: 0.00, // Gift cards incur 0 network fee for recipient
      savedFee: 0.35, // vs traditional card fee
      status: 'confirmed',
      reference: code,
      memo: `Canje Gift Card ${cardInfo.providerName} (${code.slice(0, 4)}...${code.slice(-4)})`,
      customer: `GiftCard Gateway User`
    });

    return {
      success: true,
      cardInfo,
      redeemedAmount: amountToRedeem,
      remainingBalance: cardInfo.availableBalance - amountToRedeem,
      tx: addedTx
    };
  }
}

window.giftCardGateway = new GiftCardGateway();
window.GIFT_PROVIDERS = GIFT_PROVIDERS;
window.DEMO_GIFT_CODES = DEMO_GIFT_CODES;
