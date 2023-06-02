import { EVENTS, RecorderData, IRecordManager } from "../models/Models";
import Logger from "../utils/Logger";
import path from "node:path";
import {
  isDirExist,
  Events,
  splitDate,
  Socket,
  timeoutWhileCondition,
  Config,
} from "../utils/Util";
import * as fs from "node:fs";

/**
 * Record Manager that provide controll Media Stream from Chrome extension and its output saving.
 */
export default class RecordManager implements IRecordManager {
  private readonly log_header = "Recorder";
  private output_stream?: fs.WriteStream;
  private path?: string;
  private activated: boolean;
  private ready = false;
  private is_stream_choosed = false;

  constructor() {
    this.activated = Config.get_param("RECORD_TAB", false) === "true";
    const user_folder = Config.get_param("OUTPUT_RECORD_TAB", false);
    const default_folder = path.resolve(__dirname, "records");
    const current_date = splitDate();
    const filename = `\
output_video_\
${current_date.day}_\
${current_date.month}_\
${current_date.year}_\
${current_date.h}_\
${current_date.m}_\
${current_date.s}.mp4`;
    const target_folder = user_folder || default_folder;
    if (isDirExist(target_folder)) {
      this.path = path.resolve(__dirname, target_folder, filename);
    } else {
      Events.emitCheckable(
        EVENTS.exit,
        `Output folder for records does not exist - ${target_folder}`,
        this.log_header
      );
    }
  }

  public init() {
    if (!this.activated) {
      Logger.printInfo(this.log_header, "Disabled.");
      return;
    }

    Socket.on(EVENTS.record_ready, () => {
      this.ready = true;
      this.output_stream = fs.createWriteStream(this.path!);
    });
    Socket.on(EVENTS.record_chunk, (data?: RecorderData | Buffer) => {
      if (!Buffer.isBuffer(data)) return;

      this.output_stream?.write(data);
    });
    Socket.on(EVENTS.record_error, async (data?: RecorderData | Buffer) => {
      if (Buffer.isBuffer(data)) return;

      await Socket.closeConnection();
      if (!data?.error) {
        Events.emitCheckable(
          EVENTS.exit,
          "Unkown recorder error!",
          this.log_header
        );
        return;
      }
      Events.emitCheckable(
        EVENTS.exit,
        `Recorder error: ${data!.error}`,
        this.log_header
      );
    });
    Socket.on(EVENTS.record_finished, async () => {
      Logger.printInfo(
        this.log_header,
        `Your video record saved successfully in ${this.path}`
      );
      this.output_stream?.close();
      this.ready = false;
      await Socket.closeConnection();
    });
  }

  public async awaitForSocketReady() {
    try {
      if (this.activated) {
        Logger.printInfo(
          this.log_header,
          "Awaiting for 1 minute while client connect."
        );
        await timeoutWhileCondition(() => this.ready, 60000);
        Logger.printInfo(this.log_header, "Ready to start.");
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
          this.log_header,
          "Choose stream for browser. (waiting for 1 minute...)"
        );
        Socket.send(EVENTS.record_choose_stream);
        Socket.on(
          EVENTS.record_stream_choosed,
          () => (this.is_stream_choosed = true)
        );
        timeoutWhileCondition(() => this.is_stream_choosed, 60000)
          .then(() => {
            Logger.printInfo(this.log_header, "Stream choosed");
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
          if (!this.output_stream) {
            Events.emitCheckable(
              EVENTS.exit,
              "Coudn't start record: output stream is not open!",
              this.log_header
            );
          } else {
            Socket.send(EVENTS.record_start);
            Logger.printInfo(this.log_header, "Started recording...");
          }
          resolve();
        }
      } catch (err) {
        Events.emitCheckable(EVENTS.exit, String(err), this.log_header);
      }
    });
  }

  public stopRecord() {
    return new Promise<void>((resolve, reject) => {
      if (!this.checkAvailable()) resolve();
      else {
        if (!this.output_stream) {
          reject(new Error("Coudn't stop record: output stream is not open!"));
        } else {
          if (!this.is_stream_choosed) {
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
    if (!this.activated || !Socket.isConnected() || !this.ready) return false;
    return true;
  }
}
