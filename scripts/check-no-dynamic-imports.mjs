import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "lib", "export");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.isFile() && (p.endsWith(".ts") || p.endsWith(".tsx"))) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
let ok = true;

for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  const lines = s.split("\n");
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip comment lines
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
    
    // Check for import( patterns
    if (line.includes("import(")) {
      // Check for template strings or variables in import()
      const hasTemplateString = line.includes("import(`") || line.includes('import("${') || line.includes("import(`${");
      const hasVariable = /import\s*\(\s*[a-zA-Z_$]/.test(line);
      const hasConcat = /import\s*\(\s*[^"]+\s*\+/.test(line);
      
      // Allow static string imports: import("@/lib/...") or import("next-intl/server")
      const isStaticString = /import\s*\(\s*["'][@\.\/\w-]+["']\s*\)/.test(line);
      
      if ((hasTemplateString || hasVariable || hasConcat) && !isStaticString) {
        const relativePath = path.relative(process.cwd(), f);
        console.error(`[FAIL] Dynamic import found in ${relativePath}:${i + 1}`);
        console.error(`  ${trimmed}`);
        ok = false;
      }
    }
  }
}

if (!ok) {
  console.error("\n[FAIL] Dynamic imports detected. All imports must use static string literals.");
  console.error("Example: await import(\"@/lib/export/monthly/pdf-generator\")");
  console.error("Not allowed: await import(`@/lib/${path}/module`)");
  process.exit(1);
}

console.log(`[OK] No dynamic imports in ${files.length} export files`);

