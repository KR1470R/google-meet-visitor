import * as fs from "node:fs";
import * as path from "node:path";
import Logger from "../utils/Logger";
import getChromeVersion from "find-chrome-version";
import StreamZip from "node-stream-zip";
import {
  getDriverPlatformName,
  modeNum,
  binary_windize,
  getPlatformRaw,
} from "../utils/Util";
import { IWebDriverManager } from "../models/Models";

/**
 * Manager for webdriver. Performs:
 *  0. Gets version of user's google chrome.
 *  1. Fetches zip of webdriver of fetched version.
 *  2. Extracts zip.
 *  3. Renames webdriver binary to a name so it will indicate
 *     preinstalled driver for the next run of the program.
 *  4. Removes extra files.
 */
export default class WebDriverManager implements IWebDriverManager {
  private readonly log_header = "WebDriverManager";
  private chromedriver_name = getDriverPlatformName() as string;
  private chrome_version!: string;
  private file_name!: string;
  public chromedriver_path!: string;
  private isNewer!: boolean;

  constructor() {
    if (!this.chromedriver_name) this.throwError("Uncompatible platform!");
  }

  public async init() {
    this.chrome_version = await this.getUserChromeVersion();
    this.file_name =
      this.chromedriver_name + "_" + this.chrome_version.replace(/\./g, "-");
    this.chromedriver_path = binary_windize(
      path.resolve(__dirname, "drivers", this.file_name!)
    );
  }

  public isWebDriverInstalled() {
    if (!this.chromedriver_path) return false;
    return fs.existsSync(this.chromedriver_path);
  }

  public async getChromedriverUrl() {
    try {
      try {
        const target_version = await this.getLatestChromeVersionFromAPI();
        this.isNewer = false;
        return `https://chromedriver.storage.googleapis.com/${target_version}/${this.chromedriver_name.replace(
          /\-/g,
          "_"
        )}.zip`;
      } catch (err) {
        const target_version =
          await this.getLatestChromeVersionForNewerVersionsFromAPI();
        this.isNewer = true;
        return `https://storage.googleapis.com/chrome-for-testing-public/${target_version}/${getPlatformRaw()}/${
          this.chromedriver_name
        }.zip`;
      }
    } catch (err) {
      return this.throwError(String(err));
    }
  }

  public async provideChromeDriver() {
    if (this.isWebDriverInstalled()) {
      Logger.printInfo(
        this.log_header,
        `Using chromedriver at path: ${this.chromedriver_path}`
      );

      return;
    }

    const zip_url = (await this.getChromedriverUrl()) as string;

    Logger.printInfo(
      this.log_header,
      `Trying to fetch zip with chromedriver of your chrome version ${zip_url}...`
    );
    const response = await fetch(zip_url);
    if (response.status !== 200) {
      this.throwError(
        `Error in fetching zip archive! Status Code: ${response.status}`
      );
    }

    Logger.printInfo(this.log_header, "Downloading...");
    const zip_buffer = Buffer.from(await response.arrayBuffer());
    const zip_path = path.resolve(
      __dirname,
      "drivers",
      `chromedriver_${this.chrome_version!.replace(/\./g, "_")}.zip`
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
                Logger.printInfo(this.log_header, "Finished successfully!");
                resolve();
              }
            }
          );
        }
      };
      const on_extract = (error: Error | null) => {
        if (error) this.throwError(`Error in extraction zip: ${error}`);
        else {
          zip_stream.close();
          fs.rmSync(zip_path);
          fs.rename(
            path.resolve(
              __dirname,
              "drivers",
              this.isNewer ? this.chromedriver_name : "",
              binary_windize("chromedriver")
            ),
            this.chromedriver_path,
            on_rename
          );
        }
      };
      zip_stream.on("ready", () => {
        Logger.printInfo(this.log_header, "Extracting zip...");
        zip_stream.extract(
          null,
          path.resolve(__dirname, "drivers"),
          on_extract
        );
      });
      zip_stream.on("error", (error: Error) => {
        zip_stream.close();
        this.throwError(String(error));
      });
    });
  }

  private async getUserChromeVersion() {
    const full_version = await getChromeVersion();
    const parsed = full_version.match(/(\d+\.\d+\.\d+)/gm);
    if (!parsed) throw new Error(`Failed to parse the version: ${parsed}`);
    return parsed![0];
  }

  private async getLatestChromeVersionFromAPI() {
    const url = "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_";
    const full_version = await (
      await fetch(`${url}${this.chrome_version}`)
    ).text();
    if (/^\d+(\.\d+)*$/.test(full_version)) return full_version;
    throw new Error(
      `Not found latest version of "${this.chrome_version}" from older repository: ${full_version}`
    );
  }

  private async getLatestChromeVersionForNewerVersionsFromAPI() {
    try {
      const url =
        "https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_";
      const full_version = await (
        await fetch(`${url}${this.chrome_version}`)
      ).text();
      if (/^\d+(\.\d+)*$/.test(full_version)) return full_version;
      throw new Error(
        `Not found latest version of "${this.chrome_version}" from newer repository: ${full_version}`
      );
    } catch (err) {
      return this.throwError(String(err));
    }
  }

  private throwError(error: string) {
    Logger.printFatal(this.log_header, error);
    process.exit(1);
  }
}
