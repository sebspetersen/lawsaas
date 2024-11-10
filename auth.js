// auth.js

// Remove these imports since we're using global Firebase
// import { createUser, signIn } from './firebase';
// import { createStripeCheckoutSession } from './stripe';

// Initialize Firebase and Stripe at the top
const firebaseConfig = {
  apiKey: "AIzaSyBCzQKSufkAp1SpuTreufydl3iuA36HopQ",
  authDomain: "jurda-5a6b2.firebaseapp.com",
  projectId: "jurda-5a6b2",
  storageBucket: "jurda-5a6b2.firebasestorage.app",
  messagingSenderId: "668210342012",
  appId: "1:668210342012:web:e4504c92aa20ef63fe01f9",
  measurementId: "G-M6JT7LWHC1"
};

// Initialize Firebase
if (!firebase.apps?.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const stripe = Stripe('pk_live_51QIqWhQO2oGbYUgyvoDOr8e16QUBLJ5n05pqGyCowFpIq2Ig3DZ1dyciamG0QqRi0gRxZyDXqbgbPpMLEBrbvpf3002BOY4w3Q');

// Set Firebase authentication persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => console.log("Persistence set to LOCAL"))
  .catch((error) => console.error("Error setting persistence:", error));

// Add auth state listener
auth.onAuthStateChanged((user) => {
  if (user) {
    user.getIdToken().then((token) => {
      localStorage.setItem('authToken', token);
    });
  } else {
    localStorage.removeItem('authToken');
  }
});

// Handle login
async function handleLogin(event) {
  event.preventDefault();
  const errorElement = document.getElementById('login-error');
  const button = event.target.querySelector('button[type="submit"]');
  
  try {
    button.disabled = true;
    button.textContent = 'Logger ind...';
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const idToken = await userCredential.user.getIdToken();
    
    // Check for returnUrl
    const returnUrl = localStorage.getItem('returnUrl');
    if (returnUrl) {
      localStorage.removeItem('returnUrl');
      window.location.href = returnUrl;
      return;
    }

    // Check subscription status
    const response = await fetch('https://lawsaas-backend-dcffd2a3c58d.herokuapp.com/check-session-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      }
    });

    const data = await response.json();
    window.location.href = data.paid ? '/chat.html' : '/pricing.html';
  } catch (error) {
    console.error('Login error:', error);
    errorElement.textContent = 'Ugyldigt login. Kontroller venligst dine oplysninger.';
  } finally {
    button.disabled = false;
    button.textContent = 'Log ind';
  }
}

// Handle registration
async function handleRegister(event) {
  event.preventDefault();
  const errorElement = document.getElementById('register-error');
  const button = event.target.querySelector('button[type="submit"]');
  
  try {
    button.disabled = true;
    button.textContent = 'Opretter konto...';
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    if (password !== passwordConfirm) {
      throw new Error('Adgangskoderne matcher ikke');
    }

    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const idToken = await userCredential.user.getIdToken();

    window.location.href = '/pricing.html';
  } catch (error) {
    console.error('Registration error:', error);
    errorElement.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = 'Opret konto';
  }
}

// Handle Quick Access purchase
async function handleQuickAccess() {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      localStorage.setItem('returnUrl', '/pricing.html');
      window.location.href = '/auth.html';
      return;
    }

    const idToken = await user.getIdToken();
    const response = await fetch('https://lawsaas-backend-dcffd2a3c58d.herokuapp.com/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ 
        userId: user.uid
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { id: sessionId } = await response.json();
    
    const result = await stripe.redirectToCheckout({
      sessionId: sessionId
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Der opstod en fejl. Prøv igen.');
  }
}

// Export the functions so they can be imported by other modules
export { handleLogin, handleRegister, handleQuickAccess };