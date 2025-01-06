import { RecorderData } from "../types";
import { EVENTS } from "../constants";
import { IRecordManager } from "./interfaces";
import {
  Config,
  Events,
  isDirExist,
  Logger,
  Socket,
  splitDate,
  timeoutWhileCondition,
} from "../utils";
import path from "node:path";
import * as fs from "node:fs";

/**
 * Record Manager that provide controll Media Stream from Chrome extension and its output saving.
 */
export default class RecordManager implements IRecordManager {
  private readonly logHeader = "Recorder";
  private outputStream?: fs.WriteStream;
  private path?: string;
  private isActivated: boolean;
  private ready = false;
  private isStreamChosen = false;

  constructor() {
    this.isActivated = Config.get("RECORD_TAB", false) === "true";
    const userDir = Config.get("OUTPUT_RECORD_TAB", false);
    const defaultDir = path.resolve(__dirname, "records");
    const currentDate = splitDate();
    const filename = `\
output_video_\
${currentDate.day}_\
${currentDate.month}_\
${currentDate.year}_\
${currentDate.h}_\
${currentDate.m}_\
${currentDate.s}.mp4`;
    const targetDir = userDir || defaultDir;
    if (isDirExist(targetDir)) {
      this.path = path.resolve(__dirname, targetDir, filename);
    } else {
      Events.emitCheckable(
        EVENTS.exit,
        `Output folder for records does not exist - ${targetDir}`,
        this.logHeader
      );
    }
  }

  public init() {
    if (!this.isActivated) {
      Logger.printInfo(this.logHeader, "Disabled.");
      return;
    }

    Socket.on(EVENTS.record_ready, () => {
      this.ready = true;
      this.outputStream = fs.createWriteStream(this.path!);
    });
    Socket.on(EVENTS.record_chunk, (data?: RecorderData | Buffer) => {
      if (!Buffer.isBuffer(data)) return;

      this.outputStream?.write(data);
    });
    Socket.on(EVENTS.record_error, async (data?: RecorderData | Buffer) => {
      if (Buffer.isBuffer(data)) return;

      await Socket.closeConnection();
      if (!data?.error) {
        Events.emitCheckable(
          EVENTS.exit,
          "Unkown recorder error!",
          this.logHeader
        );
        return;
      }
      Events.emitCheckable(
        EVENTS.exit,
        `Recorder error: ${data!.error}`,
        this.logHeader
      );
    });
    Socket.on(EVENTS.record_finished, async () => {
      Logger.printInfo(
        this.logHeader,
        `Your video record saved successfully in ${this.path}`
      );
      this.outputStream?.close();
      this.ready = false;
      await Socket.closeConnection();
    });
  }

  public async awaitForSocketReady() {
    try {
      if (this.isActivated) {
        Logger.printInfo(
          this.logHeader,
          "Awaiting for 1 minute while client connect."
        );
        await timeoutWhileCondition(() => this.ready, 60000);
        Logger.printInfo(this.logHeader, "Ready to start.");
      }
      return Promise.resolve();
    } catch (err) {
      throw new Error(
        `Couldn't connect record socket: ${(err as Error).message || err}`
      );
    }
  }

  public chooseStream() {
    return new Promise<void>((resolve, reject) => {
      if (this.checkAvailable()) {
        Logger.printInfo(
          this.logHeader,
          "Choose stream for browser. (waiting for 1 minute...)"
        );
        Socket.send(EVENTS.record_choose_stream);
        Socket.on(
          EVENTS.record_stream_choosed,
          () => (this.isStreamChosen = true)
        );
        timeoutWhileCondition(() => this.isStreamChosen, 60000)
          .then(() => {
            Logger.printInfo(this.logHeader, "Stream choosed");
            resolve();
          })
          .catch((err) => reject(err));
      } else resolve();
    });
  }

  public startRecord() {
    return new Promise<void>((resolve) => {
      try {
        if (!this.checkAvailable()) resolve();
        else {
          if (!this.outputStream) {
            Events.emitCheckable(
              EVENTS.exit,
              "Coudn't start record: output stream is not open!",
              this.logHeader
            );
          } else {
            Socket.send(EVENTS.record_start);
            Logger.printInfo(this.logHeader, "Started recording...");
          }
          resolve();
        }
      } catch (err) {
        Events.emitCheckable(EVENTS.exit, String(err), this.logHeader);
      }
    });
  }

  public stopRecord() {
    return new Promise<void>((resolve, reject) => {
      if (!this.checkAvailable()) resolve();
      else {
        if (!this.outputStream) {
          reject(new Error("Coudn't stop record: output stream is not open!"));
        } else {
          if (!this.isStreamChosen) {
            resolve();
          } else {
            Socket.send(EVENTS.record_stop);
            timeoutWhileCondition(() => !this.ready, 10000).then(() => {
              resolve();
            }, reject);
          }
        }
      }
    });
  }

  /**
   * Checks if RecorderManager actived, is connected to socket and is socket ready.
   * @returns boolean or error.
   */
  private checkAvailable(): boolean | never {
    if (!this.isActivated || !Socket.isConnected() || !this.ready) return false;
    return true;
  }
}
