#!/usr/bin/env node
// Hashes an admin password into the `scrypt:<salt>:<hash>` format
// ADMIN_PASSWORD_HASH expects (src/server/auth/password.ts) — so a real
// password is never typed into .env.local or this repo directly.
//
// Usage:
//   node scripts/admin/hash-password.mjs "my-password"
//   node scripts/admin/hash-password.mjs          (prompts instead)
//
// Prints ADMIN_PASSWORD_HASH=... to paste into .env.local. This is a
// local dev utility, not a hardened CLI: the prompted input is not
// hidden from the terminal — avoid running it where the screen or shell
// history is shared, or pass the password as an argument from a private
// shell instead.

import crypto from "node:crypto";
import readline from "node:readline/promises";

const SCRYPT_KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

async function main() {
  const argPassword = process.argv[2];
  let password = argPassword;

  if (!password) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question("Admin password: ");
    rl.close();
  }

  if (!password || password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  console.log("\nADMIN_PASSWORD_HASH=" + hashPassword(password));
  console.log("\nPaste that line into .env.local. Never commit it.");
}

main();
