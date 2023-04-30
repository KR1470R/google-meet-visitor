import ChromeExtension from "crx";
import crypto from "node:crypto";
import * as path from "node:path";
import * as fs from "node:fs";

/**
 * Build Google Chrome Extension of Visitor Recorder.
 */
try {
  const private_key_path = path.resolve(__dirname, "recorder", "key.pem");

  // @ts-ignore
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

  const source_crx_path = path.resolve(__dirname, "recorder", "extension");
  const output_crx_path = path.resolve(__dirname, "recorder", "recorder.crx");

  console.log(`packing extension from ${source_crx_path}...`);
  crx
    .load(source_crx_path)
    .then((crx: typeof ChromeExtension) => crx.pack())
    .then((crxBuffer: Buffer) => {
      fs.writeFileSync(output_crx_path, crxBuffer);
      console.log("recorder extension packed successfully!");
    })
    .catch((err: Error) => {
      throw err;
    });
} catch (err) {
  console.log("Failed to pack recorder extension: ", (err as Error).message);
  process.exit(1);
}
