const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../models/users');

const testUser = {
    username: 'NotARealGamer',
    email: 'NotARealGamer@cartridgeapp.fun',
    password: 'password123'
};

beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
    await User.deleteMany({ email: testUser.email });
    await mongoose.connection.close();
});

describe('Authentication Flow Suite', () => {
    // REGISTER ROUTE
    it('should register a brand new account successfully', async() => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: testUser.username,
                email: testUser.email,
                password: testUser.password
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Account added to DB.');

        const dbUser = await User.findOne({ email: testUser.email });
        expect(dbUser).toBeTruthy();
        expect(dbUser.isVerified).toBe(false); // Initial state of user on sign up, not email verified yet
        //expect(dbUser.isVerified).toBe(true); // true to test login
    });
    
    // Login Route
    it('Should log a user in if they have an email in the database and password matches, will not allow login otherwise', async() =>{
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });
            
        expect(res.statusCode).toEqual(403);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body.message).toContain('Your account has not yet been verified. A new verification link has been sent.'); //Token for logout test
    });

    // Logout route
    it('Should log a user out and clear application state', async() => {
        const res = await request(app)
            .post('/api/auth/logout');

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Logout Successful');
    });
});
