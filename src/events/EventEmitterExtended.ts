import { EventEmitter } from "events";
import Logger from "../utils/Logger";
import process from "process";

export default class EventEmitterExtended extends EventEmitter {
  private static instance?: EventEmitterExtended;

  private constructor() {
    super();
  }

  public static init() {
    return this.instance || (this.instance = new EventEmitterExtended());
  }

  public emitCheckable(
    event: string,
    content?: string | Error,
    log_header = "EventEmmiter"
  ) {
    if (!this.listenerCount(event)) {
      Logger.printFatal(log_header, `No listeners found for ${event}!`);
      if (content) Logger.printFatal(log_header, String(content));
      process.exit(1);
    } else this.emit(event, String(content));
  }
}
