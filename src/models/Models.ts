export interface IWebDriverManager {
  /**
   * Main path to user downloaded chromedriver.
   */
  chromedriver_path: string;

  /**
   * - Get user chrome version
   * - Form path to downloaded user's chromedriver.
   * @returns Promise<void>
   */
  init: () => Promise<void>;

  /**
   * Check is formed path to downloaded user's chromedriver exist.
   * @returns boolean
   */
  isWebDriverInstalled: () => boolean;

  /**
   * - Download & unzip zip of user's chromedriver version
   * - Add version and user's platform to downloaded user's chromedriver.
   * - Remove downloaded zip.
   * @returns Promise<void>
   */
  provideChromeDriver: () => Promise<void>;
}

export interface IVisitor {
  /**
   * Init driver and configure all neccessary components.
   * @param webdriver_path - path to downloaded chrome driver.
   * @returns Promise<void>
   */
  init_driver: (webdriver_path: string) => Promise<void>;

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
}

export interface IWSSErver {
  /**
   * Initialize WebSocket server.
   * @returns Promise<void>
   */
  init: () => Promise<void>;

  /**
   * Close WebSocket server.
   * @returns Promise<void>
   */
  closeConnection: () => Promise<void>;

  /**
   * Send message for the client.
   * @param message
   * @returns void.
   */
  send: (message: string) => void;

  /**
   * Bind listener for the message received from the client.
   * @param type - listener identificator for handle it.
   * @param listener - callback that revokes if client have sent message with such type.
   * @returns void.
   */
  on: (type: string, listener: (data?: RecorderData | Buffer) => void) => void;

  /**
   * Check is WebSocket connected to the client.
   * @returns boolean
   */
  isConnected: () => boolean;

  /**
   * Get address ip or port.
   * @param key
   * @returns
   */
  getAddressKey: (key: "address" | "port") => string | number | null;
}

export interface IRecordManager {
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

// Path to user data directory and profile name
export type USER_DIR_DATA = {
  dir_path: string;
  profile_name: string;
};

// State events for the whole app live.
export const EVENTS = {
  record_ready: "record_ready",
  record_choose_stream: "record_choose_stream",
  record_stream_choosed: "record_stream_choosed",
  record_stop: "record_stop",
  record_start: "record_start",
  record_chunk: "record_chunk",
  record_finished: "record_finished",
  record_error: "record_error",
  visitor_start: "visitor_start",
  visitor_stop: "visitor_stop",
  exit: "exit",
};

export type RecorderStates =
  | "record_ready"
  | "record_stop"
  | "record_start"
  | "record_load"
  | "record_error";

export type RecorderData = {
  chunk?: Blob;
  error?: string;
};

// DTO for communication between the app and the recorder extension.
export type RecorderResponse = {
  type: RecorderStates;
  data?: RecorderData;
};

// DOM element metadata for finding it on web page, use of xpath or tag name
export type ElementMeta = {
  xpath?: string;
  tagname?: string;
};

export type ArgumentDescription = Record<
  string,
  {
    flags: string[];
    type: "flag" | "argument";
    optional: boolean;
    template: RegExp;
  }
>;

/**
 * Command-line arguments that could user specify.
 * All arguments are match with .env params.
 * Arguments/flags should be unique.
 */
export const arguments_matches: ArgumentDescription = {
  USER_DATA_DIR: {
    flags: ["--user-data-dir", "--u"],
    type: "argument",
    optional: false,
    template:
      /^(?:(?:[a-zA-Z]:)|(?:\/))(?:\\|\/)?(?:[\w|\W]+(?:\\|\/)?)*[\w|\W]+$/i,
  },
  TARGET_CALL_LINK: {
    flags: ["--target-call-link", "--t"],
    type: "argument",
    optional: false,
    template: /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/i,
  },
  CALL_TIMER_MINUTES: {
    flags: ["--call-timer-minutes", "--timer"],
    type: "argument",
    optional: false,
    template: /^[0-9]+$/i,
  },
  MINIMIZED: {
    flags: ["--minimized"],
    type: "flag",
    optional: true,
    template: /true|false/i,
  },
  MUTE: {
    flags: ["--mute"],
    type: "flag",
    optional: true,
    template: /true|false/i,
  },
  RECORD_TAB: {
    flags: ["--record-tab", "--r"],
    type: "flag",
    optional: true,
    template: /true|false/i,
  },
  OUTPUT_RECORD_TAB: {
    flags: ["--output-record-tab", "--o"],
    type: "argument",
    optional: true,
    template:
      /^(?:(?:[a-zA-Z]:)|(?:\/))(?:\\|\/)?(?:[\w|\W]+(?:\\|\/)?)*[\w|\W]+$/i,
  },
  WIDTH_PX: {
    flags: ["--width", "--w"],
    type: "argument",
    optional: true,
    template: /\d/i,
  },
  HEIGHT_PX: {
    flags: ["--height", "--h"],
    type: "argument",
    optional: true,
    template: /\d/i,
  },
};
