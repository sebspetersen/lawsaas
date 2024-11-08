// stripe-api.js
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

const router = express.Router();

// Create Checkout Session
router.post('/create-checkout-session', async (req, res) => {
  const { userId, priceId } = req.body;

  try {
    // Get user from Firebase
    const user = await admin.auth().getUser(userId);

    // Create or get Stripe customer
    let customerDoc = await admin.firestore().collection('users').doc(userId).get();
    let customerId = customerDoc.data()?.customerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          firebaseUID: userId
        }
      });
      customerId = customer.id;
      await admin.firestore().collection('users').doc(userId).update({
        customerId: customerId
      });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.DOMAIN}/chat?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN}/pricing`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle subscription events
  if (event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.firebaseUID;

    await admin.firestore().collection('users').doc(userId).update({
      subscription: subscription
    });
  }

  res.json({ received: true });
});

module.exports = router;
