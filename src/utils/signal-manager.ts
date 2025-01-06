import { SignalCallbackType } from "../types";
import { Logger } from "./index";

/**
 * Process signal observer
 * Executes callbacks before program will be terminated because of unhandled error or user interruption.
 */
export default class SignalManager {
  public alreadyCatched = false;
  private readonly logHeader = "SignalManager";
  private readonly timeout = 60000;
  private callbacks: SignalCallbackType[];
  private normalExitSignals = ["SIGINT", "SIGQUIT", "SIGTERM"];
  private errorExitSignals = ["uncaughtException", "unhandledRejection"];

  constructor() {
    this.callbacks = [];
  }

  public addCallback(callback: SignalCallbackType) {
    this.callbacks.push(callback);
  }

  public listenEvents(exit: boolean) {
    if (!this.callbacks.length) return;

    let status_code: 0 | 1 = 0;

    for (const normalSignal of this.normalExitSignals) {
      process.on(normalSignal, () => {
        if (this.alreadyCatched) return;

        this.alreadyCatched = true;

        setTimeout(() => process.exit(status_code), this.timeout);

        Logger.printWarning(
          this.logHeader,
          "Interrupted by user! Performing last operations..."
        );

        this.settleCallbacks().then(() => {
          process.exit(status_code);
        });
      });
    }

    for (const errorSignal of this.errorExitSignals) {
      process.on(errorSignal, (err) => {
        if (this.alreadyCatched) return;

        this.alreadyCatched = true;

        setTimeout(() => process.exit(status_code), this.timeout);

        Logger.printWarning(
          this.logHeader,
          `Interrupted by unhandled exception! Performing last operations...\nERROR:${err.name}: ${err.stack}`
        );

        this.settleCallbacks().then(() => {
          status_code = 1;
          process.exit(status_code);
        });
      });
    }

    if (exit) process.exit(status_code);
  }

  private settleCallbacks() {
    return Promise.allSettled(this.callbacks.map((call) => call()));
  }
}
