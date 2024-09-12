// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;

interface IMultisig{
    function transfer(uint256 _amount, address _recipient, address _tokenAddress) external;

    function approveTx(uint _txId) external;

    function updateQuorum( uint _newQuorum) external;
}