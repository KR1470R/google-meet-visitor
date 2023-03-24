import { EventEmitter } from "events";
import Logger from "./Logger";
import process from "process";

export default class EventEmitterExtended extends EventEmitter {
  constructor() {
    super();
    this.emit;
  }

  public emitCheckable(event_name: string, content?: string) {
    if (!this.listenerCount(event_name)) {
      if (content) Logger.printError(content);
      process.exit(1);
    } else this.emit(event_name, content);
  }
}
