/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("node:fs");
const path = require("node:path");
const ChromeExtension = require("crx");

try {
  const crx = new ChromeExtension({
    codebase: "http://localhost:8000/recorder_extension.crx",
    privateKey: fs.readFileSync(
      path.resolve(__dirname, "src", "recorder", "extension", "key.pem")
    ),
  });

  const source_crx_path = path.resolve(
    __dirname,
    "../src",
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
    .then((crx: { pack: () => any }) => crx.pack())
    .then((crxBuffer: Buffer) => {
      fs.writeFileSync(output_crx_path, crxBuffer);
    })
    .catch((err: Error) => {
      throw err;
    });
} catch (err) {
  console.log(`Failed to pack recorder extension: ${(err as Error).message}`);
  process.exit(1);
}
