import fs from "node:fs";
import path from "node:path";

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/.test(version)) {
  console.error("Usage: node scripts/bump_versions.mjs <semver>");
  process.exit(2);
}

const repoRoot = process.cwd();

const readText = (filePath) => {
  const abs = path.join(repoRoot, filePath);
  return fs.readFileSync(abs, "utf8");
};

const writeTextIfChanged = (filePath, next) => {
  const abs = path.join(repoRoot, filePath);
  const prev = fs.readFileSync(abs, "utf8");
  if (prev === next) return false;
  fs.writeFileSync(abs, next);
  return true;
};

const bumpManifestVersion = (filePath) => {
  const raw = readText(filePath);
  const re = /"version"\s*:\s*"[^"]*"/;
  if (!re.test(raw)) {
    throw new Error(`Could not find a \"version\" field in ${filePath}`);
  }
  const updated = raw.replace(re, `"version": "${version}"`);
  writeTextIfChanged(filePath, updated);
};

const bumpAddonYamlVersion = (filePath) => {
  const raw = readText(filePath);
  const re = /^version:\s*("?)[^"\r\n]+\1[ \t]*$/m;
  if (!re.test(raw)) {
    throw new Error(`Could not find a version: line in ${filePath}`);
  }
  const updated = raw.replace(re, `version: "${version}"`);
  writeTextIfChanged(filePath, updated);
};

try {
  bumpManifestVersion("custom_components/sunflow/manifest.json");
  bumpAddonYamlVersion("sunflow/config.yaml");
  console.log(`Bumped versions to ${version}`);
} catch (err) {
  console.error(String(err?.message || err));
  process.exit(1);
}
