// auth.js
import { createUser, signIn } from './firebase';
import { createStripeCheckoutSession } from './stripe';

// Price IDs from Stripe
const PRICE_IDS = {
  starter: 'price_starter',
  professional: 'price_professional',
  enterprise: 'price_enterprise'
};

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

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
});
