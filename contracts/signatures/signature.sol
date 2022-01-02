
pragma solidity ^0.8.0;

contract Signature {

    function recover(bytes32 _hash, uint8 v, bytes32 r, bytes32 s) public view returns (address) {
        return ecrecover(_hash, v, r, s);
    }

    // bytes32 public constant RECEIVE_TYPEHASH = keccak256("Receive(uint256 fromChainId,address to,uint256 nonce,uint256 volume,address signatory)");
    // bytes32 public constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)");
    // bytes32 internal _DOMAIN_SEPARATOR;
// 
    // function receive(uint256 fromChainId, address to, uint256 nonce, uint256 volume, uint8 v, bytes32 r, bytes32 s) public view returns (address) {
    //         bytes32 structHash = keccak256(abi.encode(RECEIVE_TYPEHASH, fromChainId, to, nonce, volume, signatures[i].signatory));
    //         bytes32 digest = keccak256(abi.encodePacked("\x19\x01", _DOMAIN_SEPARATOR, structHash));
    //         address signatory = ecrecover(digest, v, r, s);
    //         return signatory;
    // }
}
 