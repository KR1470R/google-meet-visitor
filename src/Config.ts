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
    important_params.forEach(
      (param: Uppercase<string>) => Config.get_param(param)!
    );
  }

  public static get_param(
    key: Uppercase<string>,
    throwable = true
  ): string | null {
    let error;

    if (!process?.env?.[key] || !process?.env?.[key]!.length)
      error = `ConfigError: Key ${key} was not specified!`;

    if (error) {
      if (throwable) {
        Events.emitCheckable("on_exit", error);
        process.exit(1);
      } else return null;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      return process?.env?.[key]!;
    }
  }
}
