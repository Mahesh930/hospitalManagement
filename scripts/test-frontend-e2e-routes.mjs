/**
 * MediCore Hospital ERP — Live Frontend HTTP E2E Routes Test
 * 
 * Launches Next.js production server on port 3005, verifies every single
 * role station page returns HTTP 200/307 OK and valid HTML payload,
 * then cleanly terminates the server.
 */

import { spawn } from "child_process";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminWebDir = path.resolve(__dirname, "..", "apps", "web-admin");
const TEST_PORT = 3005;
const BASE_URL = `http://localhost:${TEST_PORT}`;

const ROUTES_TO_TEST = [
  // Authentication & Home
  { path: "/login", expected: [200] },
  { path: "/", expected: [200, 307, 308] },
  
  // Dashboard & Stations
  { path: "/dashboard", expected: [200] },
  { path: "/stations", expected: [200] },
  { path: "/stations/accountant", expected: [200] },
  { path: "/stations/radiologist", expected: [200] },
  { path: "/stations/lab-manager", expected: [200] },
  { path: "/stations/tpa-insurance", expected: [200] },
  { path: "/stations/mrd", expected: [200] },
  { path: "/stations/blood-bank", expected: [200] },
  { path: "/stations/ot-coordinator", expected: [200] },
  { path: "/stations/anesthetist", expected: [200] },
  { path: "/stations/physiotherapist", expected: [200] },
  { path: "/stations/hr-admin", expected: [200] },
  { path: "/stations/quality", expected: [200] },

  // Doctor & Clinical OPD
  { path: "/opd", expected: [200] },
  { path: "/doctor/ipd", expected: [200] },
  { path: "/doctor/investigations", expected: [200] },
  { path: "/doctor/profile", expected: [200] },

  // Cashier & Billing
  { path: "/billing", expected: [200] },

  // Laboratory Station
  { path: "/laboratory", expected: [200] },

  // Nurse Station
  { path: "/nurse", expected: [200] },
  { path: "/nurse/beds", expected: [200] },
  { path: "/nurse/emar", expected: [200] },
  { path: "/nurse/fluid-balance", expected: [200] },
  { path: "/nurse/tasks", expected: [200] },
  { path: "/nurse/assessments", expected: [200] },
  { path: "/nurse/handover", expected: [200] },

  // Pharmacy Station
  { path: "/pharmacy", expected: [200] },
  { path: "/pharmacy/queue", expected: [200] },
  { path: "/pharmacy/inventory", expected: [200] },
  { path: "/pharmacy/purchases", expected: [200] },
  { path: "/pharmacy/returns", expected: [200] },
  { path: "/pharmacy/expiry", expected: [200] },
  { path: "/pharmacy/handover", expected: [200] },
  { path: "/pharmacy/reports", expected: [200] },

  // Receptionist Desk
  { path: "/reception", expected: [200] },
  { path: "/reception/queue", expected: [200] },
  { path: "/reception/registration", expected: [200] },
  { path: "/reception/coordination", expected: [200] },
  { path: "/reception/handover", expected: [200] },
  { path: "/reception/reports", expected: [200] },
  { path: "/reception/vitals", expected: [200] },

  // Common Patients & Appointments
  { path: "/patients", expected: [200] },
  { path: "/patients/register", expected: [200] },
  { path: "/appointments", expected: [200] },
  { path: "/appointments/queue", expected: [200] },

  // Super Admin & Operations
  { path: "/super-admin/hospitals", expected: [200] },
  { path: "/super-admin/hospitals/onboard", expected: [200] },
  { path: "/super-admin/user-operations", expected: [200] },
  { path: "/super-admin/feature-flags", expected: [200] },
  { path: "/super-admin/subscriptions", expected: [200] },

  // Settings & Masters
  { path: "/settings/hospital", expected: [200] },
  { path: "/settings/departments", expected: [200] },
  { path: "/settings/audit-logs", expected: [200] },
  { path: "/master-data/medicines", expected: [200] },
  { path: "/master-data/diagnoses", expected: [200] },
  { path: "/master-data/charges", expected: [200] },
];

function fetchUrl(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${urlPath}`, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, body });
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetchUrl("/login");
      if (res.statusCode === 200) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function run() {
  console.log("========================================================");
  console.log(`Starting Next.js production server on port ${TEST_PORT}...`);
  console.log("========================================================\n");

  const serverProc = spawn("cmd.exe", ["/c", "pnpm", "exec", "next", "start", "-p", String(TEST_PORT)], {
    cwd: adminWebDir,
    stdio: "pipe",
    env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: "production" }
  });

  serverProc.stdout.on("data", (d) => {
    // console.log("[Next]:", d.toString().trim());
  });

  serverProc.stderr.on("data", (d) => {
    // console.error("[Next-Err]:", d.toString().trim());
  });

  const ready = await waitForServer();
  if (!ready) {
    console.error("Failed to connect to Next.js production server within 15 seconds.");
    serverProc.kill("SIGKILL");
    process.exit(1);
  }

  console.log(`Next.js server is LIVE at ${BASE_URL}!\nTesting all ${ROUTES_TO_TEST.length} role station routes...\n`);

  let passed = 0;
  let failed = 0;

  for (const route of ROUTES_TO_TEST) {
    try {
      const res = await fetchUrl(route.path);
      const isExpected = route.expected.includes(res.statusCode);
      if (isExpected && res.body.length > 50) {
        passed++;
        console.log(`  \x1b[32m✔ PASS\x1b[0m [${res.statusCode}] ${route.path} (${Math.round(res.body.length / 1024)} KB)`);
      } else {
        failed++;
        console.error(`  \x1b[31m✖ FAIL\x1b[0m [${res.statusCode}] ${route.path} (expected ${route.expected.join(",")})`);
      }
    } catch (err) {
      failed++;
      console.error(`  \x1b[31m✖ FAIL\x1b[0m [ERR] ${route.path}: ${err.message}`);
    }
  }

  console.log("\n========================================================");
  console.log(`  Live E2E Route Results: ${passed} Passed, ${failed} Failed (Total ${ROUTES_TO_TEST.length})`);
  console.log("========================================================\n");

  // Gracefully terminate child process and its tree on Windows
  spawn("taskkill", ["/pid", String(serverProc.pid), "/f", "/t"]);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();
