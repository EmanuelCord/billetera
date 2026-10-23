import { encodeURL, createQR } from '@solana-commerce/solana-pay';
import { address, generateKeyPairSigner } from '@solana/kit';

// 1. Configurar datos del comercio y token (USDC en Solana)
const merchantWallet = address('D53pBLGzm3xis5msdwJcgTz2duTwAGXvKiCdFHSMpreS');
const usdcMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC Mainnet

// 2. Generar una referencia única para rastrear esta orden de $0.10 USD
const orderReference = (await generateKeyPairSigner()).address;

// 3. Construir la URL de Solana Pay
const url = encodeURL({
  recipient: merchantWallet,
  amount: 0.10, // $0.10 USD en USDC (6 decimales)
  splToken: usdcMint,
  reference: [orderReference],
  label: 'Mi App de Micropagos',
  message: 'Pago de micropago por contenido o servicio ($0.10)'
});