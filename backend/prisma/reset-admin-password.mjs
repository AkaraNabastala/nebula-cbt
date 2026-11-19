import "dotenv/config";
import { randomUUID } from "node:crypto";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { Pool } from "pg";
import argon2 from "argon2";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum dikonfigurasi.");

const email = String(process.argv[2] || "").trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Gunakan: npm run db:reset-admin-password -- email-admin");
}
if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
  throw new Error("Reset password harus dijalankan langsung dari terminal interaktif.");
}

function readSecret(prompt) {
  return new Promise((resolve, reject) => {
    let value = "";
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    const finish = (error) => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const char of String(chunk)) {
        if (char === "\u0003") {
          finish(new Error("Reset dibatalkan."));
          return;
        }
        if (char === "\r" || char === "\n") {
          finish();
          return;
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          stdout.write("\b \b");
          continue;
        }
        if (char >= " ") {
          value += char;
          stdout.write("*");
        }
      }
    };
    stdin.on("data", onData);
  });
}

const password = await readSecret("Password baru (minimal 12 karakter): ");
const confirmation = await readSecret("Ulangi password baru: ");
if (password.length < 12) throw new Error("Password baru minimal 12 karakter.");
if (password !== confirmation) throw new Error("Konfirmasi password tidak sama.");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(492167730113)");
  const result = await client.query([
    "SELECT u.id, u.full_name",
    "FROM users u",
    "JOIN user_identifiers i ON i.user_id = u.id",
    "JOIN user_roles ur ON ur.user_id = u.id",
    "JOIN roles r ON r.id = ur.role_id",
    "WHERE i.normalized_value = $1 AND r.code = 'ADMIN'",
    "FOR UPDATE OF u",
  ].join(" "), [email]);

  if (result.rowCount !== 1) {
    throw new Error(result.rowCount === 0
      ? "Akun ADMIN dengan email tersebut tidak ditemukan."
      : "Identitas cocok dengan lebih dari satu akun ADMIN; reset dibatalkan.");
  }

  const admin = result.rows[0];
  console.log("Target reset: " + admin.full_name + " <" + email + ">");
  const terminal = createInterface({ input: stdin, output: stdout });
  const confirmationText = await terminal.question("Ketik RESET untuk melanjutkan: ");
  terminal.close();
  if (confirmationText !== "RESET") throw new Error("Konfirmasi tidak cocok; reset dibatalkan.");

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await client.query(
    "UPDATE users SET password_hash = $1, must_change_password = true, " +
    "token_version = token_version + 1, updated_at = NOW() WHERE id = $2",
    [passwordHash, admin.id],
  );
  await client.query(
    "INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, description, created_at) " +
    "VALUES ($1, NULL, 'AUTH_ADMIN_PASSWORD_RESET', 'USER', $2, " +
    "'Password administrator direset melalui skrip pemulihan lokal; sesi lama dicabut.', NOW())",
    [randomUUID(), admin.id],
  );
  await client.query("COMMIT");
  console.log("Password akun ADMIN " + admin.full_name + " berhasil direset.");
  console.log("Login berikutnya wajib mengganti password.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
