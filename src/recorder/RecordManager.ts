import { EVENTS, RecorderData } from "../models/Models";
import Logger from "../utils/Logger";
import path from "node:path";
import {
  checkAccessToPath,
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
export default class RecordManager {
  public activated: boolean;
  private ready = false;
  private path: string;
  private output_stream?: fs.WriteStream;

  constructor() {
    this.activated = Config.get_param("RECORD_TAB", false) === "true";
    const user_path = Config.get_param("OUTPUT_RECORD_TAB", false);
    const current_date = splitDate();
    const filename = `\
/records/output_video_\
${current_date.day}_\
${current_date.month}_\
${current_date.year}_\
${current_date.h}_\
${current_date.m}_\
${current_date.s}.mp4`;
    this.path =
      user_path && checkAccessToPath(user_path)
        ? user_path
        : path.join(__dirname, filename);
  }

  /**
   * Init all required options, events and socket.
   * @returns Promise<void>
   */
  public async init() {
    if (!this.activated) {
      Logger.printInfo("Recorder disabled, skip...");
      return;
    }
    await Socket.init();

    Socket.on(EVENTS.record_ready, () => {
      this.ready = true;
      this.output_stream = fs.createWriteStream(this.path);
    });
    Socket.on(EVENTS.record_chunk, (data?: RecorderData | Buffer) => {
      if (!Buffer.isBuffer(data)) return;

      this.output_stream?.write(data);
    });
    Socket.on(EVENTS.record_error, (data?: RecorderData | Buffer) => {
      if (Buffer.isBuffer(data)) return;
      if (!data?.error) {
        Events.emit(EVENTS.exit, "Unkown recorder error!");
        return;
      }
      Events.emit(EVENTS.exit, `Recorder error: ${data!.error}`);
    });
  }

  /**
   * Awaits untill socket respond ready signal.
   * If socket didn't returned ready signal for 30s, reject performs as well.
   * @returns Promise<void>
   */
  public async awaitForSocketReady() {
    try {
      if (this.activated) {
        await timeoutWhileCondition(() => this.ready, 30000);
        Logger.printInfo("Recorder is ready.");
      }
      return Promise.resolve();
    } catch (err) {
      throw new Error(
        `Couldn't connect record socket: ${(err as Error).message || err}`
      );
    }
  }

  /**
   * Sends start record signal into MediaStream on Chrome Extension.
   * @returns void
   */
  public startRecord() {
    return new Promise<void>((resolve) => {
      try {
        if (!this.checkAvailable()) return;
        if (!this.output_stream) {
          Events.emit(
            EVENTS.exit,
            "Coudn't start record: output stream is not open!"
          );
        } else {
          Socket.send(EVENTS.record_start);
          Logger.printHeader("RecordManager", "Started recording...");
        }
        resolve();
      } catch (err) {
        Events.emit(EVENTS.exit, String(err));
      }
    });
  }

  /**
   * Sends stop record signal into MediaStream on Chrome Extension.
   * @returns void
   */
  public stopRecord() {
    return new Promise<void>((resolve, reject) => {
      if (!this.checkAvailable()) resolve();
      else {
        if (!this.output_stream) {
          reject(new Error("Coudn't stop record: output stream is not open!"));
        } else {
          Socket.send(EVENTS.record_stop);
          Socket.on(EVENTS.record_finished, async () => {
            Logger.printHeader(
              "RecordManager",
              `Your video record saved successfully in ${this.path}`
            );
            this.output_stream?.close();
            this.activated = false;
            await Socket.closeConnection();
            resolve();
          });
        }
      }
    });
  }

  /**
   * Sends signal to Chrome Extension, that opends popup to choose tab record to.
   * If user does not choose a tab for 1 minute, timeout throws as well.
   * @returns Promise<void>
   */
  public chooseStream() {
    return new Promise<void>((resolve, reject) => {
      if (this.checkAvailable()) {
        Logger.printHeader(
          "RecordManager",
          "Choose stream for browser. (waiting for 1 minute...)"
        );
        let choosed = false;
        Socket.send(EVENTS.record_choose_stream);
        Socket.on(EVENTS.record_stream_choosed, () => (choosed = true));
        timeoutWhileCondition(() => choosed, 60000)
          .then(() => {
            Logger.printHeader("RecordManager", "Stream choosed");
            resolve();
          })
          .catch((err) => reject(err));
      } else resolve();
    });
  }

  /**
   * Awaits for record output save is done.
   * @returns Promise<void>
   */
  public awaitFileSaving() {
    return new Promise<void>((resolve) => {
      if (!this.activated) resolve();
      else {
        const timeout = setTimeout(() => {
          Events.emitCheckable(EVENTS.exit, "Timeout of saving video!");
        }, 20000);
        Events.once(EVENTS.record_finished, () => {
          clearTimeout(timeout);
          resolve();
        });
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
