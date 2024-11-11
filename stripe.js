// stripe.js
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
const stripe = await loadStripe('pk_live_51QIqWhQO2oGbYUgyvoDOr8e16QUBLJ5n05pqGyCowFpIq2Ig3DZ1dyciamG0QqRi0gRxZyDXqbgbPpMLEBrbvpf3002BOY4w3Q');

// API base URL
const API_URL = 'https://lawsaas-backend-dcffd2a3c58d.herokuapp.com';

// Product and Price IDs
export const PRODUCTS = {
  starter: {
    id: 'prod_RBCymDpVgFgm55',
    price: 39,
    name: 'Starter'
  }
  // Add more products as needed
};

export const createStripeCheckoutSession = async (userId, productId) => {
  try {
    const response = await fetch(`${API_URL}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        productId,
        successUrl: `https://jurda.dk/chat?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `https://jurda.dk/pricing`
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create checkout session');
    }

    const session = await response.json();
    
    // Redirect to Stripe Checkout
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const handlePaymentSuccess = async (userId, paymentDetails) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      paymentStatus: 'paid',
      paymentDetails: paymentDetails,
      purchaseDate: new Date().toISOString(),
      accessExpires: null // Set this if you want to implement expiration
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

// Helper function to format price in DKK
export const formatPrice = (amount) => {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Verify payment status
export const verifyPaymentStatus = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    return userData?.paymentStatus === 'paid';
  } catch (error) {
    console.error('Error verifying payment status:', error);
    throw error;
  }
};

// Check payment session status
export const checkSessionStatus = async (sessionId) => {
  try {
    const response = await fetch(`${API_URL}/check-session-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to check session status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking session status:', error);
    throw error;
  }
};