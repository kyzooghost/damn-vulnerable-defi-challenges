const ethUtil = require('ethereumjs-util');
const abi = require('ethereumjs-abi');
const chai = require('chai');
const ethers = require("ethers");
const { bufferToHex } = require('ethereumjs-util');

const typedData = {
    types: {
        EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ],
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
        owner: '0xbed01a63f88421449dde4d9e1d884d3e3d213f01',
        spender: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
        value: '122436646317351619',
        nonce: 1,
        deadline: '1627196182420'
    },
  };


const types = typedData.types;

// Recursively finds all the dependencies of a type
function dependencies(primaryType, found = []) {
    if (found.includes(primaryType)) {
        return found;
    }
    if (types[primaryType] === undefined) {
        return found;
    }
    found.push(primaryType);
    for (let field of types[primaryType]) {
        for (let dep of dependencies(field.type, found)) {
            if (!found.includes(dep)) {
                found.push(dep);
            }
        }
    }
    return found;
}

function encodeType(primaryType) {
    // Get dependencies primary first, then alphabetical
    let deps = dependencies(primaryType);
    deps = deps.filter(t => t != primaryType);
    deps = [primaryType].concat(deps.sort());

    // Format as a string with fields
    let result = '';
    for (let type of deps) {
        result += `${type}(${types[type].map(({ name, type }) => `${type} ${name}`).join(',')})`;
    }
    return result;
}

function typeHash(primaryType) {
    return ethUtil.keccak256(Buffer.from(encodeType(primaryType)));
}

function encodeData(primaryType, data) {
    let encTypes = [];
    let encValues = [];

    // Add typehash
    encTypes.push('bytes32');
    encValues.push(typeHash(primaryType));

    // Add field contents
    for (let field of types[primaryType]) {
        let value = data[field.name];
        if (field.type == 'string' || field.type == 'bytes') {
            encTypes.push('bytes32');
            value = ethUtil.keccak256(Buffer.from(value));
            encValues.push(value);
        } else if (types[field.type] !== undefined) {
            encTypes.push('bytes32');
            value = ethUtil.keccak256(Buffer.from(encodeData(field.type, value)));
            encValues.push(value);
        } else if (field.type.lastIndexOf(']') === field.type.length - 1) {
            throw 'TODO: Arrays currently unimplemented in encodeData';
        } else {
            encTypes.push(field.type);
            encValues.push(value);
        }
    }

    return abi.rawEncode(encTypes, encValues);
}

function structHash(primaryType, data) {
    return ethUtil.keccak256(Buffer.from(encodeData(primaryType, data)));
}

function signHash() {
    return ethUtil.keccak256(
        Buffer.concat([
            Buffer.from('1901', 'hex'),
            structHash('EIP712Domain', typedData.domain),
            structHash(typedData.primaryType, typedData.message),
        ]),
    );
}

// console.log(signHash());
// console.log(bufferToHex(signHash()));

const privateKey = Buffer.from('ea5435d7325ab0394fc5f74c7376707735e56e2bb6794da7b160aa62727a8ad8','hex');
const address = ethUtil.privateToAddress(privateKey);
const sig = ethUtil.ecsign(signHash(), privateKey);

const sig_1 = '0x25fd61baae01fce8a7cc00588ab37fe4f2c63596fa417eac63a9137f6cc17ccc';

module.exports = { structHash };