import ChromeExtension from "crx";
import crypto from "node:crypto";
import * as path from "node:path";
import * as fs from "node:fs";

/**
 * Build Google Chrome Extension of Visitor Recorder.
 */
try {
  const privateKeyPath = path.resolve(__dirname, "recorder", "key.pem");

  // @ts-ignore
  const privateKey = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  }).privateKey;

  fs.writeFileSync(privateKeyPath, privateKey);

  const crx = new ChromeExtension({
    codebase: "http://localhost:8000/recorder_extension.crx",
    privateKey: fs.readFileSync(privateKeyPath),
  });

  const sourceCrxPath = path.resolve(__dirname, "recorder", "extension");
  const outputCrxPath = path.resolve(__dirname, "recorder", "recorder.crx");

  console.log(`packing extension from ${sourceCrxPath}...`);
  crx
    .load(sourceCrxPath)
    .then((crx: typeof ChromeExtension) => crx.pack())
    .then((crxBuffer: Buffer) => {
      fs.writeFileSync(outputCrxPath, crxBuffer);
      console.log("recorder extension packed successfully!");
    })
    .catch((err: Error) => {
      throw err;
    });
} catch (err) {
  console.log("Failed to pack recorder extension: ", (err as Error).message);
  process.exit(1);
}
