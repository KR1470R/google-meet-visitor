export default interface IRecordManager {
  /**
   * Init all required options, events and socket.
   * @returns void
   */
  init: () => void;

  /**
   * Awaits untill socket respond ready signal.
   * If socket didn't returned ready signal for 30s, reject performs as well.
   * @returns Promise<void>
   */
  awaitForSocketReady: () => Promise<void>;

  /**
   * Sends signal to Chrome Extension, that opends popup to choose tab record to.
   * If user does not choose a tab for 1 minute, timeout throws as well.
   * @returns Promise<void>
   */
  chooseStream: () => Promise<void>;

  /**
   * Sends start record signal into MediaStream on Chrome Extension.
   * @returns Promise<void>
   */
  startRecord: () => Promise<void>;

  /**
   * Sends stop record signal into MediaStream on Chrome Extension.
   * @returns void
   */
  stopRecord: () => Promise<void>;
}
