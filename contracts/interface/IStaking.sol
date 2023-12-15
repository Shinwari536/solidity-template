// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
interface IStaking {
    function stakeASR(uint256 amount) external;

    function unstake(uint256 amount) external;

    function getDailyReward(address _address) external view returns (uint256);

    function getbatchDailyReward(
        address[] memory _addresses
    ) external view returns (uint256[] memory);

    function claimReward() external;
}
