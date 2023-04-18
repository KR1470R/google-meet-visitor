/* eslint-disable @typescript-eslint/no-var-requires */
const ChromeExtension = require("crx");
const crypto = require("node:crypto");
const path = require("node:path");
const fs = require("node:fs");

try {
  const private_key_path = path.resolve(
    __dirname,
    "src",
    "recorder",
    "extension",
    "key.pem"
  );

  const private_key = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  }).privateKey;

  fs.writeFileSync(private_key_path, private_key);

  const crx = new ChromeExtension({
    codebase: "http://localhost:8000/recorder_extension.crx",
    privateKey: fs.readFileSync(private_key_path),
  });

  const source_crx_path = path.resolve(
    __dirname,
    "src",
    "recorder",
    "extension/"
  );
  const output_crx_path = path.resolve(
    __dirname,
    "dist",
    "recorder_extension",
    "recorder.crx"
  );

  console.log(`packing extension from ${source_crx_path}...`);
  crx
    .load(source_crx_path)
    .then((crx) => crx.pack())
    .then((crxBuffer) => {
      fs.writeFileSync(output_crx_path, crxBuffer);
    })
    .catch((err) => {
      throw err;
    });
} catch (err) {
  console.log("Failed to pack recorder extension: ", err.message);
  process.exit(1);
}
