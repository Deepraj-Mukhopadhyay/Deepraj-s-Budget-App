const request = require('supertest');
const { app } = require('../server');
const { startTestDb, stopTestDb, clearTestDb } = require('./setupTestDb');

let userTokenA = '';
let userIdA = '';
let userTokenB = '';
let transactionIdA = '';
let budgetIdA = '';

const runTests = async () => {
  console.log('====================================================');
  console.log('   STARTING BUDGET APP BACKEND TEST SUITE');
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

  try {
    console.log('Starting Test Database...');
    const uri = await startTestDb();
    console.log(`Test Database started at: ${uri}\n`);
  } catch (err) {
    console.error(`Could not start test database: ${err.message}`);
    console.log('\nTip: To run automated tests, ensure MongoDB is running or internet is available to download MongoMemoryServer binary.');
    return;
  }

  try {
    // -------------------------------------------------------------
    // 1. HEALTH CHECK TEST
    // -------------------------------------------------------------
    await test('GET /api/health returns 200 and running status', async () => {
      const res = await request(app).get('/api/health');
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Expected 200 success, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    });

    // -------------------------------------------------------------
    // 2. AUTHENTICATION TESTS
    // -------------------------------------------------------------
    await test('POST /api/auth/register creates user and returns JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Deepraj User',
          email: 'deepraj.test@example.com',
          password: 'Password123!',
          members: ['Deepraj', 'Anant', 'Ravi', 'Baijnath', 'Kunal']
        });

      if (res.status !== 201 || !res.body.data.token || res.body.data.user.password) {
        throw new Error(`Registration failed or leaked password: ${JSON.stringify(res.body)}`);
      }

      userTokenA = res.body.data.token;
      userIdA = res.body.data.user._id;
    });

    await test('POST /api/auth/register rejects duplicate email with 409', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Deepraj',
          email: 'deepraj.test@example.com',
          password: 'Password123!'
        });

      if (res.status !== 409) {
        throw new Error(`Expected 409 Conflict, got ${res.status}`);
      }
    });

    await test('POST /api/auth/register rejects short password with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass',
          email: 'short@example.com',
          password: '123'
        });

      if (res.status !== 400) {
        throw new Error(`Expected 400 Bad Request, got ${res.status}`);
      }
    });

    await test('POST /api/auth/login authenticates with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'deepraj.test@example.com',
          password: 'Password123!'
        });

      if (res.status !== 200 || !res.body.data.token) {
        throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('POST /api/auth/login rejects invalid password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'deepraj.test@example.com',
          password: 'WrongPassword'
        });

      if (res.status !== 401) {
        throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
      }
    });

    await test('GET /api/auth/me returns authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.status !== 200 || res.body.data.user.email !== 'deepraj.test@example.com') {
        throw new Error(`Profile retrieval failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('GET /api/auth/me rejects missing or invalid token with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_xyz');

      if (res.status !== 401) {
        throw new Error(`Expected 401, got ${res.status}`);
      }
    });

    // Register User B for multi-user isolation tests
    await test('Register User B for multi-tenant isolation testing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'userb@example.com',
          password: 'Password123!'
        });

      if (res.status !== 201) throw new Error('User B creation failed');
      userTokenB = res.body.data.token;
    });

    // -------------------------------------------------------------
    // 3. TRANSACTION TESTS
    // -------------------------------------------------------------
    await test('POST /api/transactions creates a Contribution transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          type: 'contribution',
          amount: 2000,
          person: 'Deepraj',
          paymentMethod: 'upi',
          date: '2026-10-01',
          note: 'Initial fund contribution',
          description: 'Contribution by Deepraj'
        });

      if (res.status !== 201 || res.body.data.amount !== 2000) {
        throw new Error(`Creating contribution failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('POST /api/transactions creates an Expense transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          type: 'expense',
          description: 'Weekly Grocery Shopping',
          amount: 500,
          category: 'grocery',
          paidBy: 'Anant',
          sharedBy: ['Deepraj', 'Anant', 'Ravi', 'Baijnath', 'Kunal'],
          date: '2026-10-01',
          note: 'Bought veggies and spices'
        });

      if (res.status !== 201 || res.body.data.category !== 'grocery') {
        throw new Error(`Creating expense failed: ${JSON.stringify(res.body)}`);
      }

      transactionIdA = res.body.data._id;
    });

    await test('POST /api/transactions rejects invalid amount or missing type', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          description: 'No Type or Amount',
          date: '2026-10-01'
        });

      if (res.status !== 400) {
        throw new Error(`Expected 400 Bad Request, got ${res.status}`);
      }
    });

    await test('GET /api/transactions retrieves transactions for User A', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length !== 2) {
        throw new Error(`Expected 2 transactions, got: ${JSON.stringify(res.body)}`);
      }
    });

    await test('GET /api/transactions filters by type=expense', async () => {
      const res = await request(app)
        .get('/api/transactions?type=expense')
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.status !== 200 || res.body.data.length !== 1 || res.body.data[0].type !== 'expense') {
        throw new Error(`Type filtering failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('GET /api/transactions filters by category=grocery', async () => {
      const res = await request(app)
        .get('/api/transactions?category=grocery')
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.status !== 200 || res.body.data.length !== 1 || res.body.data[0].category !== 'grocery') {
        throw new Error(`Category filtering failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('GET /api/transactions/:id retrieves single transaction', async () => {
      const res = await request(app)
        .get(`/api/transactions/${transactionIdA}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.status !== 200 || res.body.data._id !== transactionIdA) {
        throw new Error(`Get transaction by ID failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('PUT /api/transactions/:id updates transaction amount and note', async () => {
      const res = await request(app)
        .put(`/api/transactions/${transactionIdA}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          amount: 550,
          note: 'Updated note with bill'
        });

      if (res.status !== 200 || res.body.data.amount !== 550) {
        throw new Error(`Update failed: ${JSON.stringify(res.body)}`);
      }
    });

    // Multi-user data isolation test: User B cannot access User A's transaction
    await test('Data Isolation: User B cannot access User A transaction (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/transactions/${transactionIdA}`)
        .set('Authorization', `Bearer ${userTokenB}`);

      if (res.status !== 404) {
        throw new Error(`Expected 404 for unauthorized transaction access, got ${res.status}`);
      }
    });

    // -------------------------------------------------------------
    // 4. BUDGET TESTS
    // -------------------------------------------------------------
    await test('POST /api/budgets creates a monthly category budget', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          category: 'grocery',
          amount: 3000,
          month: 10,
          year: 2026
        });

      if (res.status !== 201 && res.status !== 200) {
        throw new Error(`Budget creation failed: ${JSON.stringify(res.body)}`);
      }

      budgetIdA = res.body.data._id;
    });

    await test('GET /api/budgets returns budgets with spending analytics', async () => {
      const res = await request(app)
        .get('/api/budgets?month=10&year=2026')
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length !== 1) {
        throw new Error(`Budget retrieval failed: ${JSON.stringify(res.body)}`);
      }

      const b = res.body.data[0];
      if (b.spent !== 550 || b.remaining !== 2450) {
        throw new Error(`Budget calculations incorrect. Spent: ${b.spent}, Remaining: ${b.remaining}`);
      }
    });

    await test('PUT /api/budgets/:id updates budget amount', async () => {
      const res = await request(app)
        .put(`/api/budgets/${budgetIdA}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ amount: 3500 });

      if (res.status !== 200 || res.body.data.amount !== 3500) {
        throw new Error(`Budget update failed: ${JSON.stringify(res.body)}`);
      }
    });

    // -------------------------------------------------------------
    // 5. DASHBOARD APIS TESTS
    // -------------------------------------------------------------
    await test('GET /api/dashboard/summary calculates fund, balances & settlements', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.status !== 200) {
        throw new Error(`Dashboard summary failed: ${JSON.stringify(res.body)}`);
      }

      const d = res.body.data;
      // Total contributions: 2000, Total expenses: 550, Fund balance: 1450
      if (d.totalContributions !== 2000 || d.totalExpenses !== 550 || d.fundBalance !== 1450) {
        throw new Error(`Summary calculations mismatch: ${JSON.stringify(d)}`);
      }

      if (!Array.isArray(d.memberBalances) || d.memberBalances.length === 0) {
        throw new Error('Member balances missing in summary');
      }
    });

    await test('GET /api/dashboard/category-expenses calculates category breakdown', async () => {
      const res = await request(app)
        .get('/api/dashboard/category-expenses')
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.status !== 200 || !Array.isArray(res.body.data.categories)) {
        throw new Error(`Category breakdown failed: ${JSON.stringify(res.body)}`);
      }

      const grocery = res.body.data.categories.find(c => c.category === 'grocery');
      if (!grocery || grocery.total !== 550) {
        throw new Error(`Grocery calculation incorrect: ${JSON.stringify(res.body.data)}`);
      }
    });

    await test('GET /api/dashboard/monthly calculates monthly trends', async () => {
      const res = await request(app)
        .get('/api/dashboard/monthly')
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.status !== 200 || !Array.isArray(res.body.data)) {
        throw new Error(`Monthly trends failed: ${JSON.stringify(res.body)}`);
      }
    });

    // -------------------------------------------------------------
    // 6. CATEGORIES API TESTS
    // -------------------------------------------------------------
    await test('GET /api/categories returns default categories', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.status !== 200 || res.body.data.length < 5) {
        throw new Error(`Categories failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('POST /api/categories creates custom category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ name: 'WiFi Internet', icon: '📶' });

      if (res.status !== 201 || res.body.data.slug !== 'wifi_internet') {
        throw new Error(`Custom category failed: ${JSON.stringify(res.body)}`);
      }
    });

    // -------------------------------------------------------------
    // 7. APP DATA HYDRATION & SYNC TESTS
    // -------------------------------------------------------------
    await test('GET /api/app-data hydrates complete frontend state', async () => {
      const res = await request(app)
        .get('/api/app-data')
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.status !== 200 || !res.body.data.contributions || !res.body.data.expenses) {
        throw new Error(`App data hydration failed: ${JSON.stringify(res.body)}`);
      }

      if (res.body.data.contributions.length !== 1 || res.body.data.expenses.length !== 1) {
        throw new Error(`App data item counts mismatch: ${JSON.stringify(res.body.data)}`);
      }
    });

    // -------------------------------------------------------------
    // 8. DELETION TESTS
    // -------------------------------------------------------------
    await test('DELETE /api/transactions/:id removes transaction', async () => {
      const res = await request(app)
        .delete(`/api/transactions/${transactionIdA}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.status !== 200) {
        throw new Error(`Transaction deletion failed: ${JSON.stringify(res.body)}`);
      }

      // Verify it's gone
      const verifyRes = await request(app)
        .get(`/api/transactions/${transactionIdA}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      if (verifyRes.status !== 404) {
        throw new Error(`Transaction was not deleted properly. Status: ${verifyRes.status}`);
      }
    });

    await test('DELETE /api/budgets/:id removes budget', async () => {
      const res = await request(app)
        .delete(`/api/budgets/${budgetIdA}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      if (res.status !== 200) {
        throw new Error(`Budget deletion failed: ${JSON.stringify(res.body)}`);
      }
    });

    // -------------------------------------------------------------
    // 9. ERROR HANDLING TESTS
    // -------------------------------------------------------------
    await test('Unmatched API route returns 404 with standardized error JSON', async () => {
      const res = await request(app).get('/api/non-existent-endpoint-xyz');
      if (res.status !== 404 || res.body.success !== false) {
        throw new Error(`Expected 404 error JSON, got ${res.status}`);
      }
    });

  } finally {
    await stopTestDb();
  }

  console.log('\n====================================================');
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
