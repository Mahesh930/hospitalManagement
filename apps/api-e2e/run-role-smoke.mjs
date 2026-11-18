/**
 * Lightweight Node smoke: login admin + fetch /roles/catalog
 * Requires API at NEXT_PUBLIC_API_URL or http://localhost:8080/api/v1
 */
const base = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://localhost:8080/api/v1";

async function main() {
  const loginRes = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  if (!loginRes.ok) {
    console.error(`SKIP/FAIL: login ${loginRes.status} @ ${base}`);
    process.exit(loginRes.status === 0 ? 0 : 1);
  }
  const login = await loginRes.json();
  const jwt = login.jwt;
  if (!jwt) {
    console.error("FAIL: no jwt in login response");
    process.exit(1);
  }
  const catalogRes = await fetch(`${base}/roles/catalog`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const catalog = await catalogRes.json();
  const count = catalog?.data?.length ?? 0;
  console.log(`PASS: admin login + roles catalog (${count} roles)`);
}

main().catch((err) => {
  console.error("SKIP/FAIL:", err.message);
  process.exit(1);
});
