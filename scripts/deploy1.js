const { Wallet } = require("ethers");
const { ethers } = require("hardhat");

async function main() {

  [deployer] = await ethers.getSigners();
  ContractFactoryA = await ethers.getContractFactory("Signature");
  Signature = await ContractFactoryA.deploy();

  const privateKey1 = "0xc678ef1aa456da65c6fc5861d44892cdfac0c6c8c2560bf0c9fbcdae2f4735a9";
  let Wallet_1 = new ethers.Wallet(privateKey1, deployer.provider);
  console.log(Wallet_1.address);
  let message = "Hello, world";
  let flatSig = await Wallet_1.signMessage(message);
// A signed message is prefixd with "\x19Ethereum signed message:\n" and the length of the message, using the hashMessage method, so that it is EIP-191 compliant. If recovering the address in Solidity, this prefix will be required to create a matching hash.

  let sig = ethers.utils.splitSignature(flatSig);
  console.log(sig);
  let hash = ethers.utils.hashMessage(message);
// gg, hashMessage made this one easy

  let result = await Signature.recover(hash, sig.v, sig.r, sig.s);
  console.log(result);  
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });