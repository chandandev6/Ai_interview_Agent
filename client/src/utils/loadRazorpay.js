// Razorpay ka checkout script sirf tab load karo jab user "Buy" dabaye (har page par ~100 kB kyun)
const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let loading = null;

export const loadRazorpay = () => {
    if (window.Razorpay) return Promise.resolve(window.Razorpay);
    // do baar click → ek hi script tag (wahi promise)
    loading ??= new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = SCRIPT_URL;
        script.async = true;
        script.onload = () => resolve(window.Razorpay);
        script.onerror = () => {
            loading = null; // agli baar dobara try ho sake
            script.remove();
            reject(new Error("Could not load the payment window. Check your internet and try again."));
        };
        document.body.appendChild(script);
    });
    return loading;
};
