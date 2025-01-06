import { By, until, WebDriver, WebElement } from "selenium-webdriver";
import { Events, getRandomInt } from "../utils";
import { ElementMeta, ParserButtonWithInnerText } from "../types";
import { EVENTS } from "../constants";
import { Logger } from "utils";
import { setTimeout } from "node:timers/promises";

/**
 * Helper for parse elements on page.
 */
export default class Parser {
  private readonly logHeader = "Parser";

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
        this.logHeader
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
          this.logHeader
        );
      }

      return Promise.resolve(undefined);
    } catch (err) {
      if (throwable) {
        Events.emitCheckable(
          EVENTS.exit,
          `ParserError: Element <${tagname}> with text "${text}" not found!`,
          this.logHeader
        );
      } else
        Logger.printError(
          this.logHeader,
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
        this.logHeader
      );
      return Promise.resolve();
    } else {
      const element_indicator = element?.tagname ? "tagname" : "xpath";
      try {
        const targetElement = await this.driver.wait(
          until.elementLocated(
            locator[element_indicator as keyof typeof locator]()
          ),
          timeout
        );
        return targetElement;
      } catch (err) {
        if (throwable) {
          Events.emitCheckable(
            EVENTS.exit,
            `ParserError: Timeot of waiting for element '${element_indicator}'. Reason: ${err}`,
            this.logHeader
          );
        } else
          Logger.printError(this.logHeader, `waitFor method error: ${err}`);
        return Promise.resolve(undefined);
      }
    }
  }

  /**
   * Wait for element with given inner text and tagname
   * @param name tag name of desired element
   * @param text inner text of the element
   * @param timeout given time for element seeking
   * @param throwable should it throw an error if element not found for the given time
   * @returns Promise<WebElement | undefined>
   */
  public waitForElementWithInnerText(
    name: string,
    text: string,
    timeout: number,
    throwable = true
  ) {
    const fetchElement = async (): Promise<WebElement | undefined> => {
      const targetElement = await this.getElementByInnerText(name, text, false);
      if (targetElement) return Promise.resolve(targetElement);
      else {
        if (timeout <= 0) {
          if (throwable) {
            Events.emitCheckable(
              EVENTS.exit,
              `ParserError: Element <${name}> with text "${text}" not found!`,
              this.logHeader
            );
            await this.driver.sleep(2000);
          } else
            Logger.printError(
              this.logHeader,
              `waitForElementWithInnerText method error: timeout fetching element ${name} with text ${text}`
            );
          return Promise.resolve(undefined);
        } else {
          timeout -= 500;
          return fetchElement();
        }
      }
    };
    return fetchElement();
  }

  /**
   * Wait for any first appeared element among given ones.
   * @param elements list of approximated elements
   * @param timeout given time for elements seeking
   * @param throwable should it throw an error if any element not found for the given time
   * @returns Promise<WebElement | undefined>
   */
  public async waitForOneOfElementsWithInnerText(
    elements: ParserButtonWithInnerText[],
    timeout: number,
    throwable = true
  ) {
    const fetchElement = async (
      elem: ParserButtonWithInnerText
    ): Promise<WebElement | undefined> => {
      const targetElement = await this.getElementByInnerText(
        elem.name,
        elem.text,
        false
      );
      if (targetElement) return Promise.resolve(targetElement);
      else {
        if (timeout <= 0) {
          if (throwable) {
            await this.driver.sleep(2000);
          } else
            Logger.printError(
              this.logHeader,
              `waitForElementWithInnerText method error: timeout fetching element <${elem.name}>${elem.text}</${elem.name}>`
            );
          return Promise.resolve(undefined);
        } else {
          timeout -= 500;
          return fetchElement(elem);
        }
      }
    };

    const promises = elements.map(async (el: ParserButtonWithInnerText) => {
      const found = await fetchElement(el);

      return found;
    });

    const founded = await Promise.race(promises);
    if (founded) return founded;

    if (throwable) {
      Events.emitCheckable(
        EVENTS.exit,
        `ParserError: Couldn't find any of these elements: ${elements.map(
          (el) => `<${el.name}>${el.text}</${el.name}>`
        )}`,
        this.logHeader
      );
      await setTimeout(2000);
    }

    return undefined;
  }
}
