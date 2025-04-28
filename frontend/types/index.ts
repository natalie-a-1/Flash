/**
 * Re-export all types from the contracts module for easier imports.
 */
export * from "./contracts";

/**
 * Represents a user within the application.
 */
export interface User {
  /** The Ethereum address of the user. */
  address: string;
  /** The balance of the user, optional. */
  balance?: string;
  /** The ENS (Ethereum Name Service) name of the user, optional. */
  ensName?: string | null;
}

/**
 * Interface for the MetaMask Ethereum provider.
 * Provides methods for interacting with the Ethereum blockchain.
 */
export interface MetaMaskEthereumProvider {
  /** Indicates if the provider is MetaMask. */
  isMetaMask?: boolean;
  /**
   * Registers a one-time event listener.
   * @param eventName - The name of the event.
   * @param listener - The callback function to execute when the event is triggered.
   */
  once(eventName: string | symbol, listener: (...args: any[]) => void): this;
  /**
   * Registers an event listener.
   * @param eventName - The name of the event.
   * @param listener - The callback function to execute when the event is triggered.
   */
  on(eventName: string | symbol, listener: (...args: any[]) => void): this;
  /**
   * Removes an event listener.
   * @param eventName - The name of the event.
   * @param listener - The callback function to remove.
   */
  off(eventName: string | symbol, listener: (...args: any[]) => void): this;
  /**
   * Adds an event listener.
   * @param eventName - The name of the event.
   * @param listener - The callback function to execute when the event is triggered.
   */
  addListener(
    eventName: string | symbol,
    listener: (...args: any[]) => void,
  ): this;
  /**
   * Removes a specific event listener.
   * @param eventName - The name of the event.
   * @param listener - The callback function to remove.
   */
  removeListener(
    eventName: string | symbol,
    listener: (...args: any[]) => void,
  ): this;
  /**
   * Removes all listeners for a specific event.
   * @param eventName - The name of the event, optional.
   */
  removeAllListeners(eventName?: string | symbol): this;
  /**
   * Sends a request to the Ethereum provider.
   * @param args - The request arguments, including method and parameters.
   * @returns A promise that resolves to the result of the request.
   */
  request(args: {
    method: string;
    params?: unknown[] | object;
  }): Promise<unknown>;
}
