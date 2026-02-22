//! Reward Vault  - Solana program for $PULSE (or any SPL token) payouts.
//!
//! Owner deposits tokens into the vault and can transfer to any recipient when
//! fulfilling redemptions. On-chain points: owner can credit points to user
//! PDAs; users can redeem points for tokens at the vault's redemption rate.

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("RewVau1111111111111111111111111111111111111");

#[error_code]
pub enum VaultError {
    #[msg("Only the vault owner can call this")]
    Unauthorized,
    #[msg("Redemption rate not set")]
    RedemptionRateNotSet,
    #[msg("Insufficient points balance")]
    InsufficientPoints,
    #[msg("Redeem amount would yield zero tokens")]
    ZeroTokenAmount,
    #[msg("Daily check-in not configured or cooldown not elapsed")]
    DailyCheckInNotAvailable,
}

#[program]
pub mod reward_vault {
    use super::*;

    /// Initialize the vault. Creates a PDA state and an ATA owned by the vault PDA.
    /// Call once per mint. Owner is the only signer who can later call deposit and transfer_to.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.owner.key();
        vault.mint = ctx.accounts.mint.key();
        vault.bump = ctx.bumps.vault;
        vault.points_per_token = 0;
        Ok(())
    }

    /// Owner deposits tokens into the vault by transferring from their token account to the vault's.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: ctx.accounts.owner_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;
        Ok(())
    }

    /// Owner transfers tokens from the vault to a recipient (e.g. when fulfilling a points redemption).
    pub fn transfer_to(ctx: Context<TransferTo>, amount: u64) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let seeds = &[b"vault", vault.mint.as_ref(), &[vault.bump]];
        let signer_seeds = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds),
            amount,
        )?;
        Ok(())
    }

    /// Owner sets how many points are required for one full token (1e decimals). E.g. 100 = 100 points per 1 token.
    pub fn set_redemption_rate(ctx: Context<SetRedemptionRate>, points_per_token: u64) -> Result<()> {
        require!(points_per_token > 0, VaultError::RedemptionRateNotSet);
        let vault = &mut ctx.accounts.vault;
        vault.points_per_token = points_per_token;
        Ok(())
    }

    /// Owner creates a points account for a user. Call once per user before crediting. Payer = owner.
    pub fn create_points_account(ctx: Context<CreatePointsAccount>) -> Result<()> {
        let points_account = &mut ctx.accounts.points_account;
        points_account.user = ctx.accounts.user.key();
        points_account.bump = ctx.bumps.points_account;
        Ok(())
    }

    /// Owner credits points to a user's on-chain points account. Points account must exist (create via create_points_account first).
    pub fn credit_points(ctx: Context<CreditPoints>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::InsufficientPoints);
        let points_account = &mut ctx.accounts.points_account;
        points_account.balance = points_account.balance.saturating_add(amount);
        Ok(())
    }

    /// Owner sets daily check-in reward and cooldown. Call once after initialize. Creates config PDA.
    pub fn init_daily_config(
        ctx: Context<InitDailyConfig>,
        daily_check_in_points: u64,
        cooldown_secs: u64,
    ) -> Result<()> {
        require!(cooldown_secs > 0, VaultError::DailyCheckInNotAvailable);
        let config = &mut ctx.accounts.config;
        config.bump = ctx.bumps.config;
        config.daily_check_in_points = daily_check_in_points;
        config.cooldown_secs = cooldown_secs;
        Ok(())
    }

    /// User creates their daily-claim and points PDAs. Call once before first daily_check_in. Payer = user.
    pub fn create_user_daily(ctx: Context<CreateUserDaily>) -> Result<()> {
        let daily = &mut ctx.accounts.daily_claim;
        daily.bump = ctx.bumps.daily_claim;
        let points_account = &mut ctx.accounts.points_account;
        points_account.user = ctx.accounts.user.key();
        points_account.bump = ctx.bumps.points_account;
        Ok(())
    }

    /// User earns points on-chain by "daily check-in": once per cooldown window (e.g. 24h). Call create_user_daily first if needed.
    pub fn daily_check_in(ctx: Context<DailyCheckIn>) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(
            config.daily_check_in_points > 0,
            VaultError::DailyCheckInNotAvailable
        );
        let clock = Clock::get()?;
        let now = clock.unix_timestamp;
        let daily = &mut ctx.accounts.daily_claim;
        let cooldown_ok = daily.last_claim_ts == 0
            || daily.last_claim_ts + config.cooldown_secs as i64 <= now;
        require!(cooldown_ok, VaultError::DailyCheckInNotAvailable);
        daily.last_claim_ts = now;
        let points_account = &mut ctx.accounts.points_account;
        points_account.balance = points_account.balance.saturating_add(config.daily_check_in_points);
        Ok(())
    }

    /// User redeems points for tokens. Deducts points and transfers tokens from vault to user at vault rate.
    pub fn redeem(ctx: Context<Redeem>, points_amount: u64) -> Result<()> {
        require!(points_amount > 0, VaultError::InsufficientPoints);
        let vault = &ctx.accounts.vault;
        require!(vault.points_per_token > 0, VaultError::RedemptionRateNotSet);
        let points_account = &mut ctx.accounts.points_account;
        require!(points_account.balance >= points_amount, VaultError::InsufficientPoints);
        let mint = &ctx.accounts.mint;
        let decimals = mint.decimals;
        let token_amount = (points_amount as u128)
            .checked_mul(10u128.saturating_pow(decimals as u32))
            .and_then(|n| n.checked_div(vault.points_per_token as u128))
            .and_then(|n| u64::try_from(n).ok())
            .unwrap_or(0);
        require!(token_amount > 0, VaultError::ZeroTokenAmount);
        points_account.balance = points_account.balance.saturating_sub(points_amount);
        let seeds = &[b"vault", vault.mint.as_ref(), &[vault.bump]];
        let signer_seeds = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds),
            token_amount,
        )?;
        Ok(())
    }
}

#[account]
pub struct Vault {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub bump: u8,
    /// Points required for one full token (1e decimals). E.g. 100 = 100 points per 1 token.
    pub points_per_token: u64,
}

impl Vault {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 8;
}

#[account]
pub struct PointsAccount {
    pub user: Pubkey,
    pub balance: u64,
    pub bump: u8,
}

impl PointsAccount {
    pub const LEN: usize = 8 + 32 + 8 + 1;
}

/// Owner-configured rewards for on-chain actions (e.g. daily check-in). Optional; create via init_daily_config.
#[account]
pub struct VaultConfig {
    pub daily_check_in_points: u64,
    pub cooldown_secs: u64,
    pub bump: u8,
}

impl VaultConfig {
    pub const LEN: usize = 8 + 8 + 8 + 1;
}

/// Tracks when a user last claimed daily check-in (so we enforce cooldown).
#[account]
pub struct DailyClaim {
    pub last_claim_ts: i64,
    pub bump: u8,
}

impl DailyClaim {
    pub const LEN: usize = 8 + 8 + 1;
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = owner,
        space = 8 + Vault::LEN,
        seeds = [b"vault", mint.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = vault
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        constraint = vault.owner == owner.key() @ VaultError::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key(),
        constraint = owner_token_account.mint == vault.mint
    )]
    pub owner_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_token_account.owner == vault.key(),
        constraint = vault_token_account.mint == vault.mint
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferTo<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.mint.as_ref()],
        bump = vault.bump,
        constraint = vault.owner == owner.key() @ VaultError::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        constraint = vault_token_account.owner == vault.key(),
        constraint = vault_token_account.mint == vault.mint
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetRedemptionRate<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.mint.as_ref()],
        bump = vault.bump,
        constraint = vault.owner == owner.key() @ VaultError::Unauthorized
    )]
    pub vault: Account<'info, Vault>,
}

#[derive(Accounts)]
pub struct CreatePointsAccount<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.mint.as_ref()],
        bump = vault.bump,
        constraint = vault.owner == owner.key() @ VaultError::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    /// User for whom to create the points account (PDA seed).
    /// CHECK: Used only as PDA seed.
    pub user: UncheckedAccount<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + PointsAccount::LEN,
        seeds = [b"points", vault.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub points_account: Account<'info, PointsAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreditPoints<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.mint.as_ref()],
        bump = vault.bump,
        constraint = vault.owner == owner.key() @ VaultError::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    /// User whose points to credit (PDA seed).
    /// CHECK: Used only as PDA seed.
    pub user: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"points", vault.key().as_ref(), user.key().as_ref()],
        bump = points_account.bump,
        constraint = points_account.user == user.key()
    )]
    pub points_account: Account<'info, PointsAccount>,
}

#[derive(Accounts)]
pub struct InitDailyConfig<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.mint.as_ref()],
        bump = vault.bump,
        constraint = vault.owner == owner.key() @ VaultError::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = owner,
        space = 8 + VaultConfig::LEN,
        seeds = [b"config", vault.key().as_ref()],
        bump
    )]
    pub config: Account<'info, VaultConfig>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateUserDaily<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.mint.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        seeds = [b"config", vault.key().as_ref()],
        bump = config.bump,
        constraint = config.daily_check_in_points > 0 @ VaultError::DailyCheckInNotAvailable
    )]
    pub config: Account<'info, VaultConfig>,

    #[account(
        init,
        payer = user,
        space = 8 + DailyClaim::LEN,
        seeds = [b"daily", vault.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub daily_claim: Account<'info, DailyClaim>,

    #[account(
        init,
        payer = user,
        space = 8 + PointsAccount::LEN,
        seeds = [b"points", vault.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub points_account: Account<'info, PointsAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DailyCheckIn<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.mint.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        seeds = [b"config", vault.key().as_ref()],
        bump = config.bump,
        constraint = config.daily_check_in_points > 0 @ VaultError::DailyCheckInNotAvailable
    )]
    pub config: Account<'info, VaultConfig>,

    #[account(
        mut,
        seeds = [b"daily", vault.key().as_ref(), user.key().as_ref()],
        bump = daily_claim.bump
    )]
    pub daily_claim: Account<'info, DailyClaim>,

    #[account(
        mut,
        seeds = [b"points", vault.key().as_ref(), user.key().as_ref()],
        bump = points_account.bump,
        constraint = points_account.user == user.key()
    )]
    pub points_account: Account<'info, PointsAccount>,
}

#[derive(Accounts)]
pub struct Redeem<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.mint.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"points", vault.key().as_ref(), user.key().as_ref()],
        bump = points_account.bump,
        constraint = points_account.user == user.key()
    )]
    pub points_account: Account<'info, PointsAccount>,

    #[account(
        mut,
        constraint = vault_token_account.owner == vault.key(),
        constraint = vault_token_account.mint == vault.mint
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == vault.mint
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
