import { Builder, By, WebDriver, Key } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import Config from "./Config";
import { Events } from "./Util";
import Logger from "./Logger";
import CustomOptions from "./CustomOptions";
import Parser from "./Parser";

export default class Visitor {
  public target_url: string;
  private driver!: WebDriver;
  private service!: chrome.ServiceBuilder;
  private options!: CustomOptions;
  private parser!: Parser;

  constructor(target_url: string) {
    this.target_url = target_url;

    Events.on("on_exit", (exitCode: number) => this.shutdown(exitCode));
  }

  public async init() {
    this.service = new chrome.ServiceBuilder("./src/drivers/chromedriver");
    this.options = new CustomOptions();
    this.driver = await new Builder()
      .forBrowser("chrome")
      .setChromeService(this.service)
      .setChromeOptions(this.options)
      .build();
    this.parser = new Parser(this.driver);

    await this.signIn();
    await this.start_call();
    Logger.printSuccess("successfully!");
    // await this.driver.manage().deleteAllCookies();
  }

  public async start_call() {
    Logger.printHeader("[start_call]", this.target_url);
    await this.driver.sleep(2000);
    await this.driver.get(this.target_url);
    await this.disableMediaDevices();
    await this.chooseFirstAccount();
    await this.join();
    await this.driver.sleep(2000);
  }

  private async join() {
    Logger.printHeader("[join]");
    await (
      await this.parser.getElementByInnerText("button", "Join now")
    ).click();
  }

  private async disableMediaDevices() {
    Logger.printHeader("[disableMediaDevices]");

    Logger.printInfo("disabling camera...");
    await this.driver
      .actions()
      .keyDown(Key.CONTROL)
      .sendKeys("e")
      .keyUp(Key.CONTROL)
      .perform();

    await this.driver.sleep(1000);

    Logger.printInfo("disabling microphone...");
    await this.driver
      .actions()
      .keyDown(Key.CONTROL)
      .sendKeys("d")
      .keyUp(Key.CONTROL)
      .perform();
  }

  public async signIn() {
    Logger.printHeader("[signIn]");

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

    Logger.printInfo("working with input email...");
    const input_email = await this.driver.findElement(
      By.css("input[type=email]")
    );

    const user_email = Config.get_param("USER_EMAIL");
    await this.parser.humanTypeInput(input_email, user_email);

    await this.driver.sleep(2000);

    Logger.printInfo("next...");
    await (await this.parser.getElementByInnerText("button", "Next")).click();

    await this.driver.sleep(3000);

    Logger.printInfo("working with input password...");
    const input_password = await this.driver.findElement(
      By.css("input[type=password]")
    );

    const user_password = Config.get_param("USER_PASSWORD");
    await this.parser.humanTypeInput(input_password, user_password);

    await this.driver.sleep(2000);

    Logger.printInfo("next...");
    await (await this.parser.getElementByInnerText("button", "Next")).click();

    await this.driver.sleep(3000);
  }

  public async chooseFirstAccount() {
    Logger.printHeader("[chooseFirstAccount]");
    try {
      await this.driver.sleep(2000);
      await this.parser.getElementByTagName("div[data-authuser]").click();
    } catch (err) {
      Logger.printWarning((err as Error).message);
      return Promise.resolve();
    }
  }

  public async shutdown(exitCode = 0) {
    Logger.printHeader("[shutdown]");
    await this.driver.quit();
    process.exit(exitCode);
  }
}
