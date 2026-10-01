const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const { generateToken } = require('../utils/tokenUtils');
const bcrypt = require('bcryptjs');

const runIntegrationTests = async () => {
  console.log('====================================================');
  console.log('   BUDGET APP BACKEND INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}\n`);
      failed++;
    }
  };

  // Mock User setup
  const mockUserId = '6724fa218820c4ab68192a01';
  const mockUserEmail = 'deepraj@example.com';
  const mockPasswordHash = await bcrypt.hash('Password123!', 10);
  const mockToken = generateToken(mockUserId, mockUserEmail);

  const mockUser = {
    _id: mockUserId,
    name: 'Deepraj Mukhopadhyay',
    email: mockUserEmail,
    password: mockPasswordHash,
    members: ['Deepraj', 'Anant', 'Ravi', 'Baijnath', 'Kunal'],
    currency: 'INR',
    archivedMonths: [],
    matchPassword: async (pwd) => bcrypt.compare(pwd, mockPasswordHash),
    save: async function () { return this; },
    toObject: function () {
      return {
        _id: this._id,
        name: this.name,
        email: this.email,
        members: this.members,
        currency: this.currency,
        archivedMonths: this.archivedMonths
      };
    }
  };

  // 1. Health check
  await test('GET /api/health responds with 200 OK', async () => {
    const res = await request(app).get('/api/health');
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });

  // 2. Auth: Register validation
  await test('POST /api/auth/register fails with missing email/password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test' });

    if (res.status !== 400 || res.body.success !== false) {
      throw new Error(`Expected 400, got ${res.status}`);
    }
  });

  // 3. Auth: Login validation
  await test('POST /api/auth/login fails when credentials are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    if (res.status !== 400 || res.body.success !== false) {
      throw new Error(`Expected 400, got ${res.status}`);
    }
  });

  // 4. Protected Route: Auth Middleware rejects unauthenticated requests
  await test('GET /api/auth/me rejects request without Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    if (res.status !== 401 || res.body.success !== false) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test('GET /api/transactions rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/transactions');
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test('GET /api/budgets rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/budgets');
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test('GET /api/dashboard/summary rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  // 5. Auth Middleware allows valid JWT when User.findById resolves
  const origFindById = User.findById;
  User.findById = function (id) {
    return {
      select: () => Promise.resolve(mockUser)
    };
  };

  await test('GET /api/auth/me succeeds with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${mockToken}`);

    if (res.status !== 200 || res.body.data.user.email !== mockUserEmail) {
      throw new Error(`Expected 200 with user data, got: ${JSON.stringify(res.body)}`);
    }
  });

  // 6. Transaction validation
  await test('POST /api/transactions validates required fields', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ description: 'Test' }); // Missing type, amount, date

    if (res.status !== 400 || res.body.success !== false) {
      throw new Error(`Expected 400 Bad Request, got: ${res.status}`);
    }
  });

  // 7. Transaction creation with mock model
  const origTxnCreate = Transaction.create;
  Transaction.create = async function (data) {
    return {
      _id: '6724fc918820c4ab68192a10',
      ...data,
      createdAt: new Date().toISOString()
    };
  };

  await test('POST /api/transactions creates valid contribution transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        type: 'contribution',
        amount: 2500,
        person: 'Deepraj',
        date: '2026-10-01',
        paymentMethod: 'upi',
        note: 'Monthly room contribution'
      });

    if (res.status !== 201 || res.body.data.amount !== 2500 || res.body.data.type !== 'contribution') {
      throw new Error(`Expected 201 Created, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  // 8. Transaction retrieval with mock model
  const origTxnFind = Transaction.find;
  const origTxnCount = Transaction.countDocuments;
  Transaction.find = function () {
    return {
      sort: () => ({
        exec: async () => [
          {
            _id: '6724fc918820c4ab68192a10',
            userId: mockUserId,
            type: 'contribution',
            description: 'Contribution by Deepraj',
            amount: 2500,
            date: '2026-10-01'
          }
        ]
      })
    };
  };
  Transaction.countDocuments = async () => 1;

  await test('GET /api/transactions retrieves transactions list', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${mockToken}`);

    if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length !== 1) {
      throw new Error(`Expected 200 with list, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  // 9. Categories retrieval
  const origCategoryFind = Category.find;
  Category.find = async () => [];

  await test('GET /api/categories returns default categories list', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${mockToken}`);

    if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length < 5) {
      throw new Error(`Expected 200 with categories, got ${res.status}`);
    }
  });

  // 10. 404 Route handling
  await test('GET /api/non-existent returns 404 with standardized error JSON', async () => {
    const res = await request(app).get('/api/non-existent');
    if (res.status !== 404 || res.body.success !== false) {
      throw new Error(`Expected 404, got ${res.status}`);
    }
  });

  // Restore mocks
  User.findById = origFindById;
  Transaction.create = origTxnCreate;
  Transaction.find = origTxnFind;
  Transaction.countDocuments = origTxnCount;
  Category.find = origCategoryFind;

  console.log('\n====================================================');
  console.log(`   INTEGRATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runIntegrationTests();
