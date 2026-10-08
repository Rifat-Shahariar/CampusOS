import { Injectable } from "@nestjs/common";
import { scryptSync, timingSafeEqual } from "node:crypto";
import bcrypt from "bcrypt";
import type { PasswordHasher } from "./interfaces/password-hasher.js";

/**
 * Production-ready password hasher service.
 * Supports hashing with bcrypt (cost factor 10) for new passwords,
 * and seamlessly verifies both bcrypt hashes and scrypt hashes (used by seed.ts).
 */
@Injectable()
export class PasswordService implements PasswordHasher {
  private readonly bcryptSaltRounds = 10;
  private readonly scryptKeyLength = 64;

  /**
   * Hashes a plaintext password using bcrypt.
   */
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.bcryptSaltRounds);
  }

  /**
   * Verifies plaintext password against either bcrypt or scrypt hash.
   */
  async verify(plain: string, hash: string): Promise<boolean> {
    if (!hash || !plain) {
      return false;
    }

    if (hash.startsWith("scrypt$")) {
      return this.verifyScrypt(plain, hash);
    }

    if (
      hash.startsWith("$2a$") ||
      hash.startsWith("$2b$") ||
      hash.startsWith("$2y$")
    ) {
      return bcrypt.compare(plain, hash);
    }

    return false;
  }

  /**
   * Helper to verify seed scrypt format:
   * scrypt$<N>$<r>$<p>$<salt-hex>$<derived-key-hex>
   */
  private verifyScrypt(plain: string, hash: string): boolean {
    const parts = hash.split("$");
    if (parts.length !== 6) {
      return false;
    }

    const [, nStr, rStr, pStr, saltHex, keyHex] = parts;
    const N = Number(nStr);
    const r = Number(rStr);
    const p = Number(pStr);

    if (Number.isNaN(N) || Number.isNaN(r) || Number.isNaN(p)) {
      return false;
    }

    try {
      const salt = Buffer.from(saltHex, "hex");
      const expectedKey = Buffer.from(keyHex, "hex");
      const derivedKey = scryptSync(plain, salt, expectedKey.length, {
        N,
        r,
        p,
      });

      if (derivedKey.length !== expectedKey.length) {
        return false;
      }

      return timingSafeEqual(derivedKey, expectedKey);
    } catch {
      return false;
    }
  }
}
