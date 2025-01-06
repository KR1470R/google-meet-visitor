import { argumentsMatches } from "../constants";
import { DotenvParseOutput } from "dotenv";

/**
 * Parses CLI arguments specified by user and converts it to dotenv object.\
 * Ex. `npm run start -- --<arg_name>=<arg_value>`
 */
export class ArgumentsManager {
  public static parseToDotEnv(): DotenvParseOutput {
    try {
      const args = process.argv.slice(2);
      if (!args.length) return {};

      const dotEnvTemplate: DotenvParseOutput = {};

      for (const arg of args) {
        const parsed = arg.split("=");
        if (parsed.length > 2) throw new Error(`Invalid argument: '${arg}'!`);

        const argName = parsed[0];
        const argVal = parsed[1];

        for (const [optName, optVal] of Object.entries(argumentsMatches)) {
          if (optVal.flags.includes(argName)) {
            if (optVal.type === "argument") {
              if (!argVal)
                throw new Error(
                  `Failed in parsing argument '${argName}', you must specify a value. Use it in this signature '${argName}=<arg_value>'`
                );

              dotEnvTemplate[optName] = argVal;
            } else if (optVal.type === "flag") {
              if (argVal)
                throw new Error(
                  `Failed in parsing argument '${argName}', you mustn't specify a value for this argument. Use it just like a flag.`
                );

              dotEnvTemplate[optName] = "true";
            }
          }
        }
      }

      return dotEnvTemplate;
    } catch (err) {
      throw `${err}\n${ArgumentsManager.getHelpPage()}`;
    }
  }

  public static overrideEnv(config: DotenvParseOutput) {
    const entries = Object.entries(config);

    for (const [param, value] of entries) process.env[param] = value;
  }

  private static getHelpPage() {
    let help = "";
    for (const [optName, optVal] of Object.entries(argumentsMatches)) {
      help += `${optVal.flags.join(" or ")} overrides ${optName}\n`;
    }
    return help;
  }
}
