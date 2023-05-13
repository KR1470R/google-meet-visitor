import { SignalCallbackType } from "../models/Models";
import Logger from "./Logger";

/**
 * Process signal handler
 * Executes callbacks before program will be terminated because of unhandled error or user interruption.
 */
export default class SignalManager {
  private readonly log_header = "SignalManager";
  private readonly timeout = 60000;
  private callbacks: SignalCallbackType[];
  private normal_exit_signals = ["SIGINT", "SIGQUIT", "SIGTERM"];
  private error_exit_signals = ["uncaughtException", "unhandledRejection"];
  public already_catched = false;

  constructor() {
    this.callbacks = [];
  }

  public addCallback(callback: SignalCallbackType) {
    this.callbacks.push(callback);
  }

  public listenEvents(exit: boolean) {
    if (!this.callbacks.length) return;

    let status_code: 0 | 1 = 0;

    for (const normal_signal of this.normal_exit_signals) {
      process.on(normal_signal, () => {
        if (this.already_catched) return;

        this.already_catched = true;

        setTimeout(() => process.exit(status_code), this.timeout);

        Logger.printWarning(
          this.log_header,
          "Interrupted by user! Performing last operations..."
        );

        Promise.allSettled(this.callbacks.map((call) => call())).then(() => {
          process.exit(status_code);
        });
      });
    }

    for (const error_signal of this.error_exit_signals) {
      process.on(error_signal, (err) => {
        if (this.already_catched) return;

        this.already_catched = true;

        setTimeout(() => process.exit(status_code), this.timeout);

        Logger.printWarning(
          this.log_header,
          `Interrupted by unhandled exception! Performing last operations...\nERROR:${err.name}: ${err.stack}`
        );

        Promise.allSettled(this.callbacks).then(() => {
          status_code = 1;
          process.exit(status_code);
        });
      });
    }

    if (exit) process.exit(status_code);
  }
}
