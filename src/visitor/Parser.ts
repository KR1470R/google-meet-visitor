import { By, until, WebDriver, WebElement } from "selenium-webdriver";
import { getRandomInt, Events } from "../utils/Util";
import { EVENTS, ElementMeta } from "../models/Models";
import Logger from "utils/Logger";

/**
 * Helper for parse elements on page.
 */
export default class Parser {
  private readonly log_header = "Parser";

  constructor(private driver: WebDriver) {}

  /**
   * Returns element by tag name or undefined if element not found.
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
        `ParserError: Element ${name} not found!`,
        this.log_header
      );
      return Promise.resolve(undefined);
    }
  }

  /**
   * Returns element by inner text, or undefined if element not found.
   * @param tagname
   * @param text
   * @returns
   */
  public async getElementByInnerText(
    tagname: string,
    text: string,
    throwable = true
  ): Promise<WebElement | undefined> {
    try {
      const buttons = await this.driver.findElements(By.css(tagname));
      for (const button of buttons) {
        if ((await button.getText()).toLowerCase() === text.toLowerCase())
          return button;
      }

      if (throwable) {
        Events.emitCheckable(
          EVENTS.exit,
          `ParserError: Element <${tagname}> with text "${text}" not found!`,
          this.log_header
        );
      }

      return Promise.resolve(undefined);
    } catch (err) {
      if (throwable) {
        Events.emitCheckable(
          EVENTS.exit,
          `ParserError: Element <${tagname}> with text "${text}" not found!`,
          this.log_header
        );
      } else
        Logger.printError(
          this.log_header,
          `getElementByInnerText method error: ${err}`
        );
      return Promise.resolve(undefined);
    }
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
  public async waitFor(
    element: ElementMeta,
    timeout: number,
    throwable: boolean
  ) {
    const locator = {
      xpath: () => By.xpath(element.xpath!),
      tagname: () => By.css(element.tagname!),
    };

    if (!element?.tagname && !element?.xpath) {
      Events.emitCheckable(
        EVENTS.exit,
        `Invalid element metadata: tagname and xpath is undefined!`,
        this.log_header
      );
      return Promise.resolve();
    } else {
      const element_indicator = element?.tagname ? "tagname" : "xpath";
      try {
        const target_el = await this.driver.wait(
          until.elementLocated(
            locator[element_indicator as keyof typeof locator]()
          ),
          timeout
        );
        return target_el;
      } catch (err) {
        if (throwable) {
          Events.emitCheckable(
            EVENTS.exit,
            `ParserError: Timeot of waiting for element '${element_indicator}'. Reason: ${err}`,
            this.log_header
          );
        } else
          Logger.printError(this.log_header, `waitFor method error: ${err}`);
        return Promise.resolve(undefined);
      }
    }
  }

  public waitForElementWithInnerText(
    name: string,
    text: string,
    timeout: number,
    throwable = true
  ) {
    const fetch_elem = async (): Promise<WebElement | undefined> => {
      const target_elem = await this.getElementByInnerText(name, text, false);
      if (target_elem) return Promise.resolve(target_elem);
      else {
        if (timeout <= 0) {
          if (throwable) {
            Events.emitCheckable(
              EVENTS.exit,
              `ParserError: Element <${name}> with text "${text}" not found!`,
              this.log_header
            );
            await this.driver.sleep(2000);
          } else
            Logger.printError(
              this.log_header,
              `waitForElementWithInnerText method error: timeout fetching element ${name} with text ${text}`
            );
          return Promise.resolve(undefined);
        } else {
          timeout -= 500;
          return fetch_elem();
        }
      }
    };
    return fetch_elem();
  }
}
