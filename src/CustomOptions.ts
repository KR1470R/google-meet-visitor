import { Options } from "selenium-webdriver/chrome";
import Config from "./Config";
import Logger from "./Logger";

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
      // "--disable-browser-side-navigation",
      // "--use-fake-device-for-media-stream",
      // "--disable-features=site-per-process",
      // "--disable-blink-features=AutomationControlled",
      // "--disable-web-security",
      // "--allow-running-insecure-content",
      // "--profile-directory=Default",
      "--remote-debugging-port=9292",
      "--user-data-dir=/home/kript/.config/google-chrome/Default",
      `--profile-directory=Default`,
    ]);
    if (Config.get_param("HEADLESS") === "true") {
      Logger.printInfo("running browser in background...");
      this.headless();
    } else Logger.printInfo("running browser in foreground");
    if (Config.get_param("MUTE") === "true") {
      Logger.printInfo("muted audio");
      this.addArguments("--mute-audio");
    }
  }
}
