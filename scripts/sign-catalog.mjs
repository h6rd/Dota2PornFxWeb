import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = "assets/data";
const SIG_DIR = "assets/signatures";

function main() {
  const privateKeyPem = process.env.CATALOG_PRIVATE_KEY;
  if (!privateKeyPem) {
    console.error("::error::CATALOG_PRIVATE_KEY is not set");
    process.exit(1);
  }

  const key = crypto.createPrivateKey(privateKeyPem);

  fs.mkdirSync(SIG_DIR, { recursive: true });

  // sign every file
  for (const name of fs.readdirSync(DATA_DIR)) {
    if (!name.endsWith(".json")) continue;

    const file = path.join(DATA_DIR, name);
    const sigFile = path.join(SIG_DIR, `${name}.sig`);

    const signature = crypto.sign(null, fs.readFileSync(file), key);
    fs.writeFileSync(sigFile, `${signature.toString("base64")}\n`);

    console.log(`signed ${name}`);
  }

  // remove sig for files that no longer exist
  for (const sigName of fs.readdirSync(SIG_DIR)) {
    if (!sigName.endsWith(".json.sig")) continue;

    const dataName = sigName.slice(0, -".sig".length);
    const sigPath = path.join(SIG_DIR, sigName);

    if (!fs.existsSync(path.join(DATA_DIR, dataName))) {
      console.log(`Removing obsolete signature: ${sigPath}`);
      fs.unlinkSync(sigPath);
    }
  }
}

main();
