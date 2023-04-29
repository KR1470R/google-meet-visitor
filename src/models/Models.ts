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
