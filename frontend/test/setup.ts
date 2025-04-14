import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { MetaMaskEthereumProvider } from '../types';

// Set up a DOM environment for tests
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  runScripts: 'dangerously',
});

// Add global variables that would be available in a browser
global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.location = dom.window.location;

// Mock MetaMask ethereum provider
const mockEthereum: MetaMaskEthereumProvider = {
  isMetaMask: true,
  request: async ({ method, params }: { method: string; params?: any[] }) => {
    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        return ['0x1234567890123456789012345678901234567890'];
      case 'eth_chainId':
        return '0xaa36a7'; // Sepolia testnet (11155111)
      case 'net_version':
        return '11155111'; // Sepolia testnet
      case 'wallet_switchEthereumChain':
        return null;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  },
  on: (eventName: string | symbol, listener: (...args: any[]) => void) => mockEthereum,
  removeListener: (eventName: string | symbol, listener: (...args: any[]) => void) => mockEthereum,
  removeAllListeners: (eventName?: string | symbol) => mockEthereum,
  addListener: (eventName: string | symbol, listener: (...args: any[]) => void) => mockEthereum,
  once: (eventName: string | symbol, listener: (...args: any[]) => void) => mockEthereum,
  off: (eventName: string | symbol, listener: (...args: any[]) => void) => mockEthereum,
};

// Add ethereum property to window
(global.window as any).ethereum = mockEthereum;

// Make expect available globally
(global as any).expect = expect; 