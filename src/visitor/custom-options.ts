import { Options } from "selenium-webdriver/chrome";
import { Config, isDirExist, Logger, parseUserDir } from "../utils";
import * as path from "node:path";

/**
 * Extended class from Chrome Option connstructor.
 * Defines parameters for browser specified by user.
 */
export default class CustomOptions extends Options {
  private readonly logHeader = "ChromeOptions";

  constructor() {
    super();
    //@ts-ignore
    this.addArguments([
      "--disable-blink-features=AutomationControlled",
      // "--use-fake-ui-for-media-stream",
      "--hide-crash-restore-bubble",
      "--disable-notifications",
      "--maximized",
      /*
        testing params
      */
      // "--no-sandbox",
      // "--disable-gpu",
      // "--disable-infobars",
      // "--disable-extensions",
      // "--disable-setuid-sandbox",
      // "--disable-browser-side-navigation",
      // "--use-fake-device-for-media-stream",
      // "--disable-features=site-per-process",
      // "--disable-web-security",
      // "--allow-running-insecure-content",
      // "--window-size=1920,1080",
      // "--disable-application-cache",
    ]);

    const crxPath = path.resolve("dist", "recorder", "recorder.crx");
    Logger.printInfo(
      this.logHeader,
      `Loading recorder extension from ${crxPath}.`
    );
    this.addExtensions(crxPath);

    const userDataDirPath = Config.get("USER_DATA_DIR");
    if (userDataDirPath && isDirExist(userDataDirPath)) {
      const userDirData = parseUserDir(userDataDirPath);
      this.addArguments(`--user-data-dir=${userDirData.dir_path}`);
      this.addArguments(`--profile-directory=${userDirData.profile_name}`);
    } else {
      Logger.printFatal(
        this.logHeader,
        `User Data Directory does not exist by this path: ${userDataDirPath}`
      );
      process.exit(1);
    }

    if (Config.get("MINIMIZED", false) === "true") {
      Logger.printInfo(this.logHeader, "Running browser in background.");
    } else Logger.printInfo(this.logHeader, "Running browser in foreground.");

    if (Config.get("MUTE", false) === "true") {
      Logger.printInfo(this.logHeader, "Audio is muted.");
      this.addArguments("--mute-audio");
    } else {
      Logger.printInfo(this.logHeader, "Audio is unmuted.");
    }

    this.detachDriver(true);
  }
}
