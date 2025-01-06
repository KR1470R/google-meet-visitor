import { AddressInfo, WebSocket, WebSocketServer } from "ws";
import { Config, Events, Logger, translateResponse } from "../utils";
import { RecorderData } from "../types";
import { EVENTS } from "../constants";
import findFeePort from "../libs/find-fee-port";
import { IWSServer } from "./interfaces";

/**
 * Server that handle Chrome Extension requests.
 */
export default class WSServer implements IWSServer {
  private readonly logHeader = "Socket";
  private server!: WebSocketServer;
  private config!: Record<string, string | number>;
  private connected?: WebSocket;
  private listeners: Record<string, (data?: RecorderData | Buffer) => void> =
    {};
  private shouldClose = false;

  constructor() {}

  public init() {
    return new Promise<void>((resolve) => {
      if (Config.get("RECORD_TAB", false) !== "true") {
        resolve();
      } else {
        findFeePort("localhost").then((free_port: number | number[]) => {
          this.config = {
            host: "localhost",
            port: free_port as number,
          };
          this.server = new WebSocketServer(this.config);

          this.server.on("connection", (ws: WebSocket) => {
            Logger.printInfo(this.logHeader, "Client connected to the server!");
            this.connected = ws;

            ws.on("message", (message: Buffer) => this.handleResponse(message));

            ws.on("error", (err) => {
              Events.emitCheckable(EVENTS.exit, err, this.logHeader);
            });

            ws.on("close", (code: number, reason: Buffer) => {
              const reason_translated = translateResponse(reason);
              if (!this.shouldClose) {
                Events.emitCheckable(
                  EVENTS.exit,
                  `Connection with client closed suddenly: ${reason_translated}(status: ${code})`,
                  this.logHeader
                );
              }
            });
          });

          this.server.on("listening", () => {
            const address = "localhost"; //this.getAddressKey("address");
            const port = this.getAddressKey("port");
            Logger.printInfo(
              this.logHeader,
              `Open for client connection at ${address}:${port}.`
            );
            resolve();
          });

          this.server.on("close", () => {
            Logger.printInfo(this.logHeader, "Closed.");
            if (!this.shouldClose) Events.emitCheckable(EVENTS.exit);
          });
        });
      }
    });
  }

  public closeConnection() {
    return new Promise<void>((resolve) => {
      if (this.isConnected()) {
        Logger.printInfo(this.logHeader, "Closing connection...");
        this.shouldClose = true;
        this.connected!.close();
        this.connected = undefined;
        this.server.close(() => {
          resolve();
        });
      }
    });
  }

  public send(message: string) {
    if (!this.isConnected()) {
      Logger.printWarning(
        this.logHeader,
        "No connected clients. Rejecting send message."
      );
      return;
    }
    this.connected!.send(message);
  }

  public on(type: string, listener: (data?: RecorderData | Buffer) => void) {
    this.listeners[type] = listener;
  }

  public isConnected() {
    return this.connected ? true : false;
  }

  public getAddressKey(key: "address" | "port"): string | number | null {
    const params = this.server?.address() as AddressInfo;
    const target_key = params?.[key as keyof typeof params];
    if (target_key) return target_key;

    return null;
  }

  private handleResponse(response: Buffer) {
    if (!Object.keys(this.listeners).length) return;

    const translated = translateResponse(response);
    if (Buffer.isBuffer(translated)) {
      const targetListener = this.listeners?.[EVENTS.record_chunk];
      if (!targetListener) {
        Events.emitCheckable(
          EVENTS.exit,
          `Unkown received message type when loaded chunks`,
          this.logHeader
        );
        return;
      }

      targetListener(translated);
    } else {
      const targetListener: (data?: RecorderData) => void | undefined =
        this.listeners?.[translated!.type];
      if (!targetListener) {
        Events.emitCheckable(
          EVENTS.exit,
          `Unkown received message type: ${translated.type}`,
          this.logHeader
        );
        return;
      }

      targetListener(translated.data);
    }
  }
}
