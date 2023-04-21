import { WebSocketServer, AddressInfo, WebSocket } from "ws";
import Logger from "../utils/Logger";
import { Events, translateResponse } from "../utils/Util";
import { EVENTS, RecorderData } from "../models/Models";
import findFreePort from "../lib/findFreePort";

/**
 * Server that handle Chrome Extension requests.
 */
export default class WSServer {
  public server!: WebSocketServer;
  private config!: Record<string, string | number>;
  private connected?: WebSocket;
  private listeners: Record<string, (data?: RecorderData | Buffer) => void> =
    {};
  private shouldClose = false;
  private log_header = "Socket";

  constructor() {}

  public init() {
    return new Promise<void>((resolve) => {
      findFreePort("localhost").then((free_port: number | number[]) => {
        this.config = {
          host: "localhost",
          port: free_port as number,
        };
        this.server = new WebSocketServer(this.config);

        this.server.on("connection", (ws: WebSocket) => {
          Logger.printInfo(this.log_header, "Client connected to the server!");
          this.connected = ws;
          ws.on("message", (message: Buffer) => this.handleResponse(message));
          ws.on("error", (err) => {
            Events.emitCheckable(EVENTS.exit, err, this.log_header);
          });
          ws.on("close", (code: number, reason: Buffer) => {
            const reason_translated = translateResponse(reason);
            if (!this.shouldClose) {
              Events.emitCheckable(
                EVENTS.exit,
                `Connection with client closed suddenly: ${reason_translated}(status: ${code})`,
                this.log_header
              );
            }
          });
        });
        this.server.on("listening", () => {
          const address = this.getAddressKey("address");
          const port = this.getAddressKey("port");
          Logger.printInfo(
            this.log_header,
            `Open for client connection at ${address}:${port}.`
          );
          resolve();
        });
        this.server.on("close", () => {
          Logger.printInfo(this.log_header, "Closed.");
          if (!this.shouldClose) Events.emitCheckable(EVENTS.exit);
        });
      });
    });
  }

  private handleResponse(response: Buffer) {
    if (!Object.keys(this.listeners).length) return;

    const translated = translateResponse(response);
    if (Buffer.isBuffer(translated)) {
      const target_listener = this.listeners?.[EVENTS.record_chunk];
      if (!target_listener) {
        Events.emitCheckable(
          EVENTS.exit,
          `Unkown received message type when loaded chunks`,
          this.log_header
        );
        return;
      }
      target_listener(translated);
    } else {
      const target_listener: (data?: RecorderData) => void | undefined =
        this.listeners?.[translated!.type];
      if (!target_listener) {
        Events.emitCheckable(
          EVENTS.exit,
          `Unkown received message type: ${translated.type}`,
          this.log_header
        );
        return;
      }

      target_listener(translated.data);
    }
  }

  public closeConnection() {
    return new Promise<void>((resolve) => {
      if (this.isConnected()) {
        Logger.printInfo(this.log_header, "Closing connection...");
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
        this.log_header,
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

  public getAddressKey(key: string): string | number | null {
    const params = this.server?.address() as AddressInfo;
    const target_key = params?.[key as keyof typeof params];
    if (target_key) return target_key;
    return null;
  }
}
