import { Options } from "selenium-webdriver/chrome";
import Logger from "../utils/Logger";
import { Config, isDirExist, parseUserDir } from "../utils/Util";
import * as path from "node:path";

/**
 * Extended class from Chrome Option connstructor.
 * Defines parameters for browser specified by user.
 */
export default class CustomOptions extends Options {
  private readonly log_header = "ChromeOptions";

  constructor() {
    super();
    //@ts-ignore
    this.addArguments([
      "--disable-blink-features=AutomationControlled",
      "--use-fake-ui-for-media-stream",
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

    const crx_path = path.resolve("dist", "recorder", "recorder.crx");
    Logger.printInfo(
      this.log_header,
      `Loading recorder extension from ${crx_path}.`
    );
    this.addExtensions(crx_path);

    const user_data_dir_path = Config.get_param("USER_DATA_DIR");
    if (user_data_dir_path && isDirExist(user_data_dir_path)) {
      const user_dir_data = parseUserDir(user_data_dir_path);
      this.addArguments(`--user-data-dir=${user_dir_data.dir_path}`);
      this.addArguments(`--profile-directory=${user_dir_data.profile_name}`);
    } else {
      Logger.printFatal(
        this.log_header,
        `User Data Directory does not exist by this path: ${user_data_dir_path}`
      );
      process.exit(1);
    }

    if (Config.get_param("MINIMIZED", false) === "true") {
      Logger.printInfo(this.log_header, "Running browser in background.");
    } else Logger.printInfo(this.log_header, "Running browser in foreground.");

    if (Config.get_param("MUTE", false) === "true") {
      Logger.printInfo(this.log_header, "Audio is muted.");
      this.addArguments("--mute-audio");
    } else {
      Logger.printInfo(this.log_header, "Audio is unmuted.");
    }
  }
}
