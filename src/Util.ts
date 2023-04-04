import EventEmitterExtended from "./Events";
import { USER_DIR_DATA } from "./Models";
import fs from "node:fs";
import path from "node:path";

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min + 1);
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

export function parseUserDir(full_path: string): USER_DIR_DATA {
  const full_path_splitted = full_path.split(path.sep);

  const dir_path = full_path_splitted
    .slice(0, full_path_splitted.length - 1)
    .join("/");
  const profile_name = full_path_splitted.at(-1) as string;

  return { dir_path, profile_name };
}

export function splitDate(date = new Date()) {
  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    h: date.getHours(),
    m: date.getMinutes(),
    s: date.getSeconds(),
    ms: date.getMilliseconds(),
  };
}

export function getDateString(date = splitDate()) {
  const date_stringified = `${date.day}/${date.month}/${date.year}, ${date.h}:${date.m}:${date.s}:${date.ms}`;
  return `[${date_stringified}]`;
}

export function predictFinishDate(remain_ms: number) {
  const date_now = new Date();
  return getDateString(splitDate(new Date(date_now.getTime() + remain_ms)));
}

export function checkAccessToPath(path: string) {
  try {
    const stats = fs.statSync(path);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
