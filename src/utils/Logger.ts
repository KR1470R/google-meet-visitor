import { getDateString } from "./Util";
import { COLORS } from "../models/Models";

/**
 * Util that outputs messages in prettyfied view in different cases.
 */
export default class Logger {
  /**
   * Prints out message with header.
   * @param head header of message
   * @param content body of a message
   */
  public static printHeader(head: string, content?: string) {
    const head_text = `${COLORS.HEADER}${head}`;
    const body_text = `-> ${COLORS.OKBLUE}${content}${COLORS.ENDC}`;
    console.log(getDateString(), head_text, content ? body_text : "");
  }

  /**
   * Prints out message with green color font.
   * @param content
   */
  public static printSuccess(content: string) {
    console.log(
      `${COLORS.OKGREEN}${getDateString()}-[SUC] ${content}${COLORS.ENDC}`
    );
  }

  /**
   * Prints out message with red color font.
   * @param content
   */
  public static printError(content: string) {
    console.log(
      `${COLORS.FAIL}${getDateString()}-[ERR] ${content}${COLORS.ENDC}`
    );
  }

  /**
   * Prints out message with orange color font.
   * @param content
   */
  public static printWarning(content: string) {
    console.log(
      `${COLORS.WARNING}${getDateString()}-[WARN] ${content}${COLORS.ENDC}`
    );
  }

  /**
   * Prints out message with blue color font.
   * @param content
   */
  public static printInfo(content: string) {
    console.log(
      `${COLORS.OKBLUE}${getDateString()}-[INF] ${COLORS.BOLD}${content}${
        COLORS.ENDC
      }`
    );
  }
}
