import { exec } from "node:child_process";
import { fetch } from "undici";
import * as fs from "node:fs";
import * as path from "node:path";
import Logger from "../utils/Logger";
import { getDriverPlatformName, modeNum, binary_windize } from "../utils/Util";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const StreamZip = require("node-stream-zip");

export default class WebDriverManager {
  public chromedriver_name = getDriverPlatformName();
  public chromedriver_path: string;

  constructor() {
    if (!this.chromedriver_name) this.throwError("Uncompatible platform!");
    this.chromedriver_path = path.resolve(
      "src",
      "drivers",
      this.chromedriver_name!
    );
  }

  public isWebDriverInstalled() {
    if (!this.chromedriver_path) return false;
    return fs.existsSync(this.chromedriver_path);
  }

  public async downloadChromeDriver() {
    if (this.isWebDriverInstalled()) {
      Logger.printInfo("required chromedriver is exist. skipping");
      return;
    }

    const url = "https://chromedriver.storage.googleapis.com/";
    Logger.printInfo("trying to find chromedriver with your google chrome...");
    const target_version = await this.getLatestChromeVersion();
    const response = await fetch(
      `${url}${target_version}/${this.chromedriver_name}.zip`
    );
    if (response.status !== 200) {
      this.throwError(
        `Error in fetching zip archive! Status Code: ${response.status}`
      );
    }

    Logger.printInfo(
      "downloading zip of webdriver compatible with your browser..."
    );
    const zip_buffer = Buffer.from(await response.arrayBuffer());
    const zip_path = path.resolve(
      "src",
      "drivers",
      `chromedriver_${target_version!.replace(/\./g, "_")}.zip`
    );
    fs.writeFileSync(zip_path, zip_buffer);

    await this.extractZip(zip_path);
  }

  private extractZip(zip_path: string) {
    const zip_stream = new StreamZip({ file: zip_path, storeEntries: true });

    return new Promise<void>((resolve) => {
      const on_rename = (err: Error | null) => {
        if (err) this.throwError(String(err));
        else {
          fs.chmod(
            this.chromedriver_path,
            modeNum("777", "744")!,
            (err: Error | null) => {
              if (err) this.throwError(String(err));
              else {
                Logger.printSuccess("finished successfully!");
                resolve();
              }
            }
          );
        }
      };
      const on_extract = (error: Error | null) => {
        if (error) this.throwError(`ZipExtractError: ${error}`);
        else {
          zip_stream.close();
          fs.rmSync(zip_path);
          fs.rename(
            path.resolve("src", "drivers", binary_windize("chromedriver")),
            this.chromedriver_path,
            on_rename
          );
        }
      };
      zip_stream.on("ready", () => {
        Logger.printInfo("extracting zip...");
        zip_stream.extract(null, path.resolve("src", "drivers"), on_extract);
      });
      zip_stream.on("error", (error: Error) => {
        zip_stream.close();
        this.throwError(String(error));
      });
    });
  }

  private getChromeVersion() {
    return new Promise<string>((resolve, reject) => {
      exec(
        "google-chrome-stable --version",
        (err: Error | null, stdout: string, stderr: string) => {
          if (err) {
            reject(err);
            return;
          }
          if (stderr) {
            reject(new Error(stderr));
            return;
          }
          const parsed = stdout.match(/(\d+\.\d+\.\d+)/gm);
          if (!parsed) {
            reject(new Error(`Failed to parse the version: ${stdout}`));
            return;
          }
          resolve(parsed![0]);
        }
      );
    });
  }

  private async getLatestChromeVersion() {
    try {
      const url = "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_";
      const base_version = await this.getChromeVersion();
      const full_version = await (await fetch(`${url}${base_version}`)).text();
      return full_version;
    } catch (err) {
      return this.throwError(String(err));
    }
  }

  private throwError(error: string) {
    Logger.printError(error);
    process.exit(1);
  }
}
