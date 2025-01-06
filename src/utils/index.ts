import EventEmitterExtended from "../events/event-emitter-extended";
import WSServer from "../wss/ws-server";
import { RecorderResponse, USER_DIR_DATA } from "../types";
import fs from "node:fs";
import path from "node:path";
import RecordManager from "../recorder/record-manager";
import DotEnvConfig from "../configs/dot-env-config";
import LoggerUtil from "./logger-util";
import StreamZip from "node-stream-zip";

const availablePlatforms = {
  linux: "linux64",
  darwin: "mac-arm64",
  win32: "win32",
  win64: "win64",
};

/**
 * Returns random int with given range.
 * @param min
 * @param max
 * @returns random int.
 */
export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min + 1);
}

/**
 * Converts minutes to milliseconds.
 * @param minutes
 * @returns
 */
export function minutesToMs(minutes: number) {
  return minutes * 60 * 1000;
}

/**
 * Maps profile name and path to the user dir.
 * @param full_path full path to user dir
 * @returns USER_DIR_DATA
 */
export function parseUserDir(full_path: string): USER_DIR_DATA {
  const full_path_splitted = full_path.split(path.sep);

  const dir_path = full_path_splitted
    .slice(0, full_path_splitted.length - 1)
    .join(path.sep);
  const profile_name = full_path_splitted.at(-1) as string;

  return { dir_path, profile_name };
}

/**
 * Adds zero at the start of given string if needed.
 * @param num
 * @returns
 */
export function addZero(num: number) {
  return String(num).padStart(2, "0");
}

/**
 * Forms date components into object.
 * @param date Date constructor
 */
export function splitDate(date = new Date()) {
  return {
    day: addZero(date.getDate()),
    month: addZero(date.getMonth() + 1),
    year: addZero(date.getFullYear()),
    h: addZero(date.getHours()),
    m: addZero(date.getMinutes()),
    s: addZero(date.getSeconds()),
    ms: addZero(date.getMilliseconds()),
  };
}

/**
 * Returns stringified date in format: dd/mm/yy, h:m:s:ms
 * @param date
 * @returns
 */
export function getDateString(date = splitDate()) {
  const date_stringified = `${date.day}/${date.month}/${date.year}, ${date.h}:${date.m}:${date.s}:${date.ms}`;
  return `[${date_stringified}]`;
}

/**
 * Predicts finish date for some event by remaining milliseconds
 * @param remain_ms
 * @returns
 */
export function predictFinishDate(remain_ms: number) {
  const date_now = new Date();
  return getDateString(splitDate(new Date(date_now.getTime() + remain_ms)));
}

/**
 * Check does directory exist
 * @param path
 * @returns
 */
export function isDirExist(path: string) {
  try {
    const stats = fs.statSync(path);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Check does file exist
 * @param path
 * @returns
 */
export function isFileExist(path: string) {
  try {
    const stats = fs.statSync(path);
    return stats.isFile();
  } catch (error) {
    return false;
  }
}

/**
 * Get user platform name
 * @returns string that contains user platform name, or null if couldn't define.
 */
export function getDriverPlatformName(): string | null {
  const prefix = "chromedriver-";
  const target_platform = getPlatformRaw();

  if (target_platform) return `${prefix}${target_platform}`;

  return null;
}

export function getPlatformRaw(): string | null {
  const target_platform =
    availablePlatforms?.[process.platform as keyof typeof availablePlatforms];

  return target_platform;
}

/**
 * Get binary value of access mode file.
 * @param m
 * @param def
 * @returns
 */
export function modeNum(
  m: string | number,
  def?: string | number
): number | undefined {
  switch (typeof m) {
    case "number":
      return m;
    case "string":
      return parseInt(m, 8);
    default:
      return def ? modeNum(def) : undefined;
  }
}

/**
 * Add .exe format to a binary file for windows systems.
 * @param filename
 * @returns
 */
export function addExeExtention(filename: string) {
  if (process.platform === "win32") return `${filename}.exe`;

  return filename;
}

/**
 * Translates response from chrome extension.
 * @param message Buffer
 * @returns RecorderResponse if it could parse response to JSON, otherwise Buffer - chunk of recorder.
 */
export function translateResponse(message: Buffer): RecorderResponse | Buffer {
  try {
    const translated = JSON.parse(message.toString());
    if (
      typeof translated === "object" &&
      !Array.isArray(translated) &&
      translated !== null
    )
      return translated;
    throw new Error("Got wrong response!");
  } catch (err) {
    return message;
  }
}

/**
 * Returns a promise that resolves after condition returns true till timeout expires,
 * and rejectes if timeout expired.
 * @param condition
 * @param ms
 * @returns
 */
export function timeoutWhileCondition(
  condition: () => boolean | Promise<boolean>,
  ms: number,
  throwable = true
) {
  return new Promise<boolean>((resolve, reject) => {
    let counter = 0;
    const delay = 1000;
    const interval = setInterval(async () => {
      counter += delay;
      if (await condition()) {
        resolve(true);
        clearInterval(interval);
      } else {
        if (counter > ms) {
          if (throwable) {
            reject("timeout");
            clearInterval(interval);
          } else resolve(false);
        }
      }
    }, delay);
  });
}

export function throwError(logHeader: string, error: string) {
  Logger.printFatal(logHeader, error);
  process.exit(1);
}

export function extractZip(params: {
  zipPath: string;
  removeSourceZip: boolean;
  logHeader?: string;
}) {
  const zipPath = params.zipPath;
  const removeSourceZip = params.removeSourceZip;
  const logHeader = params?.logHeader ?? "ZipExtractor";

  const zipStream = new StreamZip({ file: zipPath, storeEntries: true });

  return new Promise<void>((resolve) => {
    const onExtract = (error: Error | null) => {
      if (error) throwError(logHeader, `Error in extraction zip: ${error}`);
      else {
        zipStream.close();
        if (removeSourceZip) fs.rmSync(zipPath);
        Logger.printInfo(logHeader, "Extracted successfully!");
        resolve();
      }
    };
    zipStream.on("ready", () => {
      Logger.printInfo(logHeader, "Extracting zip...");
      zipStream.extract(null, path.resolve(__dirname, "drivers"), onExtract);
    });
    zipStream.on("error", (error: Error) => {
      zipStream.close();
      throwError(logHeader, String(error));
    });
  });
}

/**
 * Singletons of the main components.
 */
export const Logger = new LoggerUtil();
export const Events = EventEmitterExtended.init();
export const Config = DotEnvConfig.init();
export const Socket = new WSServer();
export const Recorder = new RecordManager();
