// utils/razorpayConfig.js

export const RAZORPAY_CONFIG = {
  key_id: import.meta.env?.VITE_RAZORPAY_KEY_ID || "rzp_test_T396co7rEpNVGg",
  test_mode: true,
  company_name: "PetCare Veterinary Services",
  company_logo: "/logo.png",
  theme_color: "#7c3aed",
  currency: "INR",
  modal: {
    backdropclose: true,
    escape: true,
    handleback: true,
    confirm_close: true,
    ondismiss: () => {
      console.log("Payment modal dismissed");
    },
    animation: true
  }
};

/**
 * Load Razorpay checkout.
 *
 * DEV / TEST MODE  →  imports MockRazorpay (accepts ANY card/UPI/bank details,
 *                      shows Razorpay-like UI, fires success callback automatically).
 * PRODUCTION       →  loads the real Razorpay checkout.js script from CDN.
 *
 * All existing `new window.Razorpay(options)` calls work unchanged in both modes.
 */
export const loadRazorpay = async () => {
  // ── DEV / TEST MODE ──────────────────────────────────────────────────
  if (import.meta.env.DEV) {
    const { default: MockRazorpay } = await import('./mockRazorpay.js');
    window.Razorpay = MockRazorpay;
    console.log(
      '%c[MockRazorpay] DEV mode — any payment details will be accepted ✅',
      'color:#3395FF;font-weight:bold'
    );
    return MockRazorpay;
  }

  // ── PRODUCTION ───────────────────────────────────────────────────────
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(null);
    };
    document.body.appendChild(script);
  });
};

// Test card details for reference (not used in dev mode — any details work)
export const TEST_CARDS = {
  success: {
    number: "6080 1400 0000 0000",
    expiry: "12/25",
    cvv: "123",
    name: "Test User"
  },
  failure: {
    number: "4111 1111 1111 1112",
    expiry: "12/25",
    cvv: "123",
    name: "Test User"
  }
};