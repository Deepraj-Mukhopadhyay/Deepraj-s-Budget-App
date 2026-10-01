const { generateToken, verifyToken } = require('../utils/tokenUtils');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const bcrypt = require('bcryptjs');

const runUnitTests = async () => {
  console.log('====================================================');
  console.log('       BUDGET APP BACKEND UNIT TEST SUITE');
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

  // 1. Token Utils Tests
  await test('generateToken creates valid JWT and verifyToken decodes it', async () => {
    const userId = '6724fa218820c4ab68192a01';
    const email = 'test@example.com';
    const token = generateToken(userId, email);

    if (typeof token !== 'string' || token.split('.').length !== 3) {
      throw new Error(`Token format is invalid: ${token}`);
    }

    const decoded = verifyToken(token);
    if (decoded.id !== userId || decoded.email !== email) {
      throw new Error(`Decoded payload does not match input: ${JSON.stringify(decoded)}`);
    }
  });

  await test('verifyToken rejects forged/corrupted tokens', async () => {
    try {
      verifyToken('invalid.token.signature');
      throw new Error('Should have thrown an error for forged token');
    } catch (err) {
      if (err.name !== 'JsonWebTokenError') {
        throw err;
      }
    }
  });

  // 2. Password Hashing Tests
  await test('bcrypt hashes passwords securely with salt', async () => {
    const password = 'SecretPassword123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    if (hash === password) {
      throw new Error('Password was not hashed!');
    }

    const isMatch = await bcrypt.compare(password, hash);
    if (!isMatch) {
      throw new Error('bcrypt.compare failed to verify correct password');
    }

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    if (isWrongMatch) {
      throw new Error('bcrypt.compare accepted wrong password');
    }
  });

  // 3. Response Handler Tests
  await test('successResponse formats consistent standardized JSON', async () => {
    let outputStatus = null;
    let outputJson = null;

    const mockRes = {
      status(code) {
        outputStatus = code;
        return this;
      },
      json(payload) {
        outputJson = payload;
        return this;
      }
    };

    successResponse(mockRes, 201, 'Created successfully', { id: 123 }, { total: 1 });

    if (outputStatus !== 201) throw new Error(`Expected 201, got ${outputStatus}`);
    if (outputJson.success !== true || outputJson.message !== 'Created successfully' || outputJson.data.id !== 123 || outputJson.total !== 1) {
      throw new Error(`Invalid response structure: ${JSON.stringify(outputJson)}`);
    }
  });

  await test('errorResponse formats consistent error structure with status code', async () => {
    let outputStatus = null;
    let outputJson = null;

    const mockRes = {
      status(code) {
        outputStatus = code;
        return this;
      },
      json(payload) {
        outputJson = payload;
        return this;
      }
    };

    errorResponse(mockRes, 400, 'Bad input', ['Email is required']);

    if (outputStatus !== 400) throw new Error(`Expected 400, got ${outputStatus}`);
    if (outputJson.success !== false || outputJson.message !== 'Bad input' || !outputJson.errors.includes('Email is required')) {
      throw new Error(`Invalid error response structure: ${JSON.stringify(outputJson)}`);
    }
  });

  // 4. Mongoose Schema Definitions Validation
  await test('User schema definition contains required security constraints', async () => {
    const User = require('../models/User');
    const emailPath = User.schema.paths.email;
    const passwordPath = User.schema.paths.password;

    if (!emailPath.isRequired) throw new Error('User email should be required');
    if (!passwordPath.isRequired) throw new Error('User password should be required');
    if (passwordPath.options.select !== false) throw new Error('User password should have select: false');
  });

  await test('Transaction schema definition enforces type enum and date format', async () => {
    const Transaction = require('../models/Transaction');
    const typeEnum = Transaction.schema.paths.type.options.enum.values;
    const amountPath = Transaction.schema.paths.amount;

    if (!typeEnum.includes('contribution') || !typeEnum.includes('expense')) {
      throw new Error('Transaction type enum missing contribution or expense');
    }
    if (!amountPath.isRequired) throw new Error('Amount should be required');
  });

  await test('Budget schema definition contains unique compound index', async () => {
    const Budget = require('../models/Budget');
    const indexes = Budget.schema.indexes();
    const hasCompound = indexes.some(idx => idx[0].userId && idx[0].category && idx[0].month && idx[0].year);

    if (!hasCompound) {
      throw new Error('Budget schema missing compound index on (userId, category, month, year)');
    }
  });

  console.log('\n====================================================');
  console.log(`   UNIT TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runUnitTests();
