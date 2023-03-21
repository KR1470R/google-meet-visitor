import { Builder, By, WebDriver, Key, WebElement } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import { Options } from "selenium-webdriver/chrome";
import Config from "./Config";
import { getRandomInt } from "./Util";

class CustomOptions extends Options {
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
    // this.headless();
  }
}

class Parser {
  constructor(private driver: WebDriver) {}

  public static getElementByTagName(driver: WebDriver, name: string) {
    return driver.findElement(By.css(name));
  }

  public static async getElementByInnerText(
    driver: WebDriver,
    name: string,
    text: string
  ): Promise<WebElement> {
    const buttons = await driver.findElements(By.css(name));
    for (const button of buttons) {
      if ((await button.getText()) === text) return button;
    }
    throw new Error(
      `ParserError: Element <${name}> with text "${text}" not found!`
    );
  }

  public static async findElementByInnerTextAndBind(
    driver: WebDriver,
    name: string,
    text: string,
    callback: (target_el: WebElement) => Promise<void>
  ): Promise<void> {
    const target_el = await Parser.getElementByInnerText(driver, name, text);
    await callback(target_el);
  }

  public static async humanTypeInput(
    driver: WebDriver,
    input: WebElement,
    text: string
  ) {
    for (const char of text) {
      await driver.sleep(getRandomInt(0, 600));
      await input.sendKeys(char);
    }
  }
}

class Visitor {
  public target_url: string;
  private driver!: WebDriver;
  private service!: chrome.ServiceBuilder;
  private options!: CustomOptions;

  constructor(target_url: string) {
    this.target_url = target_url;
  }

  public async init() {
    this.service = new chrome.ServiceBuilder("./src/drivers/chromedriver");
    this.options = new CustomOptions();
    this.driver = await new Builder()
      .forBrowser("chrome")
      .setChromeService(this.service)
      .setChromeOptions(this.options)
      .build();
    await this.signIn();

    await this.driver.sleep(2000);
    await this.driver.get(this.target_url);
    await this.disableMediaDevices();
    await this.chooseFirstAccount();
    await this.join();
    // await this.driver.manage().deleteAllCookies();
    await this.driver.sleep(2000);
  }

  private async join() {
    await (
      await Parser.getElementByInnerText(this.driver, "button", "Join now")
    ).click();
  }

  private async disableMediaDevices() {
    await this.driver
      .actions()
      .keyDown(Key.CONTROL)
      .sendKeys("e")
      .keyUp(Key.CONTROL)
      .perform();

    await this.driver.sleep(1000);

    await this.driver
      .actions()
      .keyDown(Key.CONTROL)
      .sendKeys("d")
      .keyUp(Key.CONTROL)
      .perform();
  }

  public async signIn() {
    await this.driver.get(
      "https://accounts.google.com/v3/signin/identifier?dsh=S-905947906%3A1679435695399874&authuser=0&continue=https%3A%2F%2Fmyaccount.google.com%2F%3Futm_source%3Dsign_in_no_continue&ec=GAlAwAE&hl=en&service=accountsettings&flowName=GlifWebSignIn&flowEntry=AddSession"
    );

    // await (
    //   await Parser.getElementByInnerText(
    //     this.driver,
    //     "div[role=button]",
    //     "Sign in"
    //   )
    // ).click();

    await this.driver.sleep(2000);

    const input_email = await this.driver.findElement(
      By.css("input[type=email]")
    );

    await Parser.humanTypeInput(
      this.driver,
      input_email,
      Config.get_param("USER_EMAIL")
    );

    await this.driver.sleep(2000);

    await (
      await Parser.getElementByInnerText(this.driver, "button", "Next")
    ).click();

    await this.driver.sleep(3000);

    const input_password = await this.driver.findElement(
      By.css("input[type=password]")
    );

    await Parser.humanTypeInput(
      this.driver,
      input_password,
      Config.get_param("USER_PASSWORD")
    );

    await this.driver.sleep(2000);

    await (
      await Parser.getElementByInnerText(this.driver, "button", "Next")
    ).click();

    await this.driver.sleep(3000);
  }

  public async chooseFirstAccount() {
    try {
      await this.driver.sleep(2000);
      await Parser.getElementByTagName(
        this.driver,
        "div[data-authuser]"
      ).click();
    } catch (err) {
      console.error("chooseFirstAccount error:", err);
      return Promise.resolve();
    }
  }

  public async shutdown() {
    await this.driver.quit();
  }
}

async function main() {
  const visitor = new Visitor(Config.get_param("TARGET_CALL_LINK"));
  await visitor.init();
}

main();
