// ...existing code (one set only, no duplicates)...

// (All import statements removed. Only use global firebase object.)

const firebaseConfig = {
  apiKey: "AIzaSyAlDqliy8paoUMvQzYZmM2YZ-qeUBXhbqk",
  authDomain: "clovr-e1fec.firebaseapp.com",
  projectId: "clovr-e1fec",
  storageBucket: "clovr-e1fec.firebasestorage.app",
  messagingSenderId: "138358764083",
  appId: "1:138358764083:web:e49f93ca77cfe4fc7ce946",
  measurementId: "G-YL6MX607V2"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

const REMOVE_BG_KEY = 'NmeuhmwYFeh48ySGMZehsrVo';
const API_KEY = 'fa-P6CHIRRwllKr-vxrnZlwkXBxx5ibCo81xMRBp';
const RUN_URL = 'https://api.fashn.ai/v1/run';
const STATUS_URL = 'https://api.fashn.ai/v1/status/';
const PAYSTACK_KEY = 'sk_test_27830de011b1b57cf83a852f2eb2e2b93a451fd1';

// DOM refs
// Profile button logic
document.addEventListener('DOMContentLoaded', function() {
  const profileBtn = document.getElementById('open-auth-modal');
  const authModal = document.getElementById('auth-modal');
  if (profileBtn && authModal) {
    profileBtn.addEventListener('click', () => {
      authModal.style.display = 'flex';
    });
  }
});

// Update profile placeholder after login
  auth.onAuthStateChanged(async function(user) {
  const profilePlaceholder = document.getElementById('profile-placeholder');
  if (user && profilePlaceholder) {
    if (user.photoURL) {
      profilePlaceholder.innerHTML = `<img src="${user.photoURL}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else if (user.email) {
      // Show first letter of email as fallback
      profilePlaceholder.innerHTML = `<span style='font-size:1.5rem;color:#fff;'>${user.email[0].toUpperCase()}</span>`;
    }
  } else if (profilePlaceholder) {
    // Reset to default SVG
    profilePlaceholder.innerHTML = `<svg id=\"profile-svg\" width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"8.5\" r=\"4.5\" fill=\"#b6c2e1\"/><ellipse cx=\"12\" cy=\"17\" rx=\"7\" ry=\"4\" fill=\"#b6c2e1\"/></svg>`;
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const googleBtn = document.getElementById('googleSignInBtn');
  const tryonSection = document.getElementById('tryonSection');
  const shirtGrid = document.getElementById('shirtGrid');
  const actionButtons = document.getElementById('actionButtons');
  const tryBtn = document.getElementById('tryOnBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const imageUpload = document.getElementById('imageUpload');
  const spinner = document.getElementById('spinner');
  const canvas = document.getElementById('canvas');
  const resultImg = document.getElementById('result-img');
  const ctx = canvas ? canvas.getContext('2d') : null;

  // Google Sign In
  if (googleBtn) {
    googleBtn.addEventListener('click', function() {
      auth.signInWithPopup(provider)
        .then(() => {
          const authModal = document.getElementById('auth-modal');
          if (authModal) authModal.style.display = 'none';
        })
        .catch(e => alert('Google sign-in failed: ' + (e.message || e)));
    });
  }

  // Email/password sign up
  window.signUpWithEmail = function(email, password) {
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        const authModal = document.getElementById('auth-modal');
        if (authModal) authModal.style.display = 'none';
      })
      .catch(e => alert('Sign up failed: ' + (e.message || e)));
  };

  // Email/password login
  window.loginWithEmail = function(email, password) {
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        const authModal = document.getElementById('auth-modal');
        if (authModal) authModal.style.display = 'none';
      })
      .catch(e => alert('Login failed: ' + (e.message || e)));
  };
});
auth.onAuthStateChanged(async function(user) {
  if (user) {
    document.getElementById('authSection').style.display = 'none';
    tryonSection.classList.remove('hidden');
    shirtGrid.classList.remove('hidden');
    actionButtons.classList.remove('hidden');
    await ensureUserRecord(user.uid);
    const subscribed = await checkSubscription(user.uid);
    if (!subscribed) promptSubscription();
  }
});

// Firestore helpers
async function ensureUserRecord(uid) {
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({ trialStart: new Date(), subscribed: false });
  }
}

async function checkSubscription(uid) {
  // Call Netlify Function
  const res = await fetch('/.netlify/functions/checkSubscription', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid })
  });
  if (!res.ok) return false;
  const { active } = await res.json();
  return active;
}

function promptSubscription() {
  if (confirm('Start subscription: ₦10,000/month after a 3-day free trial?')) {
    initiatePayment();
  }
}

function initiatePayment() {
  const handler = PaystackPop.setup({
    key: PAYSTACK_KEY,
    email: auth.currentUser.email,
    amount: 10000 * 100, // kobo
    currency: 'NGN',
    ref: '' + Date.now(),
    metadata: { custom_fields: [{ display_name: 'User ID', variable_name: 'uid', value: auth.currentUser.uid }] },
    callback: async (response) => {
      alert('Payment successful: ' + response.reference);
  await db.collection('users').doc(auth.currentUser.uid).set({ subscribed: true }, { merge: true });
    },
    onClose: () => alert('Subscription payment was cancelled.')
  });
  handler.openIframe();
}

// Utility functions
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressImage(file, maxSizeMB = 2, maxWidth = 800) {
  // implement compression if needed; returning original for now
  return file;
}

async function removeBackground(file) {
  const b64 = await fileToBase64(file);
  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': REMOVE_BG_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_file_b64: b64, size: 'auto' })
  });
  const blob = await res.blob();
  return new File([blob], 'no-bg.png', { type: blob.type });
}

downloadBtn.addEventListener('click', () => {

// Try-on workflow and all DOM-dependent logic
document.addEventListener('DOMContentLoaded', function() {
  let userFile = null;
  let selectedShirt = null;

  const tryBtn = document.getElementById('tryOnBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const imageUpload = document.getElementById('imageUpload');
  const spinner = document.getElementById('spinner');
  const canvas = document.getElementById('canvas');
  const resultImg = document.getElementById('result-img');

  if (imageUpload) {
    imageUpload.addEventListener('change', async (e) => {
      userFile = e.target.files[0];
      if (tryBtn) tryBtn.disabled = !userFile || !selectedShirt;
    });
  }

  document.querySelectorAll('.shirt-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.shirt-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedShirt = opt.dataset.src;
      if (tryBtn) tryBtn.disabled = !userFile || !selectedShirt;
    });
  });

  if (tryBtn) {
    tryBtn.addEventListener('click', async () => {
      tryBtn.disabled = true;
      if (downloadBtn) downloadBtn.disabled = true;
      if (spinner) spinner.classList.remove('hidden');
      if (canvas) canvas.classList.add('hidden');
      if (resultImg) resultImg.classList.add('hidden');

      // 1. Remove background
      const noBgFile = await removeBackground(await compressImage(userFile));

      // 2. Prepare images
      const modelB64 = await fileToBase64(noBgFile);
      const garmentResponse = await fetch(selectedShirt);
      const garmentBlob = await garmentResponse.blob();
      const garmentB64 = await fileToBase64(garmentBlob);

      // 3. Run Fashn
      const runRes = await fetch(RUN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
        body: JSON.stringify({ model_image: modelB64, garment_image: garmentB64, category: 'tops' })
      });
      const { id } = await runRes.json();

      // 4. Poll status
      let status, output;
      do {
        await new Promise(r => setTimeout(r, 2000));
        const statRes = await fetch(STATUS_URL + id, { headers: { Authorization: 'Bearer ' + API_KEY } });
        const statJson = await statRes.json();
        status = statJson.status;
        output = statJson.output;
      } while (status !== 'completed' && status !== 'failed');

      if (spinner) spinner.classList.add('hidden');
      if (status === 'completed' && output?.length) {
        if (resultImg) {
          resultImg.src = output[0];
          resultImg.classList.remove('hidden');
        }
      } else {
        alert('Try-on failed, please try again.');
      }
      tryBtn.disabled = false;
      if (downloadBtn) downloadBtn.disabled = false;
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!resultImg || !resultImg.src) return;
      const a = document.createElement('a');
      a.href = resultImg.src;
      a.download = 'tryon-result.png';
      a.click();
    });
  }
});
