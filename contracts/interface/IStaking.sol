// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/Constants.sol";
import "../lib/CustomErrors.sol";

interface IStaking is CustomErrors {
    function stakeASR(uint256 amount) external;

    function unstake(uint256 amount) external;

    function getDailyReward(address _address) external view returns (uint256);

    function getbatchDailyReward(
        address[] memory _addresses
    ) external view returns (uint256[] memory);

    function claimReward() external;
}
