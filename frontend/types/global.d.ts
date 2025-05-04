import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum: any;
    ethers: typeof ethers;
    flashLoanContract?: ethers.Contract | null;
  }
}

export {}; 