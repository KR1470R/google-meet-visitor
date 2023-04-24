import process from "process";
import dotenv from "dotenv";
import { Events } from "../utils/Util";
import { EVENTS } from "../models/Models";

dotenv.config();

/**
 * Manager of .env config.
 */
export default class DotEnvConfig {
  private static instance?: DotEnvConfig;

  private constructor() {}

  public static init() {
    const important_params: Array<Uppercase<string>> = [
      "USER_DATA_DIR",
      "TARGET_CALL_LINK",
      "CALL_TIMER_MINUTES",
    ];

    this.instance = this.instance || new DotEnvConfig();

    important_params.forEach(
      (param: Uppercase<string>) => this.instance!.get_param(param)!
    );

    return this.instance;
  }

  public get_param(key: Uppercase<string>, throwable = true): string | null {
    let error;

    if (!process?.env?.[key] || !process?.env?.[key]!.length)
      error = `ConfigError: Key ${key} was not specified!`;

    if (error) {
      if (throwable) {
        Events.emitCheckable(EVENTS.exit, error, "DotEnvConfig");
        process.exit(1);
      } else return null;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      return process?.env?.[key]!;
    }
  }
}
