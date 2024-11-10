// auth.js

import { createUser, signIn } from './firebase';
import { createStripeCheckoutSession } from './stripe';

// Set Firebase authentication persistence to LOCAL
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log("Persistence set to LOCAL.");
    })
    .catch((error) => {
        console.error("Error setting persistence:", error);
    });

// Price IDs from Stripe
const PRICE_IDS = {
  starter: 'price_starter',
  professional: 'price_professional',
  enterprise: 'price_enterprise'
};

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('[name="email"]').value;
      const password = loginForm.querySelector('[name="password"]').value;

      try {
        const user = await signIn(email, password);
        // Check subscription status
        const subscription = await getUserSubscription(user.uid);

        if (subscription && subscription.status === 'active') {
          window.location.href = '/chat';
        } else {
          window.location.href = '/pricing';
        }
      } catch (error) {
        document.getElementById('login-error').textContent = error.message;
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = registerForm.querySelector('[name="email"]').value;
      const password = registerForm.querySelector('[name="password"]').value;
      const selectedPlan = registerForm.querySelector('[name="plan"]').value;

      try {
        // Create user in Firebase
        const user = await createUser(email, password);
        
        // Redirect to Stripe Checkout
        await createStripeCheckoutSession(user.uid, PRICE_IDS[selectedPlan]);
      } catch (error) {
        document.getElementById('register-error').textContent = error.message;
      }
    });
  }
});

// Function to handle the purchase process for each plan
async function handleQuickAccess(plan) {
  const user = firebase.auth().currentUser;
  if (!user) {
    window.location.href = '/auth.html';  // Redirect to login if not authenticated
    return;
  }

  try {
    const idToken = await user.getIdToken();
    const response = await fetch('https://lawsaas-backend-dcffd2a3c58d.herokuapp.com/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ userId: user.uid, priceId: PRICE_IDS[plan] })
    });

    const { id: sessionId } = await response.json();
    await stripe.redirectToCheckout({ sessionId: sessionId });
  } catch (error) {
    console.error('Error:', error);
    alert('Der opstod en fejl. Prøv igen.');
  }
}

// Attach the handleQuickAccess function to the pricing page buttons
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('starter-plan-button')?.addEventListener('click', () => handleQuickAccess('starter'));
  document.getElementById('professional-plan-button')?.addEventListener('click', () => handleQuickAccess('professional'));
  document.getElementById('enterprise-plan-button')?.addEventListener('click', () => handleQuickAccess('enterprise'));
});
