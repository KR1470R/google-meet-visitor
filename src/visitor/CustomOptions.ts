import { Options } from "selenium-webdriver/chrome";
import Logger from "../utils/Logger";
import { Config, parseUserDir } from "../utils/Util";
import * as path from "node:path";

/**
 * Extended class from Chrome Option connstructor.
 * Defines parameters for browser specified by user.
 */
export default class CustomOptions extends Options {
  constructor() {
    super();
    //@ts-ignore
    this.addArguments([
      // "--no-sandbox",
      // "--disable-gpu",
      // "--disable-infobars",
      // "--disable-extensions",
      // "--disable-setuid-sandbox",
      "--use-fake-ui-for-media-stream",
      "--disable-notifications",
      // "--disable-browser-side-navigation",
      // "--use-fake-device-for-media-stream",
      // "--disable-features=site-per-process",
      "--disable-blink-features=AutomationControlled",
      // "--disable-web-security",
      // "--allow-running-insecure-content",
      // "--window-size=1920,1080",
      "--hide-crash-restore-bubble",
      // "--disable-application-cache",
    ]);

    const crx_path = path.resolve("dist", "recorder", "recorder.crx");
    Logger.printInfo(`Loading recorder extension from ${crx_path}`);
    this.addExtensions(crx_path);

    const user_data_dir_path = Config.get_param("USER_DATA_DIR");
    if (user_data_dir_path) {
      const user_dir_data = parseUserDir(user_data_dir_path);
      this.addArguments(`--user-data-dir=${user_dir_data.dir_path}`);
      this.addArguments(`--profile-directory=${user_dir_data.profile_name}`);
    }

    if (Config.get_param("MINIMIZED", false) === "true") {
      Logger.printInfo("running browser in background...");
    } else Logger.printInfo("running browser in foreground");

    if (Config.get_param("MUTE", false) === "true") {
      Logger.printInfo("muted audio");
      this.addArguments("--mute-audio");
    }
  }
}
