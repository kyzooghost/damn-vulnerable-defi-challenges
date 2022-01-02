const { ether, time } = require('@openzeppelin/test-helpers');
const { accounts, contract } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

describe("[Challenge] Unstoppable", function () {
  // Ethereum balances
  const TOKENS_IN_LENDER_POOL = ethers.utils.parseEther("1000000")
  const amount = ethers.utils.parseEther("100");

  // Declare variables
  let ContractFactoryA;
  let ContractFactoryB;
  let ContractFactoryC;
  let ContractFactoryD;
  let ContractFactoryE;
  let ContractFactoryF;

  let liquidityToken;
  let flashLoanPool;
  let rewarderPool;
  let rewardToken;
  let accountingToken;
  let attackContract;

  let deployer;
  let attacker;
  let otherAccounts;
  let alice;
  let bob;
  let charlie;
  let david;
  let users;
  let i;
  
  before(async function () {
    //Setup accounts and contracts
    [deployer, alice, bob, charlie, david, attacker, ...otherAccounts] = await ethers.getSigners();
    users = [alice, bob, charlie, david];

    ContractFactoryA = await ethers.getContractFactory("DamnValuableToken");
    ContractFactoryB = await ethers.getContractFactory("FlashLoanerPool");
    ContractFactoryC = await ethers.getContractFactory("TheRewarderPool");
    ContractFactoryD = await ethers.getContractFactory("RewardToken");
    ContractFactoryE = await ethers.getContractFactory("AccountingToken");

    liquidityToken = await ContractFactoryA.deploy();
    flashLoanPool = await ContractFactoryB.deploy(liquidityToken.address);
    
    // Set initial token balance of the pool offering flash loans
    await liquidityToken.transfer(flashLoanPool.address, TOKENS_IN_LENDER_POOL);

    rewarderPool = await ContractFactoryC.deploy(liquidityToken.address);
    rewardToken = await ContractFactoryD.attach(await rewarderPool.rewardToken());
    accountingToken = await ContractFactoryE.attach(await rewarderPool.accToken());

    // Alice, Bob, Charlie and David deposit 100 tokens each
    for (i = 0; i < users.length; i++) {
      await liquidityToken.transfer(users[i].address, amount);
      await liquidityToken.connect(users[i]).approve(rewarderPool.address, amount);
      await rewarderPool.connect(users[i]).deposit(amount);   
      expect(await accountingToken.balanceOf(users[i].address)).to.equal(amount);   
    }

    expect(await accountingToken.totalSupply()).to.equal(ethers.utils.parseEther("400"));
    expect(await rewardToken.totalSupply()).to.equal(0);

    // Advance time 5 days so that depositors can get rewards
    await network.provider.send("evm_increaseTime", [432000]);
    await network.provider.send("evm_mine")
    expect(await rewarderPool.isNewRewardsRound()).to.equal(true);

    // Each depositor gets 25 reward tokens
    for (i = 0; i < users.length; i++) {
      await rewarderPool.connect(users[i]).distributeRewards();
      expect(await rewardToken.balanceOf(users[i].address)).to.equal(ethers.utils.parseEther("25")); 
    }

    // Two rounds should have occurred so far
    expect(await rewardToken.totalSupply()).to.equal(amount);
    expect(await rewarderPool.roundNumber()).to.equal(2);

    // Initialise attackContract
    ContractFactoryF = await ethers.getContractFactory("Challenge5Attack");
    attackContract = await ContractFactoryF.connect(attacker).deploy(liquidityToken.address, flashLoanPool.address, rewarderPool.address, rewardToken.address);
  
  })

  it("Exploit", async function() {
    await network.provider.send("evm_increaseTime", [432000]);
    await network.provider.send("evm_mine")
    await attackContract.attack( TOKENS_IN_LENDER_POOL );
  })

  after(async function () {
    // Only one round should have taken place
    expect(await rewarderPool.roundNumber()).to.equal(3);

    // Users should not get more rewards this round
    for (i = 0; i < users.length; i++) {
      await rewarderPool.connect(users[i]).distributeRewards();
      expect(await rewardToken.balanceOf(users[i].address)).to.equal(ethers.utils.parseEther("25"));
    }

    // Rewards must have been issued to the attacker account
    expect(await rewardToken.totalSupply()).to.be.above(ethers.utils.parseEther("100"));
    expect(await rewardToken.balanceOf(attacker.address)).to.be.above(0);
  })
})
