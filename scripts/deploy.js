const { Wallet } = require("ethers");
const { ethers } = require("hardhat");

async function main() {

  // Initialise
  [deployer] = await ethers.getSigners();
  ContractFactoryA = await ethers.getContractFactory("Example");
  Example = await ContractFactoryA.deploy();
  const privateKey1 = "0xc678ef1aa456da65c6fc5861d44892cdfac0c6c8c2560bf0c9fbcdae2f4735a9";
  let Wallet_1 = new ethers.Wallet(privateKey1, deployer.provider);
  console.log("Original address: ", Wallet_1.address);

  //Call test() function 
  let result = await Example.connect(Wallet_1).test();
  console.log(result);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
