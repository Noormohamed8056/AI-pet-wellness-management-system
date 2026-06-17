// =============================================================
// mockRazorpay.js — DEV / TEST MODE ONLY
// Renders a Razorpay-like checkout modal that accepts ANY card
// number, UPI ID, CVV, expiry, or bank without validation.
// Fires the same options.handler callback the real SDK would,
// with generated mock payment/order/signature IDs.
//
// Usage: imported automatically by razorpayConfig.js in DEV mode.
// All existing  `new window.Razorpay(options)` calls continue to
// work unchanged — this class has the identical public API.
// =============================================================

const STYLE_ID = 'mock-rzp-injected-styles';

const STYLES = `
  .mrzp-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.65);
    z-index: 999999;
    display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  }
  .mrzp-modal {
    background: #fff;
    border-radius: 8px;
    width: 480px; max-width: 96vw;
    min-height: 520px;
    display: flex; flex-direction: column;
    overflow: hidden;
    box-shadow: 0 24px 80px rgba(0,0,0,0.35);
    animation: mrzpIn .22s cubic-bezier(.4,0,.2,1);
  }
  @keyframes mrzpIn {
    from { opacity:0; transform:translateY(-16px) scale(.97); }
    to   { opacity:1; transform:translateY(0)      scale(1);   }
  }
  /* ── Header ── */
  .mrzp-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px;
    color: #fff;
    flex-shrink: 0;
  }
  .mrzp-header-left { display:flex; align-items:center; gap:12px; }
  .mrzp-icon {
    width:40px; height:40px; border-radius:6px;
    background:rgba(255,255,255,.22);
    display:flex; align-items:center; justify-content:center;
    font-weight:700; font-size:17px; letter-spacing:-.5px;
    flex-shrink:0;
  }
  .mrzp-merchant { font-weight:600; font-size:14px; }
  .mrzp-price    { font-size:13px; opacity:.85; margin-top:2px; }
  .mrzp-x {
    background:none; border:none; color:#fff;
    font-size:20px; cursor:pointer; opacity:.75;
    padding:4px 8px; border-radius:4px; line-height:1;
    transition:opacity .15s,background .15s;
  }
  .mrzp-x:hover { opacity:1; background:rgba(255,255,255,.18); }
  /* ── Body ── */
  .mrzp-body { display:flex; flex:1; overflow:hidden; }
  /* Sidebar */
  .mrzp-sidebar {
    width:148px; flex-shrink:0;
    background:#f8f9fb;
    border-right:1px solid #e8eaed;
    display:flex; flex-direction:column;
    padding:6px 0;
  }
  .mrzp-tab {
    display:flex; align-items:center; gap:9px;
    padding:11px 14px;
    background:none; border:none; border-left:3px solid transparent;
    cursor:pointer; font-size:12.5px; color:#555; text-align:left;
    width:100%; transition:all .15s;
  }
  .mrzp-tab svg { flex-shrink:0; }
  .mrzp-tab:hover { background:#eef2ff; color:#3395ff; }
  .mrzp-tab.active { background:#fff; color:#3395ff; font-weight:600; border-left-color:#3395ff; }
  /* Form area */
  .mrzp-right {
    flex:1; padding:18px 20px;
    overflow-y:auto; display:flex; flex-direction:column;
  }
  .mrzp-pane { display:none; flex-direction:column; flex:1; }
  .mrzp-pane.on { display:flex; }
  /* Form fields */
  .mrzp-lbl {
    font-size:10.5px; font-weight:600; color:#888;
    text-transform:uppercase; letter-spacing:.5px;
    margin-bottom:4px; margin-top:13px;
  }
  .mrzp-lbl:first-child { margin-top:0; }
  .mrzp-inp {
    width:100%; padding:10px 11px;
    border:1.5px solid #dde1e7; border-radius:6px;
    font-size:13.5px; color:#222; background:#fff;
    outline:none; box-sizing:border-box;
    transition:border-color .15s;
  }
  .mrzp-inp:focus { border-color:#3395ff; }
  .mrzp-row { display:flex; gap:10px; }
  .mrzp-col { flex:1; }
  .mrzp-card-wrap { position:relative; }
  .mrzp-card-brand {
    position:absolute; right:10px; top:50%; transform:translateY(-50%);
    font-size:10px; font-weight:700; color:#aaa; pointer-events:none;
  }
  /* Buttons */
  .mrzp-btn {
    margin-top:18px; padding:12px;
    border:none; border-radius:6px;
    font-size:14px; font-weight:600; color:#fff;
    cursor:pointer; width:100%;
    transition:filter .15s, transform .1s;
    letter-spacing:.2px;
  }
  .mrzp-btn:hover  { filter:brightness(1.08); }
  .mrzp-btn:active { transform:scale(.985); }
  .mrzp-link-btn {
    background:none; border:1.5px solid #3395ff;
    color:#3395ff; border-radius:6px;
    padding:9px 14px; font-size:13px; font-weight:600;
    cursor:pointer; flex-shrink:0;
    transition:background .15s;
  }
  .mrzp-link-btn:hover { background:#f0f7ff; }
  /* UPI */
  .mrzp-upi-row { display:flex; gap:8px; }
  .mrzp-upi-row .mrzp-inp { flex:1; }
  .mrzp-hint { font-size:11.5px; color:#999; margin-top:6px; }
  .mrzp-or {
    text-align:center; font-size:11.5px; color:#bbb;
    margin:14px 0; position:relative;
  }
  .mrzp-or::before,.mrzp-or::after {
    content:''; position:absolute; top:50%; height:1px; background:#eee; width:42%;
  }
  .mrzp-or::before { left:0; } .mrzp-or::after { right:0; }
  /* Bank / App grid */
  .mrzp-grid {
    display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-top:4px;
  }
  .mrzp-chip {
    padding:9px 6px; border:1.5px solid #dde1e7; border-radius:6px;
    background:#fff; cursor:pointer; font-size:11.5px; font-weight:500; color:#444;
    text-align:center; transition:all .15s; display:flex; align-items:center;
    justify-content:center; gap:5px;
  }
  .mrzp-chip:hover,.mrzp-chip.sel { border-color:#3395ff; background:#eef5ff; color:#3395ff; }
  .mrzp-sel-box {
    width:100%; padding:9px 11px; margin-top:4px;
    border:1.5px solid #dde1e7; border-radius:6px;
    font-size:13px; color:#333; background:#fff;
    outline:none; box-sizing:border-box;
  }
  .mrzp-sel-box:focus { border-color:#3395ff; }
  /* Wallet list */
  .mrzp-wallet {
    display:flex; align-items:center; gap:10px;
    padding:10px 12px; border:1.5px solid #dde1e7;
    border-radius:7px; cursor:pointer; margin-bottom:7px;
    transition:all .15s; font-size:13px; color:#333;
  }
  .mrzp-wallet:hover { border-color:#3395ff; background:#f0f7ff; }
  .mrzp-wicon {
    width:30px; height:30px; border-radius:5px;
    display:flex; align-items:center; justify-content:center;
    font-weight:700; font-size:11px; color:#fff; flex-shrink:0;
  }
  /* Footer */
  .mrzp-foot {
    padding:9px 18px; border-top:1px solid #eee;
    display:flex; align-items:center; justify-content:center;
    gap:5px; font-size:10.5px; color:#bbb; flex-shrink:0;
  }
  .mrzp-foot b { color:#3395ff; }
  .mrzp-dev {
    background:#f97316; color:#fff; font-size:9px; font-weight:700;
    padding:2px 5px; border-radius:3px; letter-spacing:.4px; margin-left:6px;
  }
  @media(max-width:500px){
    .mrzp-modal { width:100vw; min-height:100dvh; border-radius:0; }
    .mrzp-overlay { align-items:flex-end; }
    .mrzp-sidebar { width:110px; }
  }
`;

// ── Helpers ────────────────────────────────────────────────────────────
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

const genId = (prefix) => {
  const r = () => Math.random().toString(36).substring(2).toUpperCase();
  return `${prefix}_${r()}${r()}`.substring(0, prefix.length + 15);
};

const fmtINR = (paise) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0,
  }).format((paise || 0) / 100);

// ── MockRazorpay class ─────────────────────────────────────────────────
class MockRazorpay {
  constructor(options) {
    this.options = options || {};
    this.eventHandlers = {};
    this.overlay = null;
    this._escHandler = null;
  }

  /** Mirror real Razorpay.on() API */
  on(event, handler) {
    this.eventHandlers[event] = handler;
    return this;
  }

  /** Mirror real Razorpay.open() API */
  open() {
    this._injectStyles();
    this.overlay = this._build();
    document.body.appendChild(this.overlay);
    this._escHandler = (e) => { if (e.key === 'Escape') this.close(); };
    document.addEventListener('keydown', this._escHandler);
    setTimeout(() => {
      const first = this.overlay?.querySelector('.mrzp-inp');
      first?.focus();
    }, 120);
  }

  /** Mirror real Razorpay.close() API */
  close() {
    this._cleanup();
    this.options?.modal?.ondismiss?.();
  }

  // ── Private ──────────────────────────────────────────────────────────
  _injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  _cleanup() {
    if (this.overlay && document.body.contains(this.overlay)) {
      document.body.removeChild(this.overlay);
    }
    this.overlay = null;
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
  }

  _success() {
    const response = {
      razorpay_payment_id: genId('pay'),
      razorpay_order_id:   this.options.order_id || genId('order'),
      razorpay_signature:  genId('sig'),
    };
    console.log('[MockRazorpay DEV] ✅ Simulated payment success:', response);
    this._cleanup();
    if (typeof this.options.handler === 'function') {
      setTimeout(() => this.options.handler(response), 40);
    }
  }

  _build() {
    const { name = 'Merchant', prefill = {} } = this.options;
    const amount   = fmtINR(this.options.amount);
    const initials = name.replace(/[^A-Za-z]/g, '').substring(0, 2).toUpperCase() || 'P';
    const color    = this.options.theme?.color || '#3395FF';

    const overlay = document.createElement('div');
    overlay.className = 'mrzp-overlay';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });

    overlay.innerHTML = `
<div class="mrzp-modal" role="dialog" aria-modal="true" aria-label="Payment">
  <!-- HEADER -->
  <div class="mrzp-header" style="background:${color}">
    <div class="mrzp-header-left">
      <div class="mrzp-icon">${esc(initials)}</div>
      <div>
        <div class="mrzp-merchant">${esc(name)}</div>
        <div class="mrzp-price">${amount}</div>
      </div>
    </div>
    <button class="mrzp-x" id="mrzp-close" aria-label="Close">&#x2715;</button>
  </div>

  <!-- BODY -->
  <div class="mrzp-body">
    <!-- Sidebar -->
    <nav class="mrzp-sidebar" aria-label="Payment methods">
      <button class="mrzp-tab active" data-pane="card">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        Card
      </button>
      <button class="mrzp-tab" data-pane="upi">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        UPI
      </button>
      <button class="mrzp-tab" data-pane="netbanking">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Net Banking
      </button>
      <button class="mrzp-tab" data-pane="wallet">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V22H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14l4 4z"/><circle cx="16" cy="12" r="1" fill="currentColor"/></svg>
        Wallet
      </button>
    </nav>

    <!-- Right: forms -->
    <div class="mrzp-right">

      <!-- ── CARD PANE ── -->
      <div class="mrzp-pane on" id="mrzp-pane-card">
        <div class="mrzp-lbl">Card Number</div>
        <div class="mrzp-card-wrap">
          <input id="mrzp-cardnum" class="mrzp-inp" type="text" inputmode="numeric"
            placeholder="•••• •••• •••• ••••" maxlength="19"
            autocomplete="cc-number" style="padding-right:56px">
          <span class="mrzp-card-brand" id="mrzp-brand">CARD</span>
        </div>

        <div class="mrzp-lbl">Name on Card</div>
        <input id="mrzp-cardname" class="mrzp-inp" type="text"
          placeholder="Full name" autocomplete="cc-name"
          value="${esc(prefill.name || '')}">

        <div class="mrzp-row">
          <div class="mrzp-col">
            <div class="mrzp-lbl">Expiry</div>
            <input id="mrzp-expiry" class="mrzp-inp" type="text" inputmode="numeric"
              placeholder="MM / YY" maxlength="7" autocomplete="cc-exp">
          </div>
          <div class="mrzp-col">
            <div class="mrzp-lbl">CVV</div>
            <input id="mrzp-cvv" class="mrzp-inp" type="password" inputmode="numeric"
              placeholder="•••" maxlength="4" autocomplete="cc-csc">
          </div>
        </div>

        <button class="mrzp-btn" id="mrzp-pay-card" style="background:${color}">
          Pay ${amount}
        </button>
      </div>

      <!-- ── UPI PANE ── -->
      <div class="mrzp-pane" id="mrzp-pane-upi">
        <div class="mrzp-lbl">Enter UPI ID</div>
        <div class="mrzp-upi-row">
          <input id="mrzp-upiid" class="mrzp-inp" type="text"
            placeholder="yourname@upi" autocomplete="off">
          <button class="mrzp-link-btn" id="mrzp-pay-upi">Verify &amp; Pay</button>
        </div>
        <p class="mrzp-hint">Any UPI ID is accepted in test mode (e.g. user@okicici, name@paytm)</p>

        <div class="mrzp-or">OR</div>

        <div class="mrzp-lbl" style="margin-top:0">Select UPI App</div>
        <div class="mrzp-grid">
          <button class="mrzp-chip" data-upipay="gpay">📱 Google Pay</button>
          <button class="mrzp-chip" data-upipay="phonepe">📲 PhonePe</button>
          <button class="mrzp-chip" data-upipay="paytm">💳 Paytm</button>
          <button class="mrzp-chip" data-upipay="bhim">🏦 BHIM UPI</button>
        </div>
      </div>

      <!-- ── NET BANKING PANE ── -->
      <div class="mrzp-pane" id="mrzp-pane-netbanking">
        <div class="mrzp-lbl">Popular Banks</div>
        <div class="mrzp-grid" id="mrzp-banks">
          <button class="mrzp-chip" data-bank="SBI">🏛 SBI</button>
          <button class="mrzp-chip" data-bank="HDFC">🏦 HDFC Bank</button>
          <button class="mrzp-chip" data-bank="ICICI">💳 ICICI Bank</button>
          <button class="mrzp-chip" data-bank="AXIS">🔵 Axis Bank</button>
          <button class="mrzp-chip" data-bank="KOTAK">🟠 Kotak Mahindra</button>
          <button class="mrzp-chip" data-bank="YES">🟢 Yes Bank</button>
        </div>

        <div class="mrzp-lbl">Other Banks</div>
        <select class="mrzp-sel-box" id="mrzp-banksel">
          <option value="">-- Select Bank --</option>
          <option>Punjab National Bank</option>
          <option>Bank of Baroda</option>
          <option>Canara Bank</option>
          <option>Union Bank of India</option>
          <option>IDFC First Bank</option>
          <option>IndusInd Bank</option>
          <option>RBL Bank</option>
          <option>Federal Bank</option>
          <option>Citibank India</option>
          <option>Standard Chartered</option>
          <option>Bank of India</option>
          <option>UCO Bank</option>
        </select>

        <button class="mrzp-btn" id="mrzp-pay-nb" style="background:${color}">
          Pay via Net Banking
        </button>
      </div>

      <!-- ── WALLET PANE ── -->
      <div class="mrzp-pane" id="mrzp-pane-wallet">
        <div class="mrzp-lbl">Select Wallet</div>
        <div class="mrzp-wallet" data-wallet="paytm">
          <div class="mrzp-wicon" style="background:#00B9F1">P</div>
          <span>Paytm Wallet</span>
        </div>
        <div class="mrzp-wallet" data-wallet="phonepe">
          <div class="mrzp-wicon" style="background:#5F259F">PP</div>
          <span>PhonePe Wallet</span>
        </div>
        <div class="mrzp-wallet" data-wallet="amazon">
          <div class="mrzp-wicon" style="background:#FF9900">A</div>
          <span>Amazon Pay</span>
        </div>
        <div class="mrzp-wallet" data-wallet="airtel">
          <div class="mrzp-wicon" style="background:#E40000">AI</div>
          <span>Airtel Money</span>
        </div>
        <div class="mrzp-wallet" data-wallet="freecharge">
          <div class="mrzp-wicon" style="background:#00C853">FC</div>
          <span>FreeCharge</span>
        </div>
      </div>

    </div><!-- /mrzp-right -->
  </div><!-- /mrzp-body -->

  <!-- FOOTER -->
  <div class="mrzp-foot">
    Secured by <b>Razorpay</b> &nbsp;|&nbsp; SSL Encrypted
    <span class="mrzp-dev">TEST MODE</span>
  </div>
</div>
    `;

    this._wire(overlay, color);
    return overlay;
  }

  _wire(overlay, color) {
    // Close
    overlay.querySelector('#mrzp-close').addEventListener('click', () => this.close());

    // Tab switching
    overlay.querySelectorAll('.mrzp-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.mrzp-tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const pane = btn.dataset.pane;
        overlay.querySelectorAll('.mrzp-pane').forEach((p) => p.classList.remove('on'));
        overlay.querySelector(`#mrzp-pane-${pane}`).classList.add('on');
        setTimeout(() => overlay.querySelector(`#mrzp-pane-${pane} .mrzp-inp`)?.focus(), 60);
      });
    });

    // Card number: auto-format + brand detection
    overlay.querySelector('#mrzp-cardnum').addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').substring(0, 16);
      e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
      const brand = overlay.querySelector('#mrzp-brand');
      if (/^4/.test(v))        brand.textContent = 'VISA';
      else if (/^5[1-5]/.test(v)) brand.textContent = 'MC';
      else if (/^3[47]/.test(v))  brand.textContent = 'AMEX';
      else if (/^6/.test(v))   brand.textContent = 'RUPAY';
      else                     brand.textContent = 'CARD';
    });

    // Expiry auto-format
    overlay.querySelector('#mrzp-expiry').addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length >= 2) v = v.substring(0, 2) + ' / ' + v.substring(2, 4);
      e.target.value = v;
    });

    // CVV — digits only
    overlay.querySelector('#mrzp-cvv').addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
    });

    // Allow Enter key to pay on card pane
    ['#mrzp-cardnum', '#mrzp-cardname', '#mrzp-expiry', '#mrzp-cvv'].forEach((sel) => {
      overlay.querySelector(sel)?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._success();
      });
    });

    // Card pay
    overlay.querySelector('#mrzp-pay-card').addEventListener('click', () => this._success());

    // UPI pay (verify button)
    overlay.querySelector('#mrzp-pay-upi').addEventListener('click', () => this._success());
    overlay.querySelector('#mrzp-upiid').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._success();
    });

    // UPI app chips
    overlay.querySelectorAll('[data-upipay]').forEach((btn) => {
      btn.addEventListener('click', () => this._success());
    });

    // Net banking bank chips — select then pay
    overlay.querySelectorAll('[data-bank]').forEach((btn) => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('[data-bank]').forEach((b) => b.classList.remove('sel'));
        btn.classList.add('sel');
      });
    });
    overlay.querySelector('#mrzp-pay-nb').addEventListener('click', () => this._success());

    // Wallet options — single click to pay
    overlay.querySelectorAll('[data-wallet]').forEach((el) => {
      el.addEventListener('click', () => this._success());
    });
  }
}

export default MockRazorpay;
