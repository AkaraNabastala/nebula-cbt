import 'dotenv/config';
import pg from 'pg';
import argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const rl = createInterface({ input: stdin, output: stdout });

async function main() {
  const fullName = (await rl.question('Nama administrator: ')).trim();
  const email = (await rl.question('Email administrator: '))
    .trim()
    .toLowerCase();
  const username = (await rl.question('Username administrator: '))
    .trim()
    .toLowerCase();
  const password = await rl.question('Password administrator: ');

  if (!fullName || !email || !username || password.length < 12) {
    throw new Error('Data tidak valid. Password minimal 12 karakter.');
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await pool.query('BEGIN');

  try {
    const existing = await pool.query(
      `SELECT 1 FROM user_identifiers
       WHERE normalized_value = ANY($1::varchar[])`,
      [[email, username]],
    );

    if (existing.rowCount) {
      throw new Error('Email atau username sudah digunakan.');
    }

    const role = await pool.query(
      `SELECT id FROM roles WHERE code = 'ADMIN'`,
    );

    if (!role.rowCount) {
      throw new Error('Role ADMIN tidak ditemukan.');
    }

    const userId = randomUUID();

    await pool.query(
      `INSERT INTO users
       (id, full_name, password_hash, status, must_change_password,
        created_at, updated_at)
       VALUES ($1, $2, $3, 'ACTIVE', false, NOW(), NOW())`,
      [userId, fullName, passwordHash],
    );

    await pool.query(
      `INSERT INTO user_identifiers
       (id, user_id, identifier_type, identifier_value,
        normalized_value, is_primary, created_at)
       VALUES
       ($1, $2, 'EMAIL', $3, $3, true, NOW()),
       ($4, $2, 'USERNAME', $5, $5, false, NOW())`,
      [randomUUID(), userId, email, randomUUID(), username],
    );

    await pool.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_at)
       VALUES ($1, $2, NOW())`,
      [userId, role.rows[0].id],
    );

    await pool.query('COMMIT');

    console.log('Administrator berhasil dibuat.');
    console.log(`User ID: ${userId}`);
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

try {
  await main();
} catch (error) {
  console.error('Gagal membuat administrator:', error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}
