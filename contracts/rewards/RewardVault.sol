// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * Minimal reward vault: owner deposits ERC20 and can transfer to any address.
 * Use this to hold $PULSE (or wrapped token) and pay out when users redeem points.
 * Points and redemption logic stay off-chain (API); this contract is just a treasury.
 */
contract RewardVault is Ownable, ReentrancyGuard {
    IERC20 public immutable token;

    event Deposited(address indexed from, uint256 amount);
    event TransferredTo(address indexed to, uint256 amount);

    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "token zero");
        token = IERC20(_token);
    }

    /// @notice Owner deposits tokens into the vault (after approving this contract).
    function deposit(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "amount zero");
        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");
        emit Deposited(msg.sender, amount);
    }

    /// @notice Owner sends tokens to a recipient (e.g. when fulfilling a points redemption).
    function transferTo(address recipient, uint256 amount) external onlyOwner nonReentrant {
        require(recipient != address(0), "recipient zero");
        require(amount > 0, "amount zero");
        require(token.transfer(recipient, amount), "transfer failed");
        emit TransferredTo(recipient, amount);
    }

    /// @notice Current token balance held by the vault.
    function balance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
