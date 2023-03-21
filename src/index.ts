import { Builder, By, WebDriver, Key } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import { Options } from "selenium-webdriver/chrome";

class CustomOptions extends Options {
  constructor() {
    super();
    this.addArguments("--disable-blink-features=AutomationControlled");
    this.addArguments("--use-fake-ui-for-media-stream");
    this.addArguments("--use-fake-device-for-media-stream");
    // this.headless();
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
    await this.driver.get(this.target_url);
    await this.driver.sleep(2000);
  }

  private async disablePeriheralDevices() {
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

  public async shutdown() {
    await this.driver.quit();
  }
}

async function main() {
  const visitor = new Visitor("");
  await visitor.init();
}

main();
