import process from "process";
import dotenv from "dotenv";
import { Events } from "../utils/Util";
import { EVENTS, arguments_matches } from "../models/Models";
import { ArgumentsManager } from "./ArgumentsManager";
import Logger from "../utils/Logger";

/**
 * Manager of .env config.
 */
export default class DotEnvConfig {
  private static log_header = "DotEnvConfig";
  private static instance?: DotEnvConfig;

  private constructor() {}

  public static init() {
    try {
      dotenv.config();

      const args = ArgumentsManager.parseToDotEnv();
      if (Object.entries(args).length) ArgumentsManager.overrideEnv(args);

      this.instance = this.instance || new DotEnvConfig();

      for (const [arg, val] of Object.entries(arguments_matches)) {
        const check_param = this.instance.get_param(
          arg as Uppercase<string>,
          !val.optional
        );
        if (check_param && !val.template.test(check_param)) {
          Logger.printFatal(
            DotEnvConfig.log_header,
            `Incorrect config value for ${arg} was specified: ${check_param}`
          );
        }
      }

      return this.instance;
    } catch (err) {
      Logger.printError(DotEnvConfig.log_header, String(err));
      process.exit(1);
    }
  }

  public get_param(key: Uppercase<string>, throwable = true): string | null {
    let error;

    if (!process?.env?.[key] || !process?.env?.[key]!.length)
      error = `Key ${key} was not specified!`;

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
