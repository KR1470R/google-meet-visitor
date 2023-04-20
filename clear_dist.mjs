import fs from "node:fs";
import path from "node:path";

const dist_path = path.resolve("dist");

function createRecords() {
  const abs_path = path.resolve("dist", "records");
  if (fs.existsSync(abs_path)) return;
  fs.mkdirSync(abs_path);
}

try {
  console.log("Checking for dist directory...");
  if (fs.existsSync(dist_path)) {
    const files = fs.readdirSync(dist_path);
    for (const file of files) {
      const abs_path = path.resolve("dist", file);
      if (file === "records") continue;
      if (fs.lstatSync(abs_path).isDirectory())
        fs.rmSync(abs_path, { recursive: true });
      else fs.rmSync(abs_path);
    }
    createRecords();
  } else {
    fs.mkdirSync(dist_path);
    createRecords();
  }
} catch (err) {
  console.log(`Error in clearing dist directory: ${err.message}`);
}
