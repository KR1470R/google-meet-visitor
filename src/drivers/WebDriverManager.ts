import * as fs from "node:fs";
import * as path from "node:path";
import Logger from "../utils/Logger";
import getChromeVersion from "find-chrome-version";
import StreamZip from "node-stream-zip";
import { getDriverPlatformName, modeNum, binary_windize } from "../utils/Util";

export default class WebDriverManager {
  public chromedriver_name = getDriverPlatformName() as string;
  public chromedriver_path!: string;
  public file_name!: string;

  constructor() {
    if (!this.chromedriver_name) this.throwError("Uncompatible platform!");
  }

  public async init() {
    const version = (await this.getChromeVersion()).replace(/\./g, "-");
    this.file_name = this.chromedriver_name + "_" + version;
    this.chromedriver_path = path.resolve("src", "drivers", this.file_name!);
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
    const target_version = await this.getLatestChromeVersion();
    const zip_url = `${url}${target_version}/${this.chromedriver_name}.zip`;
    Logger.printInfo(
      `Trying to fetch zip with chromedriver of your chrome version ${zip_url}...`
    );
    const response = await fetch(zip_url);
    if (response.status !== 200) {
      this.throwError(
        `Error in fetching zip archive! Status Code: ${response.status}`
      );
    }

    Logger.printInfo("downloading...");
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
            binary_windize(this.chromedriver_path),
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

  private async getChromeVersion() {
    const full_version = await getChromeVersion();
    const parsed = full_version.match(/(\d+\.\d+\.\d+)/gm);
    if (!parsed) throw new Error(`Failed to parse the version: ${parsed}`);
    return parsed![0];
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
