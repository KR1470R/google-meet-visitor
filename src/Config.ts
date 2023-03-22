import process from "process";
import dotenv from "dotenv";
import Logger from "./Logger";
import { Events } from "./Util";

dotenv.config();

export default class Config {
  constructor() {}

  public static get_param(key: Uppercase<string>): string {
    if (process?.env?.[key]) {
      const target_value = process.env[key]!;
      if (!target_value.length) {
        Logger.printError(`ConfigError: Key ${key} was not specified!`);
        Events.emit("on_exit", 1);
      }
      return process.env[key]!;
    }
    Logger.printError(`ConfigError: Uknown key: ${key}`);
    Events.emit("on_exit", 1);
    return "";
  }
}
