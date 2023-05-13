import pino from "pino";
import { Config } from "./Util";

const log = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "yyyy-mm-dd HH:MM:ss:ms",
    },
  },
});

/**
 * Util that outputs messages in prettyfied view in different cases.
 */
export default class Logger {
  public static printInfo(header: string, content: string) {
    log.info(`[${header}] -> ${content}`);
  }

  public static printWarning(header: string, content: string) {
    log.warn(`[${header}] -> ${content}`);
  }

  public static printError(header: string, content: string) {
    if (
      typeof Config === "undefined"
        ? false
        : Config.get_param("IGNORE_ERRORS", false) === "true"
    )
      return;
    log.error(`[${header}] -> ${content}`);
  }

  public static printFatal(header: string, content: string) {
    log.fatal(`[${header}] -> ${content}`);
  }
}
