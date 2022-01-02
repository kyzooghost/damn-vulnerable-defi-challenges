const { ether, expectRevert } = require('@openzeppelin/test-helpers');
const { accounts, contract } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

describe("[Challenge] Unstoppable", function () {
  // Ethereum balances
  const ETHER_IN_POOL = ethers.utils.parseEther("1000")

  // Declare variables
  let ContractFactoryA;
  let ContractFactoryB;
  let pool;
  let attackContract;
  let deployer;
  let attacker;
  let otherAccounts;
  let attackerInitialEthBalance;

  beforeEach(async function () {
    //Setup accounts and contracts
    [deployer, attacker, ...otherAccounts] = await ethers.getSigners();
    ContractFactoryA = await ethers.getContractFactory("SideEntranceLenderPool");
    ContractFactoryB = await ethers.getContractFactory("Challenge4Attack2");
    pool = await ContractFactoryA.deploy();
    attackContract = await ContractFactoryB.connect(attacker).deploy();
    await pool.deposit({value: ETHER_IN_POOL});
    attackerInitialEthBalance = await ethers.provider.getBalance(attacker.address);
  })

  it("Pool balance == 1000 ETH", async function() {
    expect(await ethers.provider.getBalance(pool.address)).to.equal(ETHER_IN_POOL);
  })

  it("Exploit!", async function() {
    // Insert exploit function
    
    // attacker to call AttackContract.attack()
    await attackContract.connect(attacker).attack(pool.address);

    // Checks
    expect(await ethers.provider.getBalance(pool.address)).to.equal(0);
    expect(await ethers.provider.getBalance(attacker.address)).to.be.above(attackerInitialEthBalance);
  })

})
