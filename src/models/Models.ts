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
  targetWindowSource: Electron.DesktopCapturerSource;
  filePath: string;
};

export const EVENTS = {
  ipc_error: "ipc_error",
  ipc_fetch_record_options: "ipc_fetch_record_options",
  ipc_run_cmd: "ipc_run_cmd",
  ipc_start_record: "ipc_start_record",
  ipc_stop_record: "ipc_stop_record",
  renderer_run: "renderer_run",
  renderer_file_saved: "renderer_file_saved",
  record_stop: "record_stop",
  record_start: "record_start",
  record_file_saved: "record_file_saved",
  visitor_start: "visitor_start",
  visitor_stop: "visitor_stop",
  exit: "exit",
};
