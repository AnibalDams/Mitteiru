import { beforeAll, describe, expect, test } from "bun:test";
import jwt from "jsonwebtoken";
import { signAdminToken, signUserToken, verifyToken } from "../tokens";
import { isOwner } from "../ownershipRules";
import { isPrivateAddress, assertSafeUrl } from "../httpUrl";
import {
  commentSchema,
  loginSchema,
  signupSchema,
  animeSchema,
} from "../schemas";

beforeAll(() => {
  process.env.SECRET_KEY = "test-secret-key-with-enough-entropy-123456";
});

describe("tokens", () => {
  test("firma y verifica un token de usuario", () => {
    const token = signUserToken({ sub: "507f1f77bcf86cd799439011", email: "a@b.co" });
    const decoded = verifyToken(token, "user");
    expect(decoded.sub).toBe("507f1f77bcf86cd799439011");
    expect(decoded.role).toBe("user");
  });

  test("un token de usuario no sirve como admin", () => {
    const token = signUserToken({ sub: "507f1f77bcf86cd799439011" });
    expect(() => verifyToken(token, "admin")).toThrow();
  });

  test("un token de admin no sirve como usuario", () => {
    const token = signAdminToken({ sub: "507f1f77bcf86cd799439011" });
    expect(() => verifyToken(token, "user")).toThrow();
  });

  test("rechaza tokens expirados", () => {
    const expired = jwt.sign(
      { sub: "507f1f77bcf86cd799439011", role: "user", aud: "user" },
      process.env.SECRET_KEY as string,
      { algorithm: "HS256", expiresIn: -1 },
    );
    expect(() => verifyToken(expired, "user")).toThrow();
  });

  test("rechaza tokens manipulados", () => {
    const token = signUserToken({ sub: "507f1f77bcf86cd799439011" });
    expect(() => verifyToken(`${token}x`, "user")).toThrow();
  });
});

describe("ownership", () => {
  test("compara ObjectId y string", () => {
    expect(isOwner("507f1f77bcf86cd799439011", "507f1f77bcf86cd799439011")).toBe(true);
    expect(isOwner("507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012")).toBe(false);
  });
});

describe("SSRF", () => {
  test("detecta rangos privados IPv4", () => {
    for (const address of [
      "127.0.0.1",
      "10.0.0.5",
      "172.16.0.1",
      "192.168.1.1",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "224.0.0.1",
    ]) {
      expect(isPrivateAddress(address)).toBe(true);
    }
  });

  test("detecta rangos privados IPv6", () => {
    for (const address of ["::1", "::", "fc00::1", "fd12::1", "fe80::1", "::ffff:127.0.0.1"]) {
      expect(isPrivateAddress(address)).toBe(true);
    }
    expect(isPrivateAddress("8.8.8.8")).toBe(false);
    expect(isPrivateAddress("2001:4860:4860::8888")).toBe(false);
  });

  test("rechaza loopback, metadata y protocolos no http", async () => {
    await expect(assertSafeUrl("http://127.0.0.1/", ["127.0.0.1"])).rejects.toThrow();
    await expect(assertSafeUrl("http://169.254.169.254/", ["169.254.169.254"])).rejects.toThrow();
    await expect(assertSafeUrl("file:///etc/passwd", ["localhost"])).rejects.toThrow();
    await expect(assertSafeUrl("http://evil.example/", ["jkanime.net"])).rejects.toThrow();
  });

  test("acepta una IP pública dentro de la allowlist", async () => {
    const url = await assertSafeUrl("https://8.8.8.8/", ["8.8.8.8"]);
    expect(url.hostname).toBe("8.8.8.8");
  });
});

describe("validación", () => {
  test("rechaza emails inválidos y contraseñas cortas en signup", () => {
    expect(signupSchema.safeParse({ username: "ab", email: "no", password: "123" }).success).toBe(false);
    expect(signupSchema.safeParse({ username: "user_1", email: "a@b.co", password: "12345678" }).success).toBe(true);
  });

  test("login no impone longitud mínima (compatibilidad con cuentas viejas)", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });

  test("elimina campos desconocidos (anti mass assignment)", () => {
    const parsed = animeSchema.parse({
      name: "Test",
      views: 999999,
      likes: 999999,
      _id: "507f1f77bcf86cd799439011",
    });
    expect(parsed).not.toHaveProperty("views");
    expect(parsed).not.toHaveProperty("likes");
    expect(parsed).not.toHaveProperty("_id");
  });

  test("rechaza comentarios sin profileId válido", () => {
    expect(commentSchema.safeParse({ content: "hola", profileId: "nope" }).success).toBe(false);
  });
});
