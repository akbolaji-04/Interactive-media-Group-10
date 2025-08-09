// Firebase Authentication logic for email/password and Google sign-in
// Replace the config object below with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAlDqliy8paoUMvQzYZmM2YZ-qeUBXhbqk",
  authDomain: "clovr-e1fec.firebaseapp.com",
  projectId: "clovr-e1fec",
  appId: "1:138358764083:web:e49f93ca77cfe4fc7ce946"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Email/password sign up
async function signUpWithEmail(email, password) {
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    alert('Sign up successful!');
  } catch (error) {
    alert(error.message);
  }
}

// Email/password login
async function loginWithEmail(email, password) {
  try {
    await auth.signInWithEmailAndPassword(email, password);
    alert('Login successful!');
  } catch (error) {
    alert(error.message);
  }
}

// Google sign-in
async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
    alert('Google sign-in successful!');
  } catch (error) {
    alert(error.message);
  }
}

// Sign out
function signOut() {
  auth.signOut();
}

// Listen for auth state changes
auth.onAuthStateChanged(user => {
  const authSection = document.getElementById('auth-section');
  const userSection = document.getElementById('user-section');
  if (user) {
    authSection.style.display = 'none';
    userSection.style.display = 'block';
    document.getElementById('user-email').textContent = user.email;
  } else {
    authSection.style.display = 'block';
    userSection.style.display = 'none';
  }
});
