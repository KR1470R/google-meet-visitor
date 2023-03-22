import { By, WebDriver, WebElement } from "selenium-webdriver";
import { getRandomInt, Events } from "./Util";

export default class Parser {
  constructor(private driver: WebDriver) {}

  public getElementByTagName(name: string) {
    return this.driver.findElement(By.css(name));
  }

  public async getElementByInnerText(
    name: string,
    text: string
  ): Promise<WebElement | undefined> {
    const buttons = await this.driver.findElements(By.css(name));
    for (const button of buttons) {
      if ((await button.getText()) === text) return button;
    }

    Events.emit(
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
}
