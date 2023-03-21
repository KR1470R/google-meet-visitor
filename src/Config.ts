import process from "process";
import dotenv from "dotenv";

dotenv.config();

export default class Config {
  constructor() {}

  public static get_param(key: Uppercase<string>): string {
    if (process?.env?.[key]) return process.env[key]!;
    throw new Error(`ConfigError: Uknown key: ${key}`);
  }
}
