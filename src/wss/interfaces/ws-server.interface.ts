import { RecorderData } from "../../types";

export default interface IWSServer {
  /**
   * Initialize WebSocket server.
   * @returns Promise<void>
   */
  init: () => Promise<void>;

  /**
   * Close WebSocket server.
   * @returns Promise<void>
   */
  closeConnection: () => Promise<void>;

  /**
   * Send message for the client.
   * @param message
   * @returns void.
   */
  send: (message: string) => void;

  /**
   * Bind listener for the message received from the client.
   * @param type - listener identificator for handle it.
   * @param listener - callback that revokes if client have sent message with such type.
   * @returns void.
   */
  on: (type: string, listener: (data?: RecorderData | Buffer) => void) => void;

  /**
   * Check is WebSocket connected to the client.
   * @returns boolean
   */
  isConnected: () => boolean;

  /**
   * Get address ip or port.
   * @param key
   * @returns
   */
  getAddressKey: (key: "address" | "port") => string | number | null;
}
