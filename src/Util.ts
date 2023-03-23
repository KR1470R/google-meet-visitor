import EventEmitterExtended from "./Events";

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min + 1);
}

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

export function concat(str: string[]) {
  let res = "";
  for (const s of str) res += s;
  return res;
}

export const Events = new EventEmitterExtended();

export function minutesToMs(minutes: number) {
  return minutes * 60 * 1000;
}

export function timer(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

type USER_DIR_DATA = {
  dir_path: string;
  profile_name: string;
};
export function parseUserDir(full_path: string): USER_DIR_DATA {
  const full_path_splitted = full_path.split("/");
  const dir_path = full_path_splitted.slice(0, full_path.length - 1).join("/");
  const profile_name = full_path_splitted.at(-1) as string;
  return { dir_path, profile_name };
}
