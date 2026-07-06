/**
 * Start Next.js dev server from canonical path.
 * Fixes "multiple modules with names that only differ in casing" on Windows
 * when opening project with different casing (e.g. qc vs QC).
 *
 * Run with: npm run dev
 * Ensure you run from c:\runorx\mobile\QC\web or the canonical path.
 */
import { realpathSync } from "node:fs"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const webDir = join(__dirname, "..")
const realPath = realpathSync(webDir)

// Run Next.js with explicit directory to force consistent path casing.
// Use node directly (not npx) to avoid path resolution in a different cwd.
const nextBin = join(realPath, "node_modules", "next", "dist", "bin", "next")
const child = spawn(
  process.execPath,
  [nextBin, "dev", realPath, "-p", "3003", "-H", "0.0.0.0"],
  {
    stdio: "inherit",
    shell: false,
    cwd: realPath,
    env: { ...process.env, NEXT_PROJECT_DIR: realPath },
  }
)
child.on("exit", (code) => process.exit(code ?? 0))
