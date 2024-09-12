// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Multisig {
    uint public noOfValidSigners;
    uint public quorum;
    uint256 public txCount;

       enum TransactionType {
        Transfer,
        UpdateQuorum 
    }


    struct Transaction {
        uint256 id;
        uint256 amount;
        address sender;
        address recipient;
        bool isCompleted;
        uint256 timestamp;
        uint256 noOfApproval;
        uint newQuorum;
        address tokenAddress;
        address[] transactionSigners;
        TransactionType transactionType;
    }



    mapping(address => bool) isValidSigner;
    mapping(uint => Transaction)  public transactions; // txId -> Transaction
    // signer -> transactionId -> bool (checking if an address has signed)
    mapping(address => mapping(uint256 => bool)) hasSigned;

    constructor(uint _quorum, address[] memory _validSigners) {
        require(_validSigners.length > 1, "few valid signers");
        require(_quorum > 1, "quorum is too small");


        for(uint256 i = 0; i < _validSigners.length; i++) {
            require(_validSigners[i] != address(0), "zero address not allowed");
            require(!isValidSigner[_validSigners[i]], "signer already exist");

            isValidSigner[_validSigners[i]] = true;
        }

        noOfValidSigners = _validSigners.length;

        if (!isValidSigner[msg.sender]){
            isValidSigner[msg.sender] = true;
            noOfValidSigners += 1;
        }

        require(_quorum <= noOfValidSigners, "quorum greater than valid signers");
        quorum = _quorum;
    }

    function transfer(uint256 _amount, address _recipient, address _tokenAddress) external {
        require(msg.sender != address(0), "address zero found");
        require(isValidSigner[msg.sender], "invalid signer");

        require(_amount > 0, "can't send zero amount");
        require(_recipient != address(0), "address zero found");
        require(_tokenAddress != address(0), "address zero found");

        require(IERC20(_tokenAddress).balanceOf(address(this)) >= _amount, "insufficient funds");

        uint256 _txId = txCount + 1;
        Transaction storage trx = transactions[_txId];
        
        trx.id = _txId;
        trx.amount = _amount;
        trx.recipient = _recipient;
        trx.sender = msg.sender;
        trx.timestamp = block.timestamp;
        trx.tokenAddress = _tokenAddress;
        trx.noOfApproval += 1;
        trx.transactionType = TransactionType.Transfer;
        trx.transactionSigners.push(msg.sender);
        hasSigned[msg.sender][_txId] = true;

        txCount += 1;
    }

    function approveTx(uint _txId) external {
        Transaction storage trx = transactions[_txId];
        
        require(trx.id != 0, "invalid tx id");
        
        if (trx.transactionType == TransactionType.Transfer) {
            require(IERC20(trx.tokenAddress).balanceOf(address(this)) >= trx.amount, "insufficient funds");
        }else if(trx.transactionType == TransactionType.UpdateQuorum) {
            require(trx.newQuorum > 1, "Invalid quorum");
            require(
                trx.newQuorum <= noOfValidSigners,
                "quorum greater than valid signers"
            );
        }


        require(!trx.isCompleted, "transaction already completed");
        require(trx.noOfApproval < quorum, "approvals already reached");

        require(isValidSigner[msg.sender], "not a valid signer");
        require(!hasSigned[msg.sender][_txId], "can't sign twice");

        hasSigned[msg.sender][_txId] = true;
        trx.noOfApproval += 1;
        trx.transactionSigners.push(msg.sender);

        if(trx.noOfApproval == quorum) {
            trx.isCompleted = true;
            if (trx.transactionType == TransactionType.Transfer) {
                IERC20(trx.tokenAddress).transfer(trx.recipient, trx.amount);
            } else if (trx.transactionType == TransactionType.UpdateQuorum) {
                quorum = trx.newQuorum;
            }
        }
    }

    function updateQuorum( uint _newQuorum) external {
      require(msg.sender != address(0), "address zero found");
    require(isValidSigner[msg.sender], "invalid signer");
    require(_newQuorum > 1, "invalid quorum");
    require(_newQuorum <= noOfValidSigners, "quorum greater than valid signers");

    uint256 _txId = txCount + 1;
    Transaction storage trx = transactions[_txId];

    trx.id = _txId;
    trx.sender = msg.sender;
    trx.timestamp = block.timestamp;
    trx.newQuorum = _newQuorum;
    trx.noOfApproval += 1;
    trx.transactionType = TransactionType.UpdateQuorum;
    trx.transactionSigners.push(msg.sender);
    hasSigned[msg.sender][_txId] = true;

    // Increment the txCount
    txCount += 1;


    }



}
