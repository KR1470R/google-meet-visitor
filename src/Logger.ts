import { COLORS, getDateString } from "./Util";

export default class Logger {
  public static printHeader(head: string, content?: string) {
    const head_text = `${COLORS.HEADER}${head}`;
    const body_text = `-> ${COLORS.OKBLUE}${content}${COLORS.ENDC}`;
    console.log(getDateString(), head_text, content ? body_text : "");
  }

  public static printSuccess(content: string) {
    console.log(`${COLORS.OKGREEN}${getDateString()} ${content}${COLORS.ENDC}`);
  }

  public static printError(content: string) {
    console.log(`${COLORS.FAIL}${getDateString()} ${content}${COLORS.ENDC}`);
  }

  public static printWarning(content: string) {
    console.log(`${COLORS.WARNING}${getDateString()} ${content}${COLORS.ENDC}`);
  }

  public static printInfo(content: string) {
    console.log(
      `${COLORS.OKBLUE}${getDateString()} ${COLORS.BOLD}${content}${
        COLORS.ENDC
      }`
    );
  }
}
