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
          Logger.printSuccess("Client connected to the server!");
          this.connected = ws;
          ws.on("message", (message: Buffer) => this.handleResponse(message));
          ws.on("error", (err) => {
            Events.emitCheckable(EVENTS.exit, err);
          });
          ws.on("close", () => {
            Events.emit(EVENTS.exit, "Connection with client closed suddenly!");
          });
        });
        this.server.on("listening", () => {
          const address = this.getAddressKey("address");
          const port = this.getAddressKey("port");
          Logger.printSuccess(`Server is running on ${address}:${port}`);
          resolve();
        });
        this.server.on("close", () => {
          Logger.printInfo("Socket closed... exiting");
          Events.emit(EVENTS.exit);
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
        Events.emit(
          EVENTS.exit,
          `Unkown received message type when loaded chunks`
        );
        return;
      }
      target_listener(translated);
    } else {
      const target_listener: (data?: RecorderData) => void | undefined =
        this.listeners?.[translated!.type];
      if (!target_listener) {
        Events.emit(
          EVENTS.exit,
          `Unkown received message type: ${translated.type}`
        );
        return;
      }

      target_listener(translated.data);
    }
  }

  public send(message: string) {
    if (!this.isConnected()) {
      Logger.printWarning("No connected clients. Rejecting send message.");
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
    const params = this.server.address() as AddressInfo;
    const target_key = params?.[key as keyof typeof params];
    if (target_key) return target_key;
    return null;
  }
}
