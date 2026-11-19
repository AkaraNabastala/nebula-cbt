import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Pool } from "pg";
import argon2 from "argon2";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum dikonfigurasi.");
const terminal = createInterface({ input: stdin, output: stdout });
const fullName = (await terminal.question("Nama administrator: ")).trim();
const email = (await terminal.question("Email administrator: ")).trim();
const password = await terminal.question("Password awal (minimal 12 karakter): ");
terminal.close();

if (!fullName || fullName.length > 150) throw new Error("Nama wajib diisi (maksimal 150 karakter).");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) throw new Error("Email tidak valid.");
if (password.length < 12) throw new Error("Password minimal 12 karakter.");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(492167730112)");
  const existing = await client.query(
    "SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.code = 'ADMIN' LIMIT 1",
  );
  if (existing.rowCount) throw new Error("Administrator sudah ada; bootstrap hanya boleh dijalankan sekali.");
  const role = await client.query("SELECT id FROM roles WHERE code = 'ADMIN' LIMIT 1");
  if (!role.rowCount) throw new Error("Jalankan npm run db:seed terlebih dahulu.");
  const normalized = email.toLowerCase();
  const duplicate = await client.query("SELECT 1 FROM user_identifiers WHERE normalized_value = $1 LIMIT 1", [normalized]);
  if (duplicate.rowCount) throw new Error("Email sudah digunakan.");
  const userId = randomUUID();
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  await client.query(
    "INSERT INTO users (id, full_name, password_hash, status, must_change_password, token_version, created_at, updated_at) VALUES ($1, $2, $3, 'ACTIVE', true, 0, NOW(), NOW())",
    [userId, fullName, passwordHash],
  );
  await client.query(
    "INSERT INTO user_identifiers (id, user_id, identifier_type, identifier_value, normalized_value, is_primary, verified_at, created_at) VALUES ($1, $2, 'EMAIL', $3, $4, true, NOW(), NOW())",
    [randomUUID(), userId, email, normalized],
  );
  await client.query("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES ($1, $2, NOW())", [userId, role.rows[0].id]);
  await client.query("COMMIT");
  console.log("Administrator awal berhasil dibuat. Login pertama wajib mengganti password.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
