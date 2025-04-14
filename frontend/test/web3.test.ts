/// <reference types="mocha" />
/// <reference types="chai" />

import { expect } from 'chai';
import { getWeb3, getEthersProvider, getNetworkDetails, getAccounts, isSepoliaNetwork, switchToSepolia } from '../lib/web3/web3';

describe('Web3 Integration', () => {
  describe('getWeb3', () => {
    it('should initialize Web3 with MetaMask provider', async () => {
      const web3 = await getWeb3();
      expect(web3).to.exist;
      expect(web3.currentProvider).to.exist;
    });
  });

  describe('getEthersProvider', () => {
    it('should initialize ethers provider with MetaMask', async () => {
      const provider = await getEthersProvider();
      expect(provider).to.exist;
    });
  });

  describe('getNetworkDetails', () => {
    it('should get the current network ID', async () => {
      const { id } = await getNetworkDetails();
      expect(Number(id)).to.equal(11155111);
    });
  });

  describe('getAccounts', () => {
    it('should get the connected accounts', async () => {
      const web3 = await getWeb3();
      const accounts = await getAccounts(web3);
      expect(accounts).to.be.an('array');
      expect(accounts[0]).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe('isSepoliaNetwork', () => {
    it('should detect if connected to Sepolia network', async () => {
      const isSepolia = await isSepoliaNetwork();
      expect(isSepolia).to.be.a('boolean');
    });
  });

  describe('switchToSepolia', () => {
    it('should request network switch to Sepolia', async () => {
      const result = await switchToSepolia();
      expect(result).to.be.a('boolean');
    });
  });
}); 