import { By, until, WebDriver, WebElement } from "selenium-webdriver";
import { getRandomInt, Events } from "./Util";

export default class Parser {
  constructor(private driver: WebDriver) {}

  public async getElementByTagName(
    name: string
  ): Promise<WebElement | undefined> {
    const found = await this.driver.findElements(By.css(name));
    if (found.length) return found[0];
    Events.emitCheckable("on_exit", `ParserError: Element ${name} not found!`);
    return Promise.resolve(undefined);
  }

  public async getElementByInnerText(
    name: string,
    text: string
  ): Promise<WebElement | undefined> {
    const buttons = await this.driver.findElements(By.css(name));
    for (const button of buttons) {
      if ((await button.getText()) === text) return button;
    }

    Events.emitCheckable(
      "on_exit",
      `ParserError: Element <${name}> with text "${text}" not found!`
    );
    return Promise.resolve(undefined);
  }

  public async findElementByInnerTextAndBind(
    name: string,
    text: string,
    callback: (target_el?: WebElement) => Promise<void>
  ): Promise<void> {
    const target_el = await this.getElementByInnerText(name, text);
    await callback(target_el);
  }

  public async humanTypeInput(input: WebElement, text: string) {
    for (const char of text) {
      await this.driver.sleep(getRandomInt(0, 600));
      await input.sendKeys(char);
    }
  }

  public async waitFor(xpath: string, timeout: number, throwable: boolean) {
    try {
      const target_el = await this.driver.wait(
        until.elementLocated(By.xpath(xpath)),
        timeout
      );
      return target_el;
    } catch (err) {
      if (throwable) {
        Events.emitCheckable(
          "on_exit",
          `ParserError: Timeot of waiting for element '${xpath}'!`
        );
      }
      return Promise.resolve(undefined);
    }
  }
}
