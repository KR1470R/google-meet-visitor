// Path to user data directory and profile name
export type USER_DIR_DATA = {
  dir_path: string;
  profile_name: string;
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
  Uppercase<string>,
  {
    flags: string[];
    type: "flag" | "argument";
    optional: boolean;
    template: RegExp;
  }
>;

export type SignalCallbackType = { (error?: string): Promise<void> };

export type ParserButtonWithInnerText = {
  name: string;
  text: string;
};

export type BrowserProcessNix = {
  pid: number;
  name: string;
  cmd: string;
  ppid: number;
  uid: number;
  cpu: number;
  memory: number;
};

export type BrowserProcessWindows = {
  ppid: number;
  pid: number;
  name: string;
};
