import { EventEmitter } from "events";
import { Logger } from "../utils";
import process from "process";
import { EVENTS } from "../constants";

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
    logHeader = "EventEmmiter"
  ) {
    if (!this.listenerCount(event)) {
      if (event !== EVENTS.exit)
        Logger.printFatal(logHeader, `No listeners found for ${event}!`);

      if (content) Logger.printFatal(logHeader, String(content));
      process.exit(1);
    } else this.emit(event, String(content));
  }
}
