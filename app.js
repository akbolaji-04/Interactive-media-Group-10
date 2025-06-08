import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8zKTVZpoPmtxX9PS_et_JWVrbUpste9k",
  authDomain: "bytebites-8e4d6.firebaseapp.com",
  projectId: "bytebites-8e4d6",
  storageBucket: "bytebites-8e4d6.firebasestorage.app",
  messagingSenderId: "1027669607395",
  appId: "1:1027669607395:web:39bb370d43035fa05016d6",
  measurementId: "G-3DTVS8EL4T"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const REMOVE_BG_KEY = 'NmeuhmwYFeh48ySGMZehsrVo';
const API_KEY = 'fa-P6CHIRRwllKr-vxrnZlwkXBxx5ibCo81xMRBp';
const RUN_URL = 'https://api.fashn.ai/v1/run';
const STATUS_URL = 'https://api.fashn.ai/v1/status/';
const PAYSTACK_KEY = 'sk_test_27830de011b1b57cf83a852f2eb2e2b93a451fd1';

// DOM refs
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
const ctx = canvas.getContext('2d');

// Auth
googleBtn.addEventListener('click', () => signInWithPopup(auth, provider).catch(e => alert(e.message)));
onAuthStateChanged(auth, async user => {
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
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { trialStart: serverTimestamp(), subscribed: false });
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
      await setDoc(doc(db, 'users', auth.currentUser.uid), { subscribed: true }, { merge: true });
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

// Try-on workflow
let userFile = null;
let selectedShirt = null;

imageUpload.addEventListener('change', async (e) => {
  userFile = e.target.files[0];
  tryBtn.disabled = !userFile || !selectedShirt;
});

document.querySelectorAll('.shirt-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.shirt-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    selectedShirt = opt.dataset.src;
    tryBtn.disabled = !userFile || !selectedShirt;
  });
});

tryBtn.addEventListener('click', async () => {
  tryBtn.disabled = true;
  downloadBtn.disabled = true;
  spinner.classList.remove('hidden');
  canvas.classList.add('hidden');
  resultImg.classList.add('hidden');

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

  spinner.classList.add('hidden');
  if (status === 'completed' && output?.length) {
    resultImg.src = output[0];
    resultImg.classList.remove('hidden');
    downloadBtn.disabled = false;
  } else {
    alert('Try-on failed, please try again.');
  }
  tryBtn.disabled = false;
});

downloadBtn.addEventListener('click', () => {
  if (!resultImg.src) return;
  const a = document.createElement('a');
  a.href = resultImg.src;
  a.download = 'tryon-result.png';
  a.click();
});