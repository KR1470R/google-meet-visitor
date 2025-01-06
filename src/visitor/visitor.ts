/* eslint-disable @typescript-eslint/no-var-requires */
import { Builder, Key, until, WebDriver } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import CustomOptions from "./custom-options";
import Parser from "./parser";
import {
  Config,
  Events,
  getRandomInt,
  isFileExist,
  Logger,
  minutesToMs,
  predictFinishDate,
  Socket,
  timeoutWhileCondition,
} from "../utils";
import { setTimeout } from "node:timers/promises";
import pslist from "../libs/ps-list";
import { BrowserProcessNix, BrowserProcessWindows } from "../types";
import { EVENTS } from "../constants";
import { IVisitor } from "./interfaces";

/**
 * Visitor that performs such actions:
 *  - ask to join if required
 *  - join call;
 *  - mute all media devices if user specified such options;
 *  - visit call;
 *  - stay at call for a time specified by user.
 */
export default class Visitor implements IVisitor {
  private readonly logHeader = "Visitor";

  private targetUrl: string;
  private driver!: WebDriver;
  private service!: chrome.ServiceBuilder;
  private options!: CustomOptions;
  private parser!: Parser;

  private pendingShutdown = false;
  private alive = false;
  private isFroze = false;
  private isJoinedCall = false;

  private browserProcess!: BrowserProcessNix | BrowserProcessWindows;

  constructor(target_url: string) {
    this.targetUrl = target_url;

    this.options = new CustomOptions();
  }

  public async initDriver(webdriverPath: string) {
    try {
      if (!isFileExist(webdriverPath))
        throw new Error(
          `Webdriver executor does not exist on this path: ${webdriverPath}`
        );

      this.service = new chrome.ServiceBuilder(webdriverPath);
      this.driver = await new Builder()
        .forBrowser("chrome")
        .setChromeService(this.service)
        .setChromeOptions(this.options)
        .build();

      this.alive = true;

      this.browserProcess = await this.getBrowserInstanceProcess();

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

    await this.startCall();

    this.sleep(1000);

    await this.leaveCall();

    Logger.printInfo(this.logHeader, "Finished task successfully!");
    this.sleep(2000);
  }

  /**
   * Simple leaving call.
   */
  public async leaveCall() {
    Logger.printInfo(this.logHeader, "Leaving call...");

    if (!this.isJoinedCall) {
      Logger.printWarning(this.logHeader, "Not at call, skipping");
      return;
    }

    const leave_button = await this.parser.getElementByTagName(
      "button[aria-label='Leave call'][role=button]"
    );

    await setTimeout(1000);
    await leave_button?.click();
  }

  public async minimize() {
    if (!this.alive || Config.get("MINIMIZED", false) !== "true") return;

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
          parseInt(Config.get("WIDTH_PX", false) || "1000"),
          1000
        ),
        height: Math.max(
          parseInt(Config.get("HEIGHT_PX", false) || "800"),
          800
        ),
      });
  }

  public sleep(ms: number) {
    return this.driver.sleep(ms);
  }

  public async shutdown() {
    if (!this.alive || this.pendingShutdown) return;

    this.pendingShutdown = true;

    Logger.printInfo(this.logHeader, "Shutdown.");

    process.kill(this.browserProcess.pid);

    await this.driver.close();
    await this.driver.quit();
  }

  public freeze() {
    Logger.printWarning(this.logHeader, "Freezed!");
    this.isFroze = true;
  }

  public unfreeze() {
    Logger.printWarning(this.logHeader, "Unfreezed!");
    this.isFroze = false;
  }

  /**
   * Recognize is login require, if so, avait till user perform login (timeout 5min).
   */
  private async provideLoginIsRequred() {
    Logger.printInfo(
      this.logHeader,
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
      Logger.printInfo(this.logHeader, "Already logined.");
      return Promise.resolve();
    }

    await signInBtn.click();

    const isSigned = await timeoutWhileCondition(
      (async () =>
        (
          await this.driver.getCurrentUrl()
        ).includes("https://meet.google.com/")).bind(this),
      10000,
      false
    );

    if (isSigned) {
      await this.driver.get(this.targetUrl);

      if (
        await (
          await this.driver.getCurrentUrl()
        ).includes("https://meet.google.com/")
      ) {
        Logger.printInfo(this.logHeader, "Logined.");
        return Promise.resolve();
      }
    }

    Logger.printInfo(
      this.logHeader,
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

    await this.driver.get(this.targetUrl);

    Logger.printInfo(this.logHeader, "Logined.");
  }

  /**
   * Check for window "You cannot join this call" or other else if call is blocked for user.
   * If user have no access - stop visitor and throw error to logs.
   */
  private async canIJoinCall() {
    Logger.printInfo(this.logHeader, "Checking can i join call...");

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
        this.logHeader
      );
      await this.sleep(2000);
    } else return Promise.resolve();
  }

  /**
   * Disable user micro and videocam for call.
   */
  private async disableMediaDevices() {
    await this.checkFreeze();

    Logger.printInfo(this.logHeader, "Disabling media devices at call...");

    const isCamMuted = Config.get("GMEET_CAM_MUTE", false) === "true";
    const isMicroMuted = Config.get("GMEET_MIC_MUTE", false) === "true";

    if (isCamMuted) {
      Logger.printInfo(this.logHeader, "Disabling camera...");
      await this.driver
        .actions()
        .keyDown(Key.CONTROL)
        .sendKeys("e")
        .keyUp(Key.CONTROL)
        .perform();
      await this.sleep(1000);
    }

    if (isMicroMuted) {
      Logger.printInfo(this.logHeader, "Disabling microphone...");

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
  private async startCall() {
    await this.checkFreeze();
    Logger.printInfo(this.logHeader, `Starting call at ${this.targetUrl}...`);

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
    this.isJoinedCall = true;
    await this.checkFreeze();

    const minutes = parseInt(Config.get("CALL_TIMER_MINUTES")!);
    if (Number.isNaN(minutes)) {
      Events.emitCheckable(
        EVENTS.exit,
        `Failed in parsing timer input: '${minutes}' is not a number!`,
        this.logHeader
      );
    }

    Logger.printInfo(
      this.logHeader,
      `Staying at call till ${predictFinishDate(
        minutesToMs(minutes)
      )}(${minutes} minute${minutes > 1 ? "s" : ""})`
    );

    let ms = minutesToMs(minutes);
    const timerOffsetMs = 1000;
    const timerForStayCall = 60000;

    while (ms >= 0) {
      if (ms >= timerForStayCall) {
        const timerStart = performance.now();
        const targetElement = await this.parser.waitFor(
          {
            xpath: "//*[contains(text(), 'Stay in the call')]/parent::button",
          },
          timerForStayCall,
          false
        );
        if (targetElement && until.stalenessOf(targetElement)) {
          await this.sleep(2000);
          await targetElement?.click();
        }
        const timerEnd = performance.now();
        ms -= timerEnd - timerStart;
      } else {
        await setTimeout(timerOffsetMs);
        ms -= timerOffsetMs;
      }
    }

    return Promise.resolve();
  }

  /**
   * Checks should user ask for join, if so - await till user get join access, otherwise join call.
   */
  private async joinCall() {
    await this.checkFreeze();

    Logger.printInfo(this.logHeader, "Joining call...");

    const buttonJoin = await this.parser.waitForOneOfElementsWithInnerText(
      [
        { name: "button", text: "Join now" },
        { name: "button", text: "Switch here" },
      ],
      5000,
      false
    );

    if (buttonJoin) {
      await this.sleep(2000);
      await buttonJoin?.click();
      Logger.printInfo(this.logHeader, "Joined!");
      this.isJoinedCall = true;
    } else {
      Logger.printError(this.logHeader, "Couldn't find join button!");
      Logger.printWarning(
        this.logHeader,
        "Checking is user has permissions to join..."
      );
      await this.askToJoin();
    }
  }

  private async askToJoin() {
    await this.checkFreeze();

    const askToJoin = await this.parser.waitFor(
      {
        xpath: "//*[contains(text(), 'Ask to join')]/parent::button",
      },
      2000,
      false
    );

    if (askToJoin) {
      const timerMin = parseInt(Config.get("ASK_JOIN_WAIT_MIN", false) || "10");

      Logger.printWarning(
        this.logHeader,
        `Asked for join call. Waiting for ${timerMin} minutes.`
      );
      await askToJoin.click();
      const leaveButton = await this.parser.waitFor(
        {
          tagname: "button[aria-label='Leave call'][role=button]",
        },
        minutesToMs(timerMin),
        false
      );
      if (!leaveButton) {
        Events.emitCheckable(
          EVENTS.exit,
          "Host didn't accepted your request to join call!",
          this.logHeader
        );
        this.sleep(5000);
      } else Logger.printInfo(this.logHeader, "Joined!");
    } else {
      Events.emitCheckable(
        EVENTS.exit,
        "Uknown error to join this call",
        this.logHeader
      );
      this.sleep(2000);
    }
  }

  /**
   * Send socket port to localstorage of current page.
   */
  private async provideSocketPort() {
    await this.checkFreeze();

    const serverPort = Socket.getAddressKey("port");

    if (serverPort) {
      Logger.printInfo(this.logHeader, "Sending server port to extension");
      await this.driver.executeScript(
        `
        localStorage.setItem("recorder_port", ${String(serverPort)});
        `
      );
    } else Logger.printWarning(this.logHeader, "Server port is null");
  }

  /**
   * Handle visitor freezing by:
   *  - waiting for random element on page
   *  - repeat untill isFroze flag be equal false
   */
  private checkFreeze() {
    return new Promise<void>((resolve) => {
      const probeInterval = setInterval(async () => {
        if (!this.isFroze) {
          clearInterval(probeInterval);
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

    const [chromeDriverProcess] = processes.filter((process) =>
      process.name.toLowerCase().includes("chromedriver")
    );
    const [browserProcess] = processes.filter((process) => {
      return (
        process.ppid === chromeDriverProcess.pid &&
        process.name.toLowerCase().includes("chrome")
      );
    });

    return browserProcess;
  }
}
