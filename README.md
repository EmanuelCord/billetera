# MicroPay Gateway & Billetera PWA (v2.5)

Aplicación Web Progresiva (PWA) de micropagos instantáneos desde **$0.10 USD** con rieles de **Solana Pay (USDC / SOL)**, **Gift Cards (Steam, Tremendous, Amazon)** y **Tarjeta de Débito/Crédito**.

---

## 🌟 Características Principales

1. **Riel Solana Pay (USDC / SOL)**:
   - Cumple el estándar oficial de Solana Pay (`solana:<merchantWallet>?amount=0.10&spl-token=...&reference=...`).
   - Generación de claves de referencia criptográficas únicas de 32 bytes en Base58 (`generateSolanaReferenceKey()`) para auditar cobros en la blockchain sin intervención manual.
   - Renderizado dinámico de código QR de alta resolución con logo central.
   - Deep-linking para Phantom, Solflare y Backpack.
   - Detección nativa de extensiones Web3 del navegador (`window.solana`).
   - Simulador de ciclo de vida del bloque (Escaneo → Mempool → Confirmación en bloque).
   - Comisión de red ínfima: **~$0.00025 USD** por transacción.

2. **Riel Gift Cards Gateway**:
   - Soporte para **Steam Wallet**, **Tremendous Rewards**, **Amazon e-Gift Cards** y **Play/App Store**.
   - Validación interactiva con máscara de formato y simulación de API Gateway.
   - Panel de códigos de prueba con 1 clic para testing inmediato (`STEAM-DEMO-10`, `TREM-DEMO-25`, `AMZN-DEMO-05`, `TREM-MICRO-10`).
   - 0% de comisiones por intermediación bancaria.

3. **Tarjeta de Débito / Crédito**:
   - Tarjeta interactiva 3D con giro automático al foco del CVV (`flipCard()`).
   - Detección en tiempo real del emisor (Visa, Mastercard, Amex).
   - Algoritmo de validación y cálculo de comisiones comparativas tradicionales (2.9% + $0.30).

4. **Ledger & Dashboard en Tiempo Real**:
   - Registro en memoria persistente (`localStorage`).
   - Métricas: Total acumulado, saldo USDC Solana, saldo Gift Cards, saldo tarjetas y contador de transacciones.
   - **Calculador de ahorro de comisiones**: muestra cuánto dinero se ahorró el negocio gracias a Solana Pay vs tarifas bancarias tradicionales.
   - Filtrado por riel, exportación a archivo CSV y recibos detallados.

5. **Ajustes del Comercio (Merchant Settings)**:
   - Configuración de la dirección pública de recepción de Solana.
   - Selector de red (Solana Mainnet-Beta o Devnet).
   - Nombre comercial y concepto de pago editable.

6. **PWA (Progressive Web App)**:
   - Archivo `manifest.json` y `sw.js` (Service Worker) con caché offline *Stale-While-Revalidate*.
   - Botón interactivo de instalación para pantalla de inicio en Android, iOS y Desktop.

---

## 📂 Estructura del Proyecto

```
billetera/
├── index.html                # Interfaz principal de la aplicación
├── manifest.json             # Manifiesto PWA para instalación
├── sw.js                     # Service Worker con soporte offline
├── js/
│   ├── app.js               # Coordinador de interfaz, PWA y navegación
│   ├── solana-pay.js        # Generación de URLs Solana Pay y Base58
│   ├── giftcards.js         # Validador y simulador de Gateway de Gift Cards
│   └── ledger.js            # Manejador de estado, balances y CSV
├── icons/
│   ├── icon.svg             # Ícono vectorial escalable
│   ├── icon-192.png         # Ícono 192x192 para Android/PWA
│   └── icon-512.png         # Ícono 512x512 para PWA y Splash
├── scripts/
│   └── generate-icons.js    # Generador de íconos PNG
└── README.md                 # Documentación y guía de despliegue
```

---

## ⚖️ Recomendación: ¿GitHub Pages o Hostinger?

### Cuadro Comparativo

| Criterio | GitHub Pages | Hostinger |
| :--- | :--- | :--- |
| **Costo** | **100% Gratis de por vida** | De pago ($2 a $10 USD/mes) |
| **Certificado SSL (HTTPS)** | **Gratis y Automático** (Indispensable para PWA y Web3) | Incluido en planes anuales |
| **Despliegue** | Inmediato (`git push` o subida web) | Manual vía FTP / Administrador de archivos o cPanel |
| **Velocidad / CDN** | Red global de Fastly / GitHub | Servidor compartido asignado |
| **Tipo de Arquitectura** | **Ideal para Frontends / PWAs / Web3 DApps** | Ideal para Backends PHP / MySQL / WordPress |
| **Dominio Personalizado** | Soporta tu propio `.com` gratis | Soporta tu propio `.com` |
| **Mantenimiento** | Cero mantenimiento, sin parches de servidor | Requiere gestionar hosting / renovaciones |

### Veredicto Final

> **Recomendación: GITHUB PAGES (o Vercel)**
> 
> Esta aplicación es una **Progressive Web App (PWA) Client-Side** y una **Web3 DApp**:
> 1. Toda la lógica de **Solana Pay** se comunica directamente desde el navegador del usuario a la blockchain de Solana mediante RPCs públicos y enlaces universales hacia billeteras (Phantom / Solflare).
> 2. Una PWA **exige obligatoriamente HTTPS** para que el Service Worker y el manifiesto funcionen; GitHub Pages te da HTTPS gratis sin ninguna configuración.
> 3. En Hostinger estarías pagando mensualmente por funciones de servidor (PHP, bases de datos MySQL, Apache) que este frontend no necesita.

#### ¿Cuándo tendría sentido usar Hostinger?
Únicamente si en el futuro decides programar un **backend privado en Node.js o PHP** para conectarte a las APIs oficiales de Steam o Tremendous usando claves secretas de comercio (`API_SECRET_KEY`) que no puedan quedar visibles en el código JavaScript del navegador.

---

## 🚀 Cómo desplegar en GitHub Pages (Paso a Paso en 2 Minutos)

### Opción A: Desde la Web de GitHub (Sin usar comandos)
1. Entra a [github.com](https://github.com) e inicia sesión.
2. Crea un nuevo repositorio (por ejemplo: `billetera-micropagos`) y márcalo como **Public**.
3. Haz clic en **Upload files** y arrastra todos los archivos de esta carpeta (`index.html`, `manifest.json`, `sw.js`, carpetas `js/` e `icons/`).
4. Confirma los cambios con **Commit changes**.
5. Ve a la pestaña **Settings** > **Pages** (en el menú lateral izquierdo).
6. En **Build and deployment** > **Branch**, selecciona `main` (o `master`) y la carpeta `/ (root)`. Haz clic en **Save**.
7. En 1 minuto tendrás tu enlace activo:  
   `https://<tu-usuario>.github.io/billetera-micropagos/`

### Opción B: Usando Git en tu computadora
```bash
git init
git add .
git commit -m "feat: MicroPay PWA con Solana Pay y Gift Cards"
git branch -M main
git remote add origin https://github.com/<TU_USUARIO>/billetera-micropagos.git
git push -u origin main
```
Luego activas GitHub Pages desde Settings > Pages.

---

## 🛠️ Cómo desplegar en Hostinger (si ya tienes un plan contratado)

1. Ingresa a tu panel de Hostinger (**hPanel**).
2. Ve a **Sitios web** > Administrar > **Administrador de Archivos** (File Manager).
3. Entra a la carpeta `public_html`.
4. Sube todos los archivos del proyecto manteniendo la estructura de carpetas:
   - `index.html` debe estar directamente dentro de `public_html`.
   - La carpeta `js/` con sus 4 archivos.
   - La carpeta `icons/` con sus íconos.
   - `manifest.json` y `sw.js`.
5. Asegúrate de que el certificado **SSL esté activado** en la sección de Seguridad de Hostinger.
6. ¡Listo! Al ingresar a tu dominio se abrirá la aplicación.
