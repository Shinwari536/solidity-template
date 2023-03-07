/*

  << Test Token (for use with the Test DAO) >>

*/

pragma solidity 0.4.23;

/**
  * @title TestToken
  * @author Project BlueOcean Developers
  */
contract TestToken {

    uint constant public decimals     = 18;
    string constant public name       = "Test Token";
    string constant public symbol     = "TST";

    uint constant public MINT_AMOUNT  = 20000000 * (10 ** decimals);

    /**
      * @dev Initialize the test token
      */
    constructor () public {
        balances[msg.sender] = MINT_AMOUNT;
        totalSupply_ = MINT_AMOUNT;
    }

}
