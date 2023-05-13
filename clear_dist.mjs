import fs from "node:fs";
import path from "node:path";

const dist_path = path.resolve("dist");

const white_list_folders = ["records", "vendor", "drivers"];

function createMainFolders() {
  for (const folder of white_list_folders) {
    const abs_path = path.resolve("dist", folder);
    if (fs.existsSync(abs_path)) continue;
    fs.mkdirSync(abs_path);
  }
}

try {
  console.log("Checking for dist directory...");
  if (fs.existsSync(dist_path)) {
    const files = fs.readdirSync(dist_path);
    for (const file of files) {
      const abs_path = path.resolve("dist", file);
      if (white_list_folders.includes(file)) continue;
      if (fs.lstatSync(abs_path).isDirectory())
        fs.rmSync(abs_path, { recursive: true });
      else fs.rmSync(abs_path);
    }
    createMainFolders();
  } else {
    fs.mkdirSync(dist_path);
    createMainFolders();
  }
} catch (err) {
  console.log(`Error in clearing dist directory: ${err.message}`);
}
