import { arguments_matches } from "../models/Models";
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

      const dot_env_template: DotenvParseOutput = {};

      for (const arg of args) {
        const parsed = arg.split("=");
        if (parsed.length > 2) throw new Error(`Invalid argument: '${arg}'!`);

        const arg_name = parsed[0];
        const arg_val = parsed[1];

        for (const [opt_name, opt_val] of Object.entries(arguments_matches)) {
          if (opt_val.flags.includes(arg_name)) {
            if (opt_val.type === "argument") {
              if (!arg_val)
                throw new Error(
                  `Failed in parsing argument '${arg_name}', you must specify a value. Use it in this signature '${arg_name}=<arg_value>'`
                );

              dot_env_template[opt_name] = arg_val;
            } else if (opt_val.type === "flag") {
              if (arg_val)
                throw new Error(
                  `Failed in parsing argument '${arg_name}', you mustn't specify a value for this argument. Use it just like a flag.`
                );

              dot_env_template[opt_name] = "true";
            }
          }
        }
      }

      return dot_env_template;
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
    for (const [opt_name, opt_val] of Object.entries(arguments_matches)) {
      help += `${opt_val.flags.join(" or ")} overrides ${opt_name}\n`;
    }
    return help;
  }
}
