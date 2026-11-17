/**
 * MediCore — master test orchestrator (web structure + API full suite)
 * Usage: node scripts/test-all.mjs
 * Env: API_BASE_URL=http://localhost:8080/api/v1
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function run(label, command, args, cwd = root) {
  return new Promise((resolve) => {
    console.log(`\n>>>>>> ${label}`);
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    child.on("close", (code) => resolve({ label, code: code ?? 1 }));
  });
}

const jobs = [];

async function main() {
  console.log("MediCore full test orchestrator");
  jobs.push(await run("WEB roles/structure", "node", ["scripts/test-frontend-roles.mjs"]));
  jobs.push(await run("API full suite", "node", ["apps/api-e2e/test-api-full.mjs"]));
  jobs.push(await run("API e2e smoke", "node", ["apps/api-e2e/run-role-smoke.mjs"]));

  // Flutter if available
  jobs.push(
    await run("MOBILE flutter test", "flutter", ["test"], path.join(root, "apps", "mobile"))
  );

  console.log("\n================ SUMMARY ================");
  let failed = 0;
  for (const j of jobs) {
    const ok = j.code === 0;
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${j.label} (exit ${j.code})`);
  }
  console.log("=========================================\n");
  process.exit(failed > 0 ? 1 : 0);
}

main();
