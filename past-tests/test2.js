const { ether, expectRevert } = require('@openzeppelin/test-helpers');
const { accounts, contract } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

describe("[Challenge] Unstoppable", function () {
  // Ethereum balances
  const ETHER_IN_POOL = ethers.utils.parseEther("1000")
  const ETHER_IN_RECEIVER = ethers.utils.parseEther("10")

  // Declare variables
  let ContractFactoryA;
  let ContractFactoryB;
  let ContractFactoryC;
  let NaiveReceiverLenderPool;
  let FlashLoanReceiver;
  let AttackContract;
  let deployer;
  let user;
  let attacker;
  let otherAccounts;

  beforeEach(async function () {
    //Setup accounts and contracts
    [deployer, user, attacker, ...otherAccounts] = await ethers.getSigners();
    ContractFactoryA = await ethers.getContractFactory("NaiveReceiverLenderPool");
    ContractFactoryB = await ethers.getContractFactory("FlashLoanReceiver");
    ContractFactoryC = await ethers.getContractFactory("AttackContract");
    NaiveReceiverLenderPool = await ContractFactoryA.deploy();

    await deployer.sendTransaction({
      to: NaiveReceiverLenderPool.address,
      value: ETHER_IN_POOL
    });

    FlashLoanReceiver = await ContractFactoryB.connect(user).deploy(NaiveReceiverLenderPool.address);

    await user.sendTransaction({
      to: FlashLoanReceiver.address,
      value: ETHER_IN_RECEIVER
    });

    AttackContract = await ContractFactoryC.connect(attacker).deploy(NaiveReceiverLenderPool.address, FlashLoanReceiver.address);

  })

  it("1000 Ether transferred to NaiveReceiverLenderPool", async function() {
    let bal = await ethers.provider.getBalance(NaiveReceiverLenderPool.address);
    expect(bal).to.equal(ETHER_IN_POOL);
  })

  it("Fixed fee to equal 1 Ether", async function() {
    let bal = await NaiveReceiverLenderPool.fixedFee();
    expect(bal.toString()).to.equal(ethers.utils.parseEther("1"));
  })

  it("10 Ether transferred to FlashLoanReceiver", async function() {
    let bal = await ethers.provider.getBalance(FlashLoanReceiver.address);
    expect(bal).to.equal(ETHER_IN_RECEIVER);
  })

  it("Correct addresses for pool and receiver initialised in attack contract", async function() {
    expect(FlashLoanReceiver.address).to.equal(await AttackContract.findReceiverAddress());
    expect(NaiveReceiverLenderPool.address).to.equal(await AttackContract.findPoolAddress());
  })

  it("Exploited!", async function () {
    let amount = ethers.utils.parseEther("9")

    // while ( (await ethers.provider.getBalance(FlashLoanReceiver.address))>0 ) {
    //   await AttackContract.callFlashLoan(FlashLoanReceiver.address, amount);
    // }

    // for (let i = 0; i<10; i++) {
    //   await AttackContract.callFlashLoan(FlashLoanReceiver.address, amount);
    // }

    await AttackContract.callFlashLoan(FlashLoanReceiver.address, amount);

    let bal0 = await ethers.provider.getBalance(NaiveReceiverLenderPool.address);
    let bal1 = await ethers.provider.getBalance(FlashLoanReceiver.address);
    expect(bal0).to.equal(ETHER_IN_POOL.add(ETHER_IN_RECEIVER));
    expect(bal1).to.equal(0);
  })

})
