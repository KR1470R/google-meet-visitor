import pino from "pino";
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
    log.info(`[${header}] -> ${content}`);
  }

  public static printFatal(header: string, content: string) {
    log.fatal(`[${header}] -> ${content}`);
  }
}
