import process from "process";
import dotenv from "dotenv";
import { Events } from "./Util";

dotenv.config();

export default class Config {
  constructor() {}

  public static get_param(key: Uppercase<string>): string {
    if (process?.env?.[key]) {
      const target_value = process.env[key]!;
      if (!target_value.length) {
        Events.emitCheckable(
          "on_exit",
          `ConfigError: Key ${key} was not specified!`
        );
      }
      return process.env[key]!;
    }
    Events.emitCheckable(
      "on_exit",
      `ConfigError: Key was not specified: ${key}`
    );
    process.exit(1);
  }
}
