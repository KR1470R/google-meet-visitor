import { EventEmitter } from "events";
import Logger from "../utils/Logger";
import process from "process";

export default class EventEmitterExtended extends EventEmitter {
  constructor() {
    super();
  }

  public emitCheckable(event: string, content?: string) {
    if (!this.listenerCount(event)) {
      if (content) Logger.printError(content);
      process.exit(1);
    } else this.emit(event, content);
  }
}
