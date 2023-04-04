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
