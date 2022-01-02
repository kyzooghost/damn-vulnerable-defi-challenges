pragma solidity ^0.8.0;

contract Example2 {
    
    bytes32 public constant DOMAIN_SEPARATOR = 0xb0ac1ccf60b06af34cf296cd87471425d807952f476c1a23bd3d5be2a888db23;
    bytes32 public constant PERMIT_TYPEHASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;

    function getDigest(address owner, address spender, uint value, uint nonce, uint deadline) public view returns (bytes32) {

        bytes32 digest = keccak256(
            abi.encodePacked(
                '\x19\x01',
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonce, deadline))
            )
        );

        return digest;
    }

}
