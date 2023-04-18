import { By, until, WebDriver, WebElement } from "selenium-webdriver";
import { getRandomInt, Events } from "../utils/Util";
import { EVENTS } from "../models/Models";

/**
 * Helper for parse elements on page.
 */
export default class Parser {
  constructor(private driver: WebDriver) {}

  /**
   * Returns element by tag name.
   * @param name
   * @returns
   */
  public async getElementByTagName(
    name: string
  ): Promise<WebElement | undefined> {
    try {
      const found = await this.driver.findElement(By.css(name));
      return found;
    } catch (err) {
      Events.emitCheckable(
        EVENTS.exit,
        `ParserError: Element ${name} not found!`
      );
      return Promise.resolve(undefined);
    }
  }

  /**
   * Returns element by inner text.
   * @param name
   * @param text
   * @returns
   */
  public async getElementByInnerText(
    name: string,
    text: string
  ): Promise<WebElement | undefined> {
    const buttons = await this.driver.findElements(By.css(name));
    for (const button of buttons) {
      if ((await button.getText()) === text) return button;
    }

    Events.emitCheckable(
      EVENTS.exit,
      `ParserError: Element <${name}> with text "${text}" not found!`
    );
    return Promise.resolve(undefined);
  }

  /**
   * Bind callback on element which calls after element is found.
   * @param name
   * @param text
   * @param callback
   */
  public async findElementByInnerTextAndBind(
    name: string,
    text: string,
    callback: (target_el?: WebElement) => Promise<void>
  ): Promise<void> {
    const target_el = await this.getElementByInnerText(name, text);
    await callback(target_el);
  }

  /**
   * Simulate user typing on given input type
   * @param input
   * @param text
   */
  public async humanTypeInput(input: WebElement, text: string) {
    for (const char of text) {
      await this.driver.sleep(getRandomInt(0, 600));
      await input.sendKeys(char);
    }
  }

  /**
   * Await for given element's xpath appear on page with given timeout.
   * @param xpath string - Xpath of element
   * @param timeout number - how many milliseconds wait for element
   * @param throwable boolean - throw if element was not found after timeout expires
   * @returns
   */
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
          EVENTS.exit,
          `ParserError: Timeot of waiting for element '${xpath}'!`
        );
      }
      return Promise.resolve(undefined);
    }
  }
}
