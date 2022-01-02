const ethUtil = require('ethereumjs-util');
const { ROPSTEN_PRIVATE_KEY } = require('../secrets.json');

async function main() {

    // Initialise accounts
    const [deployer] = await ethers.getSigners();

    // Initialise cracker contract
    const ContractFactoryA = await ethers.getContractFactory("Example2");
    const Example2 = await ContractFactoryA.deploy();

    // Initialise DAI contract
    const DAI_address = "0xad6d458402f60fd3bd25163575031acdce07538d";
    const DAI_ABI = [
      "function approve(address _spender, uint _value)"
    ];
    const DAI = new ethers.Contract(DAI_address, DAI_ABI, deployer.provider);

    // Initialise UniswapV2Router02 contract
    const UniswapV2Router02_address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const UniswapV2Router02_ABI = [
      "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
      "function swapETHForExactTokens(uint256 amountOut, address[] path, address to, uint256 deadline) payable",
      "function addLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) payable",
      "function removeLiquidityWithPermit(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s)"
    ];
    const UniswapV2Router02 = new ethers.Contract(UniswapV2Router02_address, UniswapV2Router02_ABI, deployer.provider);
    
    // Initialise DAI-WETH LP token
    const DAI_WETH_UNI_LP_address = "0x1c5dee94a34d795f9eeef830b68b80e44868d316";
    const DAI_WETH_UNI_LP_ABI = [
      "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
      "function nonces(address owner) external view returns (uint)",
      "function balanceOf(address owner) external view returns (uint)",
      "function name() external view returns (string memory)",
      "function DOMAIN_SEPARATOR() external view returns (bytes32)",
      "function PERMIT_TYPEHASH() external pure returns (bytes32)"
    ];
    const DAI_WETH_UNI_LP = new ethers.Contract(DAI_WETH_UNI_LP_address, DAI_WETH_UNI_LP_ABI, deployer.provider);
    
    // Initialise other addresses
    const WETH_address = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
    
    // TX 1 - SWAP 0.01 ETH FOR DAI
    
    // 1.1 - Find out how much DAI you get for 0.01 ETH
    const amountOut = await UniswapV2Router02.getAmountsOut(
      ethers.utils.parseEther("0.01"),
      [WETH_address, DAI_address]
    )

    // 1.2 - Perform the swap function
    let options = {gasLimit: 200000, value: ethers.utils.parseEther("0.01")};

    await UniswapV2Router02.connect(deployer).swapETHForExactTokens(
      amountOut[1].sub(1000),
      [WETH_address, DAI_address],
      deployer.address,
      Date.now()+10000,
      options
    );

    // TX 2 - Approve DAI
    await DAI.connect(deployer).approve(UniswapV2Router02.address, amountOut[1]);

    // TX 3 - Add Liquidity
    
    // 3.1 - Calculate how much ETH we can add as liquidity for amountOut[1]

    // (uint reserveA, uint reserveB) = UniswapV2Library.getReserves(factory, tokenA, tokenB)
    // uint amountBOptimal = UniswapV2Library.quote(amountADesired, reserveA, reserveB)

    const reserves = await DAI_WETH_UNI_LP.getReserves();
    const optimalETHamount = amountOut[1].mul(reserves.reserve1).div(reserves.reserve0);
    const optimalDAIamount = optimalETHamount.mul(reserves.reserve0).div(reserves.reserve1);

    options = {gasLimit: 200000, value: optimalETHamount};

    const addLiquidityResult = await UniswapV2Router02.connect(deployer).addLiquidityETH(
      DAI.address,
      amountOut[1],
      optimalDAIamount,
      optimalETHamount,
      deployer.address,
      Date.now()+10000,
      options
    )

    // TX 4 - RemoveLiquidityWithPermit

    // 4.1 - Work out typedData inputs
    
    const balanceLPtokens = addLiquidityResult.liquidity.toNumber();
    // DAI_WETH_UNI_LP.balanceOf(deployer.address);

    const typedData = {
      types: {
          Permit: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' },
              { name: 'value', type: 'uint256' },
              { name: 'nonce', type: 'uint256' },
              { name: 'deadline', type: 'uint256' }
          ]
      },
      primaryType: 'Permit',
      domain: {
          name: 'Uniswap V2',
          version: '1',
          chainId: 3,
          verifyingContract: '0x1c5DEe94a34D795f9EEeF830B68B80e44868d316',
      },
      message: {
          owner: deployer.address,
          spender: UniswapV2Router02.address,
          value: balanceLPtokens,
          nonce: await DAI_WETH_UNI_LP.nonces(deployer.address),
          // nonce: (await DAI_WETH_UNI_LP.nonces(deployer.address)).add(1),
          deadline: Date.now()+10000
      },
    };

    // 4.2 - Generate signature Method A using ethers.js _signTypedData

    const signature = await deployer._signTypedData(typedData.domain, typedData.types, typedData.message);
    const splitSig = ethers.utils.splitSignature(signature);

    // 4.3 - Generate signature Method B using helper Solidity contract

    const digest = await Example2.getDigest(
      typedData.message.owner,
      typedData.message.spender,
      typedData.message.value,
      typedData.message.nonce,
      typedData.message.deadline
    );

    const privateKey = Buffer.from(ROPSTEN_PRIVATE_KEY,'hex');
    const digestBuffer = Buffer.from(digest.substring(2),'hex');
    const sig = ethUtil.ecsign(digestBuffer, privateKey);
    
    // 4.3 - RemoveLiquidity (We end up using generate_signature Method B)
    
    options = {gasLimit: 400000};

    await UniswapV2Router02.connect(deployer).removeLiquidityWithPermit(
      WETH_address,
      DAI.address,
      typedData.message.value,
      0,
      0,
      typedData.message.owner,
      typedData.message.deadline,
      0,
      sig.v,
      ethUtil.bufferToHex(sig.r),
      ethUtil.bufferToHex(sig.s),
      options
    );

};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });