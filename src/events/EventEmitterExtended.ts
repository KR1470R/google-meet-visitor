import { EventEmitter } from "events";
import Logger from "../utils/Logger";
import process from "process";

export default class EventEmitterExtended extends EventEmitter {
  constructor() {
    super();
  }

  public emitCheckable(
    event: string,
    content?: string | Error,
    log_header = "EventEmmiter"
  ) {
    if (!this.listenerCount(event)) {
      if (content) Logger.printFatal(log_header, String(content));
      process.exit(1);
    } else this.emit(event, String(content));
  }
}
