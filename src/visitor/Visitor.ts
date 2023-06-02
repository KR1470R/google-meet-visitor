/* eslint-disable @typescript-eslint/no-var-requires */
import { Builder, WebDriver, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import CustomOptions from "./CustomOptions";
import Parser from "./Parser";
import Logger from "../utils/Logger";
import { setTimeout } from "node:timers/promises";
import pslist from "../lib/ps-list";
import {
  EVENTS,
  IVisitor,
  BrowserProcessNix,
  BrowserProcessWindows,
} from "../models/Models";
import {
  Events,
  minutesToMs,
  predictFinishDate,
  Socket,
  Config,
  timeoutWhileCondition,
  isFileExist,
  getRandomInt,
} from "../utils/Util";

/**
 * Visitor that performs such actions:
 *  - ask to join if required
 *  - join call;
 *  - mute all media devices if user specified such options;
 *  - visit call;
 *  - stay at call for a time specified by user.
 */
export default class Visitor implements IVisitor {
  private readonly log_header = "Visitor";

  private target_url: string;
  private driver!: WebDriver;
  private service!: chrome.ServiceBuilder;
  private options!: CustomOptions;
  private parser!: Parser;

  private pending_shutdown = false;
  private alive = false;
  private is_freezed = false;
  private is_joined_call = false;

  private browser_process!: BrowserProcessNix | BrowserProcessWindows;

  constructor(target_url: string) {
    this.target_url = target_url;

    this.options = new CustomOptions();
  }

  public async init_driver(webdriver_path: string) {
    try {
      if (!isFileExist(webdriver_path))
        throw new Error(
          `Webdriver executor does not exist on this path: ${webdriver_path}`
        );

      this.service = new chrome.ServiceBuilder(webdriver_path);
      this.driver = await new Builder()
        .forBrowser("chrome")
        .setChromeService(this.service)
        .setChromeOptions(this.options)
        .build();

      this.alive = true;

      this.browser_process = await this.getBrowserInstanceProcess();

      await this.minimize();

      this.parser = new Parser(this.driver);

      await this.provideLoginIsRequred();

      await this.canIJoinCall();

      await this.provideSocketPort();
    } catch (err) {
      throw err;
    }
  }

  public async start() {
    await this.sleep(2000);

    await this.start_call();

    this.sleep(1000);

    await this.leaveCall();

    Logger.printInfo(this.log_header, "Finished task successfully!");
    this.sleep(2000);
  }

  /**
   * Recognize is login require, if so, avait till user perform login (timeout 5min).
   */
  private async provideLoginIsRequred() {
    Logger.printInfo(
      this.log_header,
      "Checking is google account login required..."
    );

    await this.checkFreeze();

    await this.driver.get("https://apps.google.com/intl/en/meet/");

    const signInBtn = await this.parser.waitForElementWithInnerText(
      "a",
      "Sign In",
      5000,
      false
    );

    if (!signInBtn) {
      Logger.printInfo(this.log_header, "Already logined.");
      return Promise.resolve();
    }

    await signInBtn.click();

    const is_signed = await timeoutWhileCondition(
      (async () =>
        (
          await this.driver.getCurrentUrl()
        ).includes("https://meet.google.com/")).bind(this),
      10000,
      false
    );

    if (is_signed) {
      await this.driver.get(this.target_url);

      if (
        await (
          await this.driver.getCurrentUrl()
        ).includes("https://meet.google.com/")
      ) {
        Logger.printInfo(this.log_header, "Logined.");
        return Promise.resolve();
      }
    }

    Logger.printInfo(
      this.log_header,
      "Sign in required, waiting for 5 minutes untill the user perform login..."
    );

    await this.maximize();

    await timeoutWhileCondition(
      (async () =>
        (
          await this.driver.getCurrentUrl()
        ).includes("https://meet.google.com/")).bind(this),
      300000
    );

    await this.driver.get(this.target_url);

    Logger.printInfo(this.log_header, "Logined.");
  }

  /**
   * Check for window "You cannot join this call" or other else if call is blocked for user.
   * If user have no access - stop visitor and throw error to logs.
   */
  private async canIJoinCall() {
    Logger.printInfo(this.log_header, "Checking can i join call...");

    await this.checkFreeze();

    const returnToCall = await this.parser.waitFor(
      {
        xpath: "//*[contains(text(), 'Return to home screen')]/parent::button",
      },
      5000,
      false
    );
    if (returnToCall) {
      Events.emitCheckable(
        EVENTS.exit,
        "I cannot join this call!",
        this.log_header
      );
      await this.sleep(2000);
    } else return Promise.resolve();
  }

  /**
   * Disable user micro and videocam for call.
   */
  private async disableMediaDevices() {
    await this.checkFreeze();

    Logger.printInfo(this.log_header, "Disabling media devices at call...");

    const isCamMuted = Config.get_param("GMEET_CAM_MUTE", false) === "true";
    const isMicroMuted = Config.get_param("GMEET_MIC_MUTE", false) === "true";

    if (isCamMuted) {
      Logger.printInfo(this.log_header, "Disabling camera...");
      await this.driver
        .actions()
        .keyDown(Key.CONTROL)
        .sendKeys("e")
        .keyUp(Key.CONTROL)
        .perform();
      await this.sleep(1000);
    }

    if (isMicroMuted) {
      Logger.printInfo(this.log_header, "Disabling microphone...");

      await this.driver
        .actions()
        .keyDown(Key.CONTROL)
        .sendKeys("d")
        .keyUp(Key.CONTROL)
        .perform();
    }
  }

  /**
   * Makes all user actions to perfom join call.
   */
  private async start_call() {
    await this.checkFreeze();
    Logger.printInfo(this.log_header, `Starting call at ${this.target_url}...`);
    await this.disableMediaDevices();
    await this.sleep(2000);
    await this.joinCall();
    await this.sleep(2000);
    await this.stayAtCallWhile();
    await this.sleep(2000);
  }

  /**
   * Stay at call for specified time.
   * Prevents windows like "Are you here?" to stay at call.
   */
  private async stayAtCallWhile() {
    this.is_joined_call = true;
    await this.checkFreeze();

    const minutes = parseInt(Config.get_param("CALL_TIMER_MINUTES")!);
    if (Number.isNaN(minutes)) {
      Events.emitCheckable(
        EVENTS.exit,
        `Failed in parsing timer input: '${minutes}' is not a number!`,
        this.log_header
      );
    }

    Logger.printInfo(
      this.log_header,
      `Staying at call till ${predictFinishDate(
        minutesToMs(minutes)
      )}(${minutes} minute${minutes > 1 ? "s" : ""})`
    );

    let ms = minutesToMs(minutes);
    const timer_offset_ms = 1000;
    const timer_for_stay_call = 60000;

    while (ms >= 0) {
      if (ms >= timer_for_stay_call) {
        const timer_start = performance.now();
        const target_el = await this.parser.waitFor(
          {
            xpath: "//*[contains(text(), 'Stay in the call')]/parent::button",
          },
          timer_for_stay_call,
          false
        );
        if (target_el && until.stalenessOf(target_el)) {
          await this.sleep(2000);
          await target_el?.click();
        }
        const timer_end = performance.now();
        ms -= timer_end - timer_start;
      } else {
        await setTimeout(timer_offset_ms);
        ms -= timer_offset_ms;
      }
    }

    return Promise.resolve();
  }

  /**
   * Checks should user ask for join, if so - await till user get join access, otherwise join call.
   */
  private async joinCall() {
    await this.checkFreeze();

    Logger.printInfo(this.log_header, "Joining call...");

    const button_join = await this.parser.waitFor(
      {
        xpath: "//*[contains(text(), 'Join now')]/parent::button",
      },
      5000,
      false
    );

    if (button_join) {
      await this.sleep(2000);
      await button_join?.click();
      Logger.printInfo(this.log_header, "Joined!");
      this.is_joined_call = true;
    } else {
      Logger.printError(this.log_header, "Couldn't find join button!");
      Logger.printWarning(
        this.log_header,
        "Checking is user has permissions to join..."
      );
      await this.askToJoin();
    }
  }

  private async askToJoin() {
    await this.checkFreeze();

    const ask_to_join = await this.parser.waitFor(
      {
        xpath: "//*[contains(text(), 'Ask to join')]/parent::button",
      },
      2000,
      false
    );

    if (ask_to_join) {
      const timer_min = parseInt(
        Config.get_param("ASK_JOIN_WAIT_MIN", false) || "10"
      );

      Logger.printWarning(
        this.log_header,
        `Asked for join call. Waiting for ${timer_min} minutes.`
      );
      await ask_to_join.click();
      const leave_button = await this.parser.waitFor(
        {
          tagname: "button[aria-label='Leave call'][role=button]",
        },
        minutesToMs(timer_min),
        false
      );
      if (!leave_button) {
        Events.emitCheckable(
          EVENTS.exit,
          "Host didn't accepted your request to join call!",
          this.log_header
        );
        this.sleep(5000);
      } else Logger.printInfo(this.log_header, "Joined!");
    } else {
      Events.emitCheckable(
        EVENTS.exit,
        "Uknown error to join this call",
        this.log_header
      );
      this.sleep(2000);
    }
  }

  /**
   * Simple leaving call.
   */
  public async leaveCall() {
    Logger.printInfo(this.log_header, "Leaving call...");

    if (!this.is_joined_call) {
      Logger.printWarning(this.log_header, "Not at call, skipping");
      return;
    }

    const leave_button = await this.parser.getElementByTagName(
      "button[aria-label='Leave call'][role=button]"
    );

    await setTimeout(1000);
    await leave_button?.click();
  }

  /**
   * Send socket port to localstorage of current page.
   */
  private async provideSocketPort() {
    await this.checkFreeze();

    const server_port = Socket.getAddressKey("port");

    if (server_port) {
      Logger.printInfo(this.log_header, "Sending server port to extension");
      await this.driver.executeScript(
        `
        localStorage.setItem("recorder_port", ${String(server_port)});
        `
      );
    } else Logger.printWarning(this.log_header, "Server port is null");
  }

  public async minimize() {
    if (!this.alive || Config.get_param("MINIMIZED", false) !== "true") return;
    await this.resize();
    await this.driver.manage().window().minimize();
  }

  public async maximize() {
    if (!this.alive) return;
    await this.driver.manage().window().maximize();
  }

  public async resize() {
    await this.driver
      .manage()
      .window()
      .setRect({
        width: Math.max(
          parseInt(Config.get_param("WIDTH_PX", false) || "1000"),
          1000
        ),
        height: Math.max(
          parseInt(Config.get_param("HEIGHT_PX", false) || "800"),
          800
        ),
      });
  }

  public sleep(ms: number) {
    return this.driver.sleep(ms);
  }

  public async shutdown() {
    if (!this.alive || this.pending_shutdown) return;

    this.pending_shutdown = true;

    Logger.printInfo(this.log_header, "Shutdown.");

    process.kill(this.browser_process.pid);

    await this.driver.close();
    await this.driver.quit();
  }

  public freeze() {
    Logger.printWarning(this.log_header, "Freezed!");
    this.is_freezed = true;
  }

  public unfreeze() {
    Logger.printWarning(this.log_header, "Unfreezed!");
    this.is_freezed = false;
  }

  /**
   * Handle visitor freezing by:
   *  - waiting for random element on page
   *  - repeat untill is_freezed flag be equal false
   */
  private checkFreeze() {
    return new Promise<void>((resolve) => {
      const probe_interval = setInterval(async () => {
        if (!this.is_freezed) {
          clearInterval(probe_interval);
          resolve();
        } else {
          await this.parser.waitForElementWithInnerText.call(
            null,
            `${getRandomInt(0, 10000)}`,
            `${getRandomInt(0, 10000)}`,
            2000,
            false
          );
        }
      }, 3000);
    });
  }

  /**
   * Find out browser process where visitor is running.
   * @returns pid, ppid, name
   */
  private async getBrowserInstanceProcess() {
    const processes = await pslist();

    const [chromedriver_process] = processes.filter((process) =>
      process.name.toLowerCase().includes("chromedriver")
    );
    const [browser_process] = processes.filter((process) => {
      return (
        process.ppid === chromedriver_process.pid &&
        process.name.toLowerCase().includes("chrome")
      );
    });

    return browser_process;
  }
}
