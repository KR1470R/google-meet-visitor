export type USER_DIR_DATA = {
  dir_path: string;
  profile_name: string;
};

export enum COLORS {
  HEADER = "\x1b[95m",
  OKBLUE = "\x1b[94m",
  OKCYAN = "\x1b[96m",
  OKGREEN = "\x1b[92m",
  WARNING = "\x1b[93m",
  FAIL = "\x1b[91m",
  ENDC = "\x1b[0m",
  BOLD = "\x1b[1m",
  UNDERLINE = "\x1b[4m",
}

export type RecordOptions = {
  isActive: boolean;
  isMuted: boolean;
  // targetWindowSource: Electron.DesktopCapturerSource;
  filePath: string;
};

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

export type RecorderResponse = {
  type: RecorderStates;
  data?: RecorderData;
};
