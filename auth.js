// Initialize Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCzQKSufkAp1SpuTreufydl3iuA36HopQ",
  authDomain: "jurda-5a6b2.firebaseapp.com",
  projectId: "jurda-5a6b2",
  storageBucket: "jurda-5a6b2.firebasestorage.app",
  messagingSenderId: "668210342012",
  appId: "1:668210342012:web:e4504c92aa20ef63fe01f9",
  measurementId: "G-M6JT7LWHC1"
};

// Initialize Firebase (only if not already initialized)
if (!firebase.apps?.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// Set persistence to LOCAL
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => console.log("Persistence set to LOCAL"))
  .catch((error) => console.error("Error setting persistence:", error));

// Initialize Stripe
const stripe = Stripe('pk_live_51QIqWhQO2oGbYUgyvoDOr8e16QUBLJ5n05pqGyCowFpIq2Ig3DZ1dyciamG0QqRi0gRxZyDXqbgbPpMLEBrbvpf3002BOY4w3Q');

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
      
      // Sign in the user
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const idToken = await userCredential.user.getIdToken();

      // Check subscription status
      const response = await fetch('https://lawsaas-backend-dcffd2a3c58d.herokuapp.com/check-session-status', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
          }
      });

      const data = await response.json();
      
      // Get return URL and redirect
      const returnUrl = localStorage.getItem('returnUrl');
      if (returnUrl) {
          localStorage.removeItem('returnUrl');
          window.location.href = returnUrl;
      } else {
          window.location.href = data.paid ? '/chat.html' : '/pricing.html';
      }
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

      // Create or get Stripe customer
      const response = await fetch('https://lawsaas-backend-dcffd2a3c58d.herokuapp.com/create-user', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ 
              userId: userCredential.user.uid,
              email: email 
          })
      });

      if (!response.ok) {
          throw new Error('Failed to create user profile');
      }

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

// Export functions
export { handleLogin, handleRegister, handleQuickAccess };