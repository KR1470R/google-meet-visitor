import process from "process";
import dotenv from "dotenv";
import { Events } from "./Util";

dotenv.config();

export default class Config {
  constructor() {}

  public static init() {
    const important_params: Array<Uppercase<string>> = [
      "USER_DATA_DIR",
      "TARGET_CALL_LINK",
      "CALL_TIMER_MINUTES",
    ];
    important_params.forEach((param: Uppercase<string>) =>
      Config.get_param(param)
    );
  }

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
