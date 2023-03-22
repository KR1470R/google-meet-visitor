import { COLORS } from "./Util";

export default class Logger {
  public static printHeader(head: string, content?: string) {
    const head_text = `${COLORS.HEADER}${head}`;
    const body_text = `-> ${COLORS.OKBLUE}${content}${COLORS.ENDC}`;
    console.log(head_text, content ? body_text : "");
  }

  public static printSuccess(content: string) {
    console.log(`${COLORS.OKGREEN}${content}${COLORS.ENDC}`);
  }

  public static printError(content: string) {
    console.log(`${COLORS.FAIL}${content}${COLORS.ENDC}`);
  }

  public static printWarning(content: string) {
    console.log(`${COLORS.WARNING}${content}${COLORS.ENDC}`);
  }

  public static printInfo(content: string) {
    console.log(`${COLORS.OKBLUE}${COLORS.BOLD}${content}${COLORS.ENDC}`);
  }
}
