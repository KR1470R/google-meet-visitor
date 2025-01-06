export default interface IVisitor {
  /**
   * Init driver and configure all neccessary components.
   * @param webdriver_path - path to downloaded chrome driver.
   * @returns Promise<void>
   */
  initDriver: (webdriver_path: string) => Promise<void>;

  /**
   * Start Visitor's work.
   * @returns Promise<void>
   */
  start: () => Promise<void>;

  /**
   * Minimize Visitor's browser window.
   * @returns Promise<void>
   */
  minimize: () => Promise<void>;

  /**
   * Maximize Visitor's browser window.
   * @returns Promise<void>
   */
  maximize: () => Promise<void>;

  /**
   * Resize Visitor's browser window to size specified in config.
   * @returns Promise<void>
   */
  resize: () => Promise<void>;

  /**
   * Stop visitor work.
   * @returns Promise<void>
   */
  shutdown: () => Promise<void>;

  /**
   * Totally freeze Visitor. Stop perform any action till unfreeze will be invoked.
   * Be carefully while using that to avoid unexpected behaviour!
   * @returns void
   */
  freeze: () => void;

  /**
   * Continue visitor's work.
   * @returns void
   */
  unfreeze: () => void;

  /**
   * Stop perform any action for the given time.
   * @param ms milliseconds for sleep
   * @returns
   */
  sleep: (ms: number) => Promise<void>;
}
