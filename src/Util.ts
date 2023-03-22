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
