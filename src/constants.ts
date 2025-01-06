import { ArgumentDescription } from "./types";

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

/**
 * Command-line arguments that could user specify.
 * All arguments are match with .env params.
 * Arguments/flags should be unique.
 */
export const argumentsMatches: ArgumentDescription = {
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
    template: /^https|http:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/i,
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
  ASK_JOIN_WAIT_MIN: {
    flags: ["--ask-to-join-wait", "--ask-min"],
    type: "argument",
    optional: true,
    template: /\d/i,
  },
  IGNORE_ERRORS: {
    flags: ["--ignore-errors", "--i"],
    type: "flag",
    optional: true,
    template: /true|false/i,
  },
  GMEET_MIC_MUTE: {
    flags: ["--gmeet-mic-mute", "--gmm"],
    type: "flag",
    optional: true,
    template: /true|false/i,
  },
  GMEET_CAM_MUTE: {
    flags: ["--gmeet-cam-mute", "--gcm"],
    type: "flag",
    optional: true,
    template: /true|false/i,
  },
};
