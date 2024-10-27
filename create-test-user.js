const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User Schema (copy from your chat-api.js)
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    subscription: {
        type: String,
        enum: ['none', 'basic', 'document'],
        default: 'none'
    },
    subscriptionEndDate: Date,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
    try {
        // Check if test user exists
        const existingUser = await User.findOne({ email: 'test@test.dk' });
        if (existingUser) {
            console.log('Test user already exists. Updating subscription...');
            existingUser.subscription = 'document';
            existingUser.subscriptionEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
            await existingUser.save();
            console.log('Test user updated successfully!');
        } else {
            // Create new test user
            const hashedPassword = await bcrypt.hash('test123', 10);
            const user = new User({
                email: 'test@test.dk',
                password: hashedPassword,
                subscription: 'document', // Highest tier subscription
                subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
            });

            await user.save();
            console.log('Test user created successfully!');
        }

        console.log('\nTest User Details:');
        console.log('Email: test@test.dk');
        console.log('Password: test123');
        console.log('Subscription: document (full access)');
        console.log('Subscription valid for: 1 year');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

createTestUser();
