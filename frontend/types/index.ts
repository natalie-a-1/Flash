// Re-export all types for easier imports
export * from './contracts';

// App-specific types
export interface User {
  address: string;
  balance?: string;
  ensName?: string | null;
}

// MetaMask types
export interface MetaMaskEthereumProvider {
  isMetaMask?: boolean;
  once(eventName: string | symbol, listener: (...args: any[]) => void): this;
  on(eventName: string | symbol, listener: (...args: any[]) => void): this;
  off(eventName: string | symbol, listener: (...args: any[]) => void): this;
  addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeAllListeners(eventName?: string | symbol): this;
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
} 