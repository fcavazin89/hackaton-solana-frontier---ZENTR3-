import { useState, useEffect, useRef } from "react";
import { erc20, erc721, erc1155, governor } from "@openzeppelin/wizard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Code2, Copy, Check, Download, Shield, Info, Layers, BarChart3, Users, Zap, Image, Coins, Sparkles, Loader2, Pencil } from "lucide-react";

type Platform = "evm" | "solana";
type ContractType = "erc20" | "erc721" | "erc1155" | "governor" | "custom";
type SolanaContractType = "spl-token" | "nft" | "multi-token" | "dao" | "custom";
type Network = "base" | "polygon" | "base-sepolia" | "polygon-amoy";
type SolanaNetwork = "devnet" | "testnet" | "mainnet-beta";

const EVM_NETWORKS: { id: Network; name: string; chain: string; gas: string; color: string }[] = [
  { id: "base", name: "Base", chain: "8453", gas: "<$0.001", color: "text-secondary" },
  { id: "polygon", name: "Polygon", chain: "137", gas: "<$0.002", color: "text-chart-4" },
  { id: "base-sepolia", name: "Base Sepolia", chain: "84532", gas: "Grátis (testnet)", color: "text-muted-foreground" },
  { id: "polygon-amoy", name: "Polygon Amoy", chain: "80002", gas: "Grátis (testnet)", color: "text-muted-foreground" },
];

const SOLANA_NETWORKS: { id: SolanaNetwork; name: string; gas: string; color: string }[] = [
  { id: "devnet", name: "Devnet", gas: "Grátis (testnet)", color: "text-muted-foreground" },
  { id: "testnet", name: "Testnet", gas: "Grátis (testnet)", color: "text-muted-foreground" },
  { id: "mainnet-beta", name: "Mainnet Beta", gas: "~0.000005 SOL", color: "text-chart-3" },
];

function SwitchRow({ id, label, desc, checked, onCheckedChange }: {
  id: string; label: string; desc?: string; checked: boolean; onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/30 last:border-0">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="font-mono text-sm cursor-pointer">{label}</Label>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function toSnakeCase(name: string) {
  return name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "meu_programa";
}

function generateSolanaToken(opts: {
  name: string; symbol: string; decimals: string; premint: string;
  mintable: boolean; burnable: boolean; pausable: boolean;
}): string {
  const snake = toSnakeCase(opts.name);
  const premintAmount = (Number(opts.premint) || 0) * Math.pow(10, Number(opts.decimals) || 9);
  return `use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer},
};

declare_id!("11111111111111111111111111111111");

/// ${opts.name} (${opts.symbol}) — Solana SPL Token
/// Gerado por FORGE3 · Anchor Framework
#[program]
pub mod ${snake} {
    use super::*;

    /// Inicializa o mint do token e a conta do authority
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.token_state;
        state.authority = ctx.accounts.authority.key();
        state.mint = ctx.accounts.mint.key();
        state.symbol = "${opts.symbol}".to_string();
        state.decimals = ${opts.decimals || "9"};
        state.paused = false;
${premintAmount > 0 ? `        // Mint inicial de ${opts.premint} ${opts.symbol}
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.authority_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        token::mint_to(cpi_ctx, ${Math.floor(premintAmount)})?;` : ""}
        msg!("Token ${opts.name} inicializado com sucesso");
        Ok(())
    }
${opts.mintable ? `
    /// Cria novos tokens (somente authority)
    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        require!(!ctx.accounts.token_state.paused, TokenError::Paused);
        require!(
            ctx.accounts.authority.key() == ctx.accounts.token_state.authority,
            TokenError::Unauthorized
        );
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        token::mint_to(cpi_ctx, amount)?;
        msg!("Mintados {} tokens para {}", amount, ctx.accounts.destination.key());
        Ok(())
    }
` : ""}${opts.burnable ? `
    /// Queima tokens da conta do caller
    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        token::burn(cpi_ctx, amount)?;
        msg!("Queimados {} tokens", amount);
        Ok(())
    }
` : ""}${opts.pausable ? `
    /// Pausa ou despausa transferências (somente authority)
    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.token_state.authority,
            TokenError::Unauthorized
        );
        ctx.accounts.token_state.paused = paused;
        msg!("Token ${opts.name}: paused = {}", paused);
        Ok(())
    }
` : ""}
    /// Transfere tokens entre contas
    pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
${opts.pausable ? `        require!(!ctx.accounts.token_state.paused, TokenError::Paused);
` : ""}        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.to.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

#[account]
pub struct TokenState {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub symbol: String,
    pub decimals: u8,
    pub paused: bool,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 + 16 + 1 + 1)]
    pub token_state: Account<'info, TokenState>,
    #[account(
        init,
        payer = authority,
        mint::decimals = ${opts.decimals || "9"},
        mint::authority = authority,
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub authority_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
${opts.mintable ? `
#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub token_state: Account<'info, TokenState>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
` : ""}${opts.burnable ? `
#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
` : ""}${opts.pausable ? `
#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(mut)]
    pub token_state: Account<'info, TokenState>,
    pub authority: Signer<'info>,
}
` : ""}
#[derive(Accounts)]
pub struct TransferTokens<'info> {
${opts.pausable ? `    pub token_state: Account<'info, TokenState>,
` : ""}    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum TokenError {
    #[msg("Não autorizado")]
    Unauthorized,
    #[msg("Token pausado")]
    Paused,
}
`;
}

function generateSolanaNft(opts: {
  name: string; symbol: string; uri: string;
  mintable: boolean; burnable: boolean;
}): string {
  const snake = toSnakeCase(opts.name);
  return `use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Burn, Mint, MintTo, Token, TokenAccount},
    metadata::{
        create_metadata_accounts_v3,
        create_master_edition_v3,
        CreateMetadataAccountsV3,
        CreateMasterEditionV3,
        Metadata,
        mpl_token_metadata::types::DataV2,
    },
};

declare_id!("11111111111111111111111111111111");

/// ${opts.name} (${opts.symbol}) — Solana NFT Collection
/// Gerado por FORGE3 · Anchor + Metaplex
#[program]
pub mod ${snake} {
    use super::*;

    /// Inicializa a coleção NFT
    pub fn initialize_collection(ctx: Context<InitializeCollection>) -> Result<()> {
        let collection = &mut ctx.accounts.collection_state;
        collection.authority = ctx.accounts.authority.key();
        collection.name = "${opts.name}".to_string();
        collection.symbol = "${opts.symbol}".to_string();
        collection.uri = "${opts.uri || "https://meu-projeto.com/metadata/"}".to_string();
        collection.total_minted = 0;
        msg!("Coleção ${opts.name} inicializada");
        Ok(())
    }
${opts.mintable ? `
    /// Minta um novo NFT para o destinatário
    pub fn mint_nft(
        ctx: Context<MintNft>,
        token_id: u64,
        name: String,
        uri: String,
    ) -> Result<()> {
        let collection = &mut ctx.accounts.collection_state;
        require!(
            ctx.accounts.authority.key() == collection.authority,
            NftError::Unauthorized
        );

        // Minta 1 token (NFT = supply de 1)
        let cpi_mint = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        token::mint_to(cpi_mint, 1)?;

        // Cria metadata via Metaplex
        let data = DataV2 {
            name: name.clone(),
            symbol: "${opts.symbol}".to_string(),
            uri: uri.clone(),
            seller_fee_basis_points: 500, // 5% royalty
            creators: None,
            collection: None,
            uses: None,
        };
        let cpi_metadata = CpiContext::new(
            ctx.accounts.metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.authority.to_account_info(),
                update_authority: ctx.accounts.authority.to_account_info(),
                payer: ctx.accounts.authority.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        );
        create_metadata_accounts_v3(cpi_metadata, data, true, true, None)?;

        // Cria Master Edition (garante supply = 1)
        let cpi_edition = CpiContext::new(
            ctx.accounts.metadata_program.to_account_info(),
            CreateMasterEditionV3 {
                edition: ctx.accounts.master_edition.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                update_authority: ctx.accounts.authority.to_account_info(),
                mint_authority: ctx.accounts.authority.to_account_info(),
                payer: ctx.accounts.authority.to_account_info(),
                metadata: ctx.accounts.metadata.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        );
        create_master_edition_v3(cpi_edition, Some(0))?;

        collection.total_minted = collection.total_minted.checked_add(1).unwrap();
        msg!("NFT #{} mintado: {}", token_id, name);
        Ok(())
    }
` : ""}${opts.burnable ? `
    /// Queima o NFT (destrói o token)
    pub fn burn_nft(ctx: Context<BurnNft>) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        );
        token::burn(cpi_ctx, 1)?;
        msg!("NFT queimado: {}", ctx.accounts.mint.key());
        Ok(())
    }
` : ""}
    /// Atualiza o authority da coleção
    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.collection_state.authority,
            NftError::Unauthorized
        );
        ctx.accounts.collection_state.authority = new_authority;
        Ok(())
    }
}

#[account]
pub struct CollectionState {
    pub authority: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub total_minted: u64,
}

#[derive(Accounts)]
pub struct InitializeCollection<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 64 + 16 + 128 + 8)]
    pub collection_state: Account<'info, CollectionState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
${opts.mintable ? `
#[derive(Accounts)]
pub struct MintNft<'info> {
    #[account(mut)]
    pub collection_state: Account<'info, CollectionState>,
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = authority,
        mint::freeze_authority = authority,
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub token_account: Account<'info, TokenAccount>,
    /// CHECK: Metaplex valida este campo
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: Metaplex valida este campo
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,
    /// CHECK: Destinatário do NFT
    pub recipient: UncheckedAccount<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
` : ""}${opts.burnable ? `
#[derive(Accounts)]
pub struct BurnNft<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
` : ""}
#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(mut)]
    pub collection_state: Account<'info, CollectionState>,
    pub authority: Signer<'info>,
}

#[error_code]
pub enum NftError {
    #[msg("Não autorizado")]
    Unauthorized,
    #[msg("Supply máximo atingido")]
    MaxSupplyReached,
}
`;
}

function generateSolanaMultiToken(opts: {
  name: string; uri: string;
  mintable: boolean; burnable: boolean;
}): string {
  const snake = toSnakeCase(opts.name);
  return `use anchor_lang::prelude::*;
use anchor_spl::token_2022::{
    self, Burn, MintTo, Token2022, Transfer,
};
use anchor_spl::token_interface::{Mint, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("11111111111111111111111111111111");

/// ${opts.name} — Multi-Token (Token-2022)
/// Gerado por FORGE3 · Anchor + Token Extensions
#[program]
pub mod ${snake} {
    use super::*;

    /// Cria um novo tipo de token na coleção multi-token
    pub fn create_token_type(
        ctx: Context<CreateTokenType>,
        token_id: u64,
        max_supply: Option<u64>,
    ) -> Result<()> {
        let token_type = &mut ctx.accounts.token_type;
        token_type.authority = ctx.accounts.authority.key();
        token_type.token_id = token_id;
        token_type.uri = "${opts.uri || "https://meu-projeto.com/api/{id}.json"}".to_string();
        token_type.max_supply = max_supply;
        token_type.current_supply = 0;
        msg!("Token type #{} criado", token_id);
        Ok(())
    }
${opts.mintable ? `
    /// Minta tokens de um tipo específico
    pub fn mint(
        ctx: Context<MintTokens>,
        token_id: u64,
        amount: u64,
    ) -> Result<()> {
        let token_type = &mut ctx.accounts.token_type;
        require!(
            ctx.accounts.authority.key() == token_type.authority,
            MultiTokenError::Unauthorized
        );
        if let Some(max) = token_type.max_supply {
            require!(
                token_type.current_supply.checked_add(amount).unwrap() <= max,
                MultiTokenError::MaxSupplyReached
            );
        }
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        token_2022::mint_to(cpi_ctx, amount)?;
        token_type.current_supply = token_type.current_supply.checked_add(amount).unwrap();
        msg!("Mintados {} tokens do tipo #{}", amount, token_id);
        Ok(())
    }
` : ""}${opts.burnable ? `
    /// Queima tokens de um tipo específico
    pub fn burn(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        token_2022::burn(cpi_ctx, amount)?;
        msg!("Queimados {} tokens", amount);
        Ok(())
    }
` : ""}
    /// Transfere tokens entre contas
    pub fn transfer(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.to.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        token_2022::transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

#[account]
pub struct TokenType {
    pub authority: Pubkey,
    pub token_id: u64,
    pub uri: String,
    pub max_supply: Option<u64>,
    pub current_supply: u64,
}

#[derive(Accounts)]
#[instruction(token_id: u64)]
pub struct CreateTokenType<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 128 + 9 + 8,
        seeds = [b"token-type", authority.key().as_ref(), token_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub token_type: Account<'info, TokenType>,
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = authority,
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}
${opts.mintable ? `
#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub token_type: Account<'info, TokenType>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub destination: InterfaceAccount<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token2022>,
}
` : ""}${opts.burnable ? `
#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub token_account: InterfaceAccount<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token2022>,
}
` : ""}
#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub to: InterfaceAccount<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token2022>,
}

#[error_code]
pub enum MultiTokenError {
    #[msg("Não autorizado")]
    Unauthorized,
    #[msg("Supply máximo atingido")]
    MaxSupplyReached,
}
`;
}

function generateSolanaDao(opts: {
  name: string; quorum: string; delay: string; period: string;
}): string {
  const snake = toSnakeCase(opts.name);
  const quorumBps = Math.floor(Number(opts.quorum) * 100) || 400;
  return `use anchor_lang::prelude::*;
use std::collections::BTreeMap;

declare_id!("11111111111111111111111111111111");

/// ${opts.name} — On-Chain DAO / Governance
/// Gerado por FORGE3 · Anchor Framework
#[program]
pub mod ${snake} {
    use super::*;

    /// Inicializa a DAO
    pub fn initialize(
        ctx: Context<Initialize>,
        voting_delay: i64,
        voting_period: i64,
        quorum_bps: u16,
    ) -> Result<()> {
        let dao = &mut ctx.accounts.dao;
        dao.authority = ctx.accounts.authority.key();
        dao.name = "${opts.name}".to_string();
        dao.voting_delay = voting_delay;   // em segundos
        dao.voting_period = voting_period; // em segundos
        dao.quorum_bps = quorum_bps;       // basis points (100 = 1%)
        dao.proposal_count = 0;
        msg!("DAO ${opts.name} inicializada · quorum {}bps", quorum_bps);
        Ok(())
    }

    /// Cria uma nova proposta
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        call_data: Vec<u8>,
    ) -> Result<()> {
        let dao = &ctx.accounts.dao;
        let proposal = &mut ctx.accounts.proposal;
        let clock = Clock::get()?;

        proposal.id = dao.proposal_count;
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.title = title.clone();
        proposal.description = description;
        proposal.call_data = call_data;
        proposal.created_at = clock.unix_timestamp;
        proposal.vote_start = clock.unix_timestamp + dao.voting_delay;
        proposal.vote_end = clock.unix_timestamp + dao.voting_delay + dao.voting_period;
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.abstain_votes = 0;
        proposal.executed = false;
        proposal.canceled = false;

        msg!("Proposta #{} criada: {}", proposal.id, title);
        Ok(())
    }

    /// Vota em uma proposta (0=Contra, 1=Favor, 2=Abstenção)
    pub fn cast_vote(ctx: Context<CastVote>, vote: u8, voting_power: u64) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let clock = Clock::get()?;

        require!(!proposal.canceled, DaoError::ProposalCanceled);
        require!(!proposal.executed, DaoError::AlreadyExecuted);
        require!(clock.unix_timestamp >= proposal.vote_start, DaoError::VotingNotStarted);
        require!(clock.unix_timestamp <= proposal.vote_end, DaoError::VotingEnded);
        require!(vote <= 2, DaoError::InvalidVote);

        match vote {
            0 => proposal.no_votes = proposal.no_votes.checked_add(voting_power).unwrap(),
            1 => proposal.yes_votes = proposal.yes_votes.checked_add(voting_power).unwrap(),
            _ => proposal.abstain_votes = proposal.abstain_votes.checked_add(voting_power).unwrap(),
        }

        let vote_record = &mut ctx.accounts.vote_record;
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.proposal_id = proposal.id;
        vote_record.vote = vote;
        vote_record.voting_power = voting_power;

        msg!("Voto registrado: {} com {} de poder de voto", ctx.accounts.voter.key(), voting_power);
        Ok(())
    }

    /// Executa uma proposta aprovada
    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        let dao = &ctx.accounts.dao;
        let proposal = &mut ctx.accounts.proposal;
        let clock = Clock::get()?;

        require!(!proposal.canceled, DaoError::ProposalCanceled);
        require!(!proposal.executed, DaoError::AlreadyExecuted);
        require!(clock.unix_timestamp > proposal.vote_end, DaoError::VotingNotEnded);

        let total_votes = proposal.yes_votes + proposal.no_votes + proposal.abstain_votes;
        let quorum_votes = total_votes * (dao.quorum_bps as u64) / 10000;
        require!(proposal.yes_votes >= quorum_votes, DaoError::QuorumNotReached);
        require!(proposal.yes_votes > proposal.no_votes, DaoError::ProposalDefeated);

        proposal.executed = true;
        msg!("Proposta #{} executada com sucesso! yes={} no={}", 
            proposal.id, proposal.yes_votes, proposal.no_votes);
        Ok(())
    }

    /// Cancela uma proposta (somente proposer ou authority)
    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        require!(!proposal.executed, DaoError::AlreadyExecuted);
        proposal.canceled = true;
        msg!("Proposta #{} cancelada", proposal.id);
        Ok(())
    }
}

#[account]
pub struct Dao {
    pub authority: Pubkey,
    pub name: String,
    pub voting_delay: i64,
    pub voting_period: i64,
    pub quorum_bps: u16,
    pub proposal_count: u64,
}

#[account]
pub struct Proposal {
    pub id: u64,
    pub proposer: Pubkey,
    pub title: String,
    pub description: String,
    pub call_data: Vec<u8>,
    pub created_at: i64,
    pub vote_start: i64,
    pub vote_end: i64,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub abstain_votes: u64,
    pub executed: bool,
    pub canceled: bool,
}

#[account]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub proposal_id: u64,
    pub vote: u8,
    pub voting_power: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 64 + 8 + 8 + 2 + 8)]
    pub dao: Account<'info, Dao>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub dao: Account<'info, Dao>,
    #[account(init, payer = proposer, space = 8 + 8 + 32 + 128 + 512 + 256 + 8 * 5 + 8 * 3 + 2)]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(init, payer = voter, space = 8 + 32 + 8 + 1 + 8)]
    pub vote_record: Account<'info, VoteRecord>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    pub dao: Account<'info, Dao>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    pub authority: Signer<'info>,
}

#[error_code]
pub enum DaoError {
    #[msg("Não autorizado")]
    Unauthorized,
    #[msg("Votação ainda não iniciou")]
    VotingNotStarted,
    #[msg("Votação encerrada")]
    VotingEnded,
    #[msg("Votação não encerrada")]
    VotingNotEnded,
    #[msg("Proposta já executada")]
    AlreadyExecuted,
    #[msg("Proposta cancelada")]
    ProposalCanceled,
    #[msg("Proposta derrotada")]
    ProposalDefeated,
    #[msg("Quórum não atingido")]
    QuorumNotReached,
    #[msg("Voto inválido (use 0=Contra, 1=Favor, 2=Abstenção)")]
    InvalidVote,
}
`;
}

export default function ContractForge() {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<Platform>("evm");

  // EVM state
  const [contractType, setContractType] = useState<ContractType>("erc20");
  const [network, setNetwork] = useState<Network>("base-sepolia");
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");

  // Solana state
  const [solanaContractType, setSolanaContractType] = useState<SolanaContractType>("spl-token");
  const [solanaNetwork, setSolanaNetwork] = useState<SolanaNetwork>("devnet");

  // ERC-20 options
  const [erc20Name, setErc20Name] = useState("MeuToken");
  const [erc20Symbol, setErc20Symbol] = useState("MTK");
  const [erc20Mintable, setErc20Mintable] = useState(false);
  const [erc20Burnable, setErc20Burnable] = useState(false);
  const [erc20Pausable, setErc20Pausable] = useState(false);
  const [erc20Permit, setErc20Permit] = useState(false);
  const [erc20Votes, setErc20Votes] = useState(false);
  const [erc20AccessControl, setErc20AccessControl] = useState<"ownable" | "roles" | "managed">("ownable");
  const [erc20Premint, setErc20Premint] = useState("1000000");

  // ERC-721 options
  const [erc721Name, setErc721Name] = useState("MeuNFT");
  const [erc721Symbol, setErc721Symbol] = useState("MNFT");
  const [erc721BaseUri, setErc721BaseUri] = useState("https://meu-projeto.com/metadata/");
  const [erc721Mintable, setErc721Mintable] = useState(true);
  const [erc721Burnable, setErc721Burnable] = useState(false);
  const [erc721Pausable, setErc721Pausable] = useState(false);
  const [erc721Enumerable, setErc721Enumerable] = useState(false);
  const [erc721URIStorage, setErc721URIStorage] = useState(true);

  // ERC-1155 options
  const [erc1155Name, setErc1155Name] = useState("MeuMultiToken");
  const [erc1155Uri, setErc1155Uri] = useState("https://meu-projeto.com/api/{id}.json");
  const [erc1155Mintable, setErc1155Mintable] = useState(true);
  const [erc1155Burnable, setErc1155Burnable] = useState(false);
  const [erc1155Pausable, setErc1155Pausable] = useState(false);

  // Governor options
  const [govName, setGovName] = useState("MinhaDAO");
  const [govDelay, setGovDelay] = useState("1 day");
  const [govPeriod, setGovPeriod] = useState("1 week");
  const [govQuorum, setGovQuorum] = useState("4");
  const [govTimelock, setGovTimelock] = useState<"" | "openzeppelin" | "compound">("");

  // Solana SPL Token options
  const [splName, setSplName] = useState("MeuToken");
  const [splSymbol, setSplSymbol] = useState("MTK");
  const [splDecimals, setSplDecimals] = useState("9");
  const [splPremint, setSplPremint] = useState("1000000");
  const [splMintable, setSplMintable] = useState(true);
  const [splBurnable, setSplBurnable] = useState(false);
  const [splPausable, setSplPausable] = useState(false);

  // Solana NFT options
  const [nftName, setNftName] = useState("MeuNFT");
  const [nftSymbol, setNftSymbol] = useState("MNFT");
  const [nftUri, setNftUri] = useState("https://meu-projeto.com/metadata/");
  const [nftMintable, setNftMintable] = useState(true);
  const [nftBurnable, setNftBurnable] = useState(false);

  // Solana Multi-token options
  const [multiName, setMultiName] = useState("MeuMultiToken");
  const [multiUri, setMultiUri] = useState("https://meu-projeto.com/api/{id}.json");
  const [multiMintable, setMultiMintable] = useState(true);
  const [multiBurnable, setMultiBurnable] = useState(false);

  // Solana DAO options
  const [daoName, setDaoName] = useState("MinhaDAO");
  const [daoQuorum, setDaoQuorum] = useState("4");
  const [daoDelay, setDaoDelay] = useState("86400");
  const [daoPeriod, setDaoPeriod] = useState("604800");

  // Custom contract options
  const [customDescription, setCustomDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerateCustom = async () => {
    if (!customDescription.trim() || isGenerating) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsGenerating(true);
    setCode("");

    try {
      const res = await fetch("/api/contracts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: customDescription,
          platform,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Falha na geração");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) setCode((prev) => prev + data.content);
            if (data.error) toast({ title: "Erro", description: data.error, variant: "destructive" });
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast({ title: "Erro", description: "Não foi possível gerar o contrato. Tente novamente.", variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (platform === "evm" && contractType === "custom") return;
    if (platform === "solana" && solanaContractType === "custom") return;
    try {
      if (platform === "evm") {
        let generated = "";
        if (contractType === "erc20") {
          generated = erc20.print({
            name: erc20Name || "MeuToken", symbol: erc20Symbol || "MTK",
            mintable: erc20Mintable, burnable: erc20Burnable, pausable: erc20Pausable,
            permit: erc20Permit, votes: erc20Votes, access: erc20AccessControl,
            premint: erc20Premint || "0",
          });
        } else if (contractType === "erc721") {
          generated = erc721.print({
            name: erc721Name || "MeuNFT", symbol: erc721Symbol || "MNFT",
            baseUri: erc721BaseUri, mintable: erc721Mintable, burnable: erc721Burnable,
            pausable: erc721Pausable, enumerable: erc721Enumerable, uriStorage: erc721URIStorage,
          });
        } else if (contractType === "erc1155") {
          generated = erc1155.print({
            name: erc1155Name || "MeuMultiToken", uri: erc1155Uri || "https://",
            mintable: erc1155Mintable, burnable: erc1155Burnable, pausable: erc1155Pausable,
          });
        } else if (contractType === "governor") {
          generated = governor.print({
            name: govName || "MinhaDAO", delay: govDelay, period: govPeriod,
            quorumMode: "percent", quorumPercent: Number(govQuorum) || 4,
            timelock: govTimelock || undefined, votes: "erc20votes",
            blockTime: 12, clockMode: "blocknumber",
          });
        }
        setCode(generated);
      } else {
        // Solana
        let generated = "";
        if (solanaContractType === "spl-token") {
          generated = generateSolanaToken({
            name: splName || "MeuToken", symbol: splSymbol || "MTK",
            decimals: splDecimals, premint: splPremint,
            mintable: splMintable, burnable: splBurnable, pausable: splPausable,
          });
        } else if (solanaContractType === "nft") {
          generated = generateSolanaNft({
            name: nftName || "MeuNFT", symbol: nftSymbol || "MNFT",
            uri: nftUri, mintable: nftMintable, burnable: nftBurnable,
          });
        } else if (solanaContractType === "multi-token") {
          generated = generateSolanaMultiToken({
            name: multiName || "MeuMultiToken", uri: multiUri,
            mintable: multiMintable, burnable: multiBurnable,
          });
        } else if (solanaContractType === "dao") {
          generated = generateSolanaDao({
            name: daoName || "MinhaDAO", quorum: daoQuorum,
            delay: daoDelay, period: daoPeriod,
          });
        }
        setCode(generated);
      }
    } catch {
      setCode("// Erro ao gerar contrato. Verifique os parâmetros.");
    }
  }, [
    platform,
    contractType, erc20Name, erc20Symbol, erc20Mintable, erc20Burnable, erc20Pausable,
    erc20Permit, erc20Votes, erc20AccessControl, erc20Premint,
    erc721Name, erc721Symbol, erc721BaseUri, erc721Mintable, erc721Burnable,
    erc721Pausable, erc721Enumerable, erc721URIStorage,
    erc1155Name, erc1155Uri, erc1155Mintable, erc1155Burnable, erc1155Pausable,
    govName, govDelay, govPeriod, govQuorum, govTimelock,
    solanaContractType,
    splName, splSymbol, splDecimals, splPremint, splMintable, splBurnable, splPausable,
    nftName, nftSymbol, nftUri, nftMintable, nftBurnable,
    multiName, multiUri, multiMintable, multiBurnable,
    daoName, daoQuorum, daoDelay, daoPeriod,
  ]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (platform === "evm") {
      toast({ title: "Código copiado!", description: "Cole no Remix IDE ou no seu projeto Hardhat/Foundry." });
    } else {
      toast({ title: "Código copiado!", description: "Cole no Solana Playground para compilar e fazer deploy." });
    }
  };

  const handleDownload = () => {
    const ext = platform === "solana" ? "rs" : "sol";
    const name = platform === "evm"
      ? (contractType === "erc20" ? erc20Name : contractType === "erc721" ? erc721Name : contractType === "erc1155" ? "MultiToken" : contractType === "custom" ? "Contrato" : govName)
      : (solanaContractType === "spl-token" ? splName : solanaContractType === "nft" ? nftName : solanaContractType === "multi-token" ? multiName : solanaContractType === "custom" ? "Programa" : daoName);
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenSolanaPlayground = async () => {
    await navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado!",
      description: "O Solana Playground abrirá. Crie um novo arquivo lib.rs e cole o código para compilar e fazer deploy.",
    });
    window.open("https://beta.solpg.io/", "_blank", "noopener,noreferrer");
  };

  const selectedEvmNetwork = EVM_NETWORKS.find((n) => n.id === network)!;
  const selectedSolanaNetwork = SOLANA_NETWORKS.find((n) => n.id === solanaNetwork)!;

  const currentFileName = platform === "evm"
    ? `${contractType === "erc20" ? erc20Name : contractType === "erc721" ? erc721Name : contractType === "erc1155" ? "MultiToken" : contractType === "custom" ? "Contrato" : govName}.sol`
    : `${solanaContractType === "spl-token" ? splName : solanaContractType === "nft" ? nftName : solanaContractType === "multi-token" ? multiName : solanaContractType === "custom" ? "Programa" : daoName}.rs`;

  const isCustomMode = (platform === "evm" && contractType === "custom") || (platform === "solana" && solanaContractType === "custom");

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left panel */}
      <div className="w-96 shrink-0 border-r border-border/50 overflow-y-auto bg-card/20 p-6 space-y-6">
        <div>
          <Badge variant="outline" className="font-mono bg-background text-primary border-primary/30 uppercase tracking-widest mb-3">
            Contract Forge
          </Badge>
          <h1 className="text-2xl font-bold">Gerador de Contratos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {platform === "evm" ? "OpenZeppelin · Solidity · EVM" : "Anchor Framework · Rust · Solana"}
          </p>
        </div>

        {/* Platform Selector */}
        <div className="space-y-2">
          <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Blockchain</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPlatform("evm")}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-mono transition-all ${
                platform === "evm"
                  ? "border-secondary bg-secondary/10 text-secondary"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <Zap className="h-4 w-4" />
              EVM
            </button>
            <button
              onClick={() => setPlatform("solana")}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-mono transition-all ${
                platform === "solana"
                  ? "border-chart-3 bg-chart-3/10 text-chart-3"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.645 16.225a.77.77 0 0 1 .541-.223h15.614a.386.386 0 0 1 .273.658l-3.09 3.09a.77.77 0 0 1-.541.223H1.828a.386.386 0 0 1-.273-.658l3.09-3.09zM4.645 4.025a.77.77 0 0 1 .541-.223h15.614a.386.386 0 0 1 .273.658l-3.09 3.09a.77.77 0 0 1-.541.223H1.828a.386.386 0 0 1-.273-.658l3.09-3.09zM20.172 10.125a.386.386 0 0 1-.273.658H4.285a.77.77 0 0 1-.541-.223l-3.09-3.09a.386.386 0 0 1 .273-.658H16.54a.77.77 0 0 1 .541.223l3.09 3.09z" />
              </svg>
              Solana
            </button>
          </div>
        </div>

        {platform === "evm" ? (
          <>
            {/* Network Selector EVM */}
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Rede de Deploy</Label>
              <Select value={network} onValueChange={(v) => setNetwork(v as Network)}>
                <SelectTrigger className="font-mono bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVM_NETWORKS.map((n) => (
                    <SelectItem key={n.id} value={n.id} className="font-mono">
                      <span className="flex items-center gap-2">
                        <span className={n.color}>●</span>
                        {n.name}
                        <span className="text-muted-foreground text-xs ml-auto">{n.gas}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-background/50 border border-border/30 rounded-lg px-3 py-2">
                <Shield className="h-3 w-3 text-primary shrink-0" />
                Chain ID {selectedEvmNetwork.chain} · Gas estimado: {selectedEvmNetwork.gas}
              </div>
            </div>

            {/* Contract Type EVM */}
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Tipo de Contrato</Label>
              <Tabs value={contractType} onValueChange={(v) => { setCode(""); setContractType(v as ContractType); }}>
                <TabsList className="grid grid-cols-5 w-full bg-background/50 h-auto p-1">
                  {[
                    { value: "erc20", icon: BarChart3, label: "Token" },
                    { value: "erc721", icon: Code2, label: "NFT" },
                    { value: "erc1155", icon: Layers, label: "Multi" },
                    { value: "governor", icon: Users, label: "DAO" },
                    { value: "custom", icon: Sparkles, label: "Custom" },
                  ].map(({ value, icon: Icon, label }) => (
                    <TabsTrigger key={value} value={value} className="flex flex-col gap-1 py-2 h-auto data-[state=active]:bg-card font-mono text-xs">
                      <Icon className="h-4 w-4" />
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="erc20" className="space-y-4 mt-4">
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">Informações Básicas</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Nome do Token</Label>
                        <Input value={erc20Name} onChange={(e) => setErc20Name(e.target.value)} className="font-mono bg-background h-8 text-sm" placeholder="MeuToken" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Símbolo (ticker)</Label>
                        <Input value={erc20Symbol} onChange={(e) => setErc20Symbol(e.target.value.toUpperCase())} className="font-mono bg-background h-8 text-sm" placeholder="MTK" maxLength={10} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Supply inicial (tokens)</Label>
                        <Input value={erc20Premint} onChange={(e) => setErc20Premint(e.target.value)} className="font-mono bg-background h-8 text-sm" type="number" min="0" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">Funcionalidades</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4">
                      <SwitchRow id="mintable" label="Mintable" desc="Criação de novos tokens" checked={erc20Mintable} onCheckedChange={setErc20Mintable} />
                      <SwitchRow id="burnable" label="Burnable" desc="Queima de tokens" checked={erc20Burnable} onCheckedChange={setErc20Burnable} />
                      <SwitchRow id="pausable" label="Pausable" desc="Pausar transferências" checked={erc20Pausable} onCheckedChange={setErc20Pausable} />
                      <SwitchRow id="permit" label="Permit (ERC-2612)" desc="Aprovações sem gas" checked={erc20Permit} onCheckedChange={setErc20Permit} />
                      <SwitchRow id="votes" label="Votes" desc="Governança on-chain" checked={erc20Votes} onCheckedChange={setErc20Votes} />
                    </CardContent>
                  </Card>
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">Controle de Acesso</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4">
                      <Select value={erc20AccessControl} onValueChange={(v) => setErc20AccessControl(v as "ownable" | "roles" | "managed")}>
                        <SelectTrigger className="font-mono bg-background text-sm h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ownable" className="font-mono text-sm">Ownable (1 dono)</SelectItem>
                          <SelectItem value="roles" className="font-mono text-sm">Role-Based</SelectItem>
                          <SelectItem value="managed" className="font-mono text-sm">Managed (AccessManager)</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="erc721" className="space-y-4 mt-4">
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">Informações do NFT</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Nome da Coleção</Label><Input value={erc721Name} onChange={(e) => setErc721Name(e.target.value)} className="font-mono bg-background h-8 text-sm" /></div>
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Símbolo</Label><Input value={erc721Symbol} onChange={(e) => setErc721Symbol(e.target.value.toUpperCase())} className="font-mono bg-background h-8 text-sm" maxLength={10} /></div>
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Base URI de Metadata</Label><Input value={erc721BaseUri} onChange={(e) => setErc721BaseUri(e.target.value)} className="font-mono bg-background h-8 text-sm" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">Funcionalidades</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4">
                      <SwitchRow id="nft-mintable" label="Mintable" checked={erc721Mintable} onCheckedChange={setErc721Mintable} />
                      <SwitchRow id="nft-burnable" label="Burnable" checked={erc721Burnable} onCheckedChange={setErc721Burnable} />
                      <SwitchRow id="nft-pausable" label="Pausable" checked={erc721Pausable} onCheckedChange={setErc721Pausable} />
                      <SwitchRow id="nft-enumerable" label="Enumerable" checked={erc721Enumerable} onCheckedChange={setErc721Enumerable} />
                      <SwitchRow id="nft-uri-storage" label="URI Storage" checked={erc721URIStorage} onCheckedChange={setErc721URIStorage} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="erc1155" className="space-y-4 mt-4">
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">Multi-Token</CardTitle><CardDescription className="text-xs">Token fungível e NFT no mesmo contrato</CardDescription></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">URI de Metadata</Label><Input value={erc1155Uri} onChange={(e) => setErc1155Uri(e.target.value)} className="font-mono bg-background h-8 text-sm" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">Funcionalidades</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4">
                      <SwitchRow id="multi-mintable" label="Mintable" checked={erc1155Mintable} onCheckedChange={setErc1155Mintable} />
                      <SwitchRow id="multi-burnable" label="Burnable" checked={erc1155Burnable} onCheckedChange={setErc1155Burnable} />
                      <SwitchRow id="multi-pausable" label="Pausable" checked={erc1155Pausable} onCheckedChange={setErc1155Pausable} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="governor" className="space-y-4 mt-4">
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">Configuração da DAO</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Nome da DAO</Label><Input value={govName} onChange={(e) => setGovName(e.target.value)} className="font-mono bg-background h-8 text-sm" /></div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Delay de votação</Label>
                        <Select value={govDelay} onValueChange={setGovDelay}>
                          <SelectTrigger className="font-mono bg-background h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>{["0", "1 day", "2 days", "1 week"].map((d) => <SelectItem key={d} value={d} className="font-mono text-sm">{d || "0 (imediato)"}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Período de votação</Label>
                        <Select value={govPeriod} onValueChange={setGovPeriod}>
                          <SelectTrigger className="font-mono bg-background h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>{["1 day", "3 days", "1 week", "2 weeks"].map((p) => <SelectItem key={p} value={p} className="font-mono text-sm">{p}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Quórum mínimo (%)</Label><Input value={govQuorum} onChange={(e) => setGovQuorum(e.target.value)} className="font-mono bg-background h-8 text-sm" type="number" min="1" max="100" /></div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Timelock</Label>
                        <Select value={govTimelock} onValueChange={(v) => setGovTimelock(v as "" | "openzeppelin" | "compound")}>
                          <SelectTrigger className="font-mono bg-background h-8 text-sm"><SelectValue placeholder="Sem timelock" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="" className="font-mono text-sm">Sem timelock</SelectItem>
                            <SelectItem value="openzeppelin" className="font-mono text-sm">OpenZeppelin TimelockController</SelectItem>
                            <SelectItem value="compound" className="font-mono text-sm">Compound Timelock</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4 mt-4">
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Contrato Personalizado
                      </CardTitle>
                      <CardDescription className="text-xs">Descreva o contrato em português e a IA gera o Solidity completo</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <Textarea
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder={"Ex: Quero um token de staking onde usuários depositam tokens ERC-20 e recebem recompensas por bloco. O owner pode definir a taxa de recompensa. Com função de emergência para sacar sem recompensa."}
                        className="font-mono text-xs bg-background min-h-[160px] resize-none leading-relaxed"
                      />
                      <Button
                        className="w-full font-mono text-xs gap-2 bg-primary hover:bg-primary/90"
                        onClick={handleGenerateCustom}
                        disabled={isGenerating || !customDescription.trim()}
                      >
                        {isGenerating
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Gerando...</>
                          : <><Sparkles className="h-3.5 w-3.5" />Gerar com IA</>}
                      </Button>
                      {isGenerating && (
                        <p className="text-[10px] font-mono text-muted-foreground text-center animate-pulse">
                          Gerando contrato Solidity... O código aparece à direita em tempo real
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">Dicas</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                      {[
                        "Mencione funcionalidades: mintable, burnable, pausable, upgradeable",
                        "Descreva quem pode chamar cada função (owner, roles, público)",
                        "Informe se precisa de eventos, mapping, structs específicos",
                        "Cite padrões: ERC-20, ERC-721, ERC-4626 (vault), Proxy",
                      ].map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-primary font-mono text-xs mt-0.5">›</span>
                          <p className="text-xs text-muted-foreground">{tip}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <p className="text-sm font-mono font-bold text-primary uppercase tracking-wider">Safe Multi-sig</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sua tesouraria é protegida pelo <strong className="text-foreground">Safe (Gnosis)</strong> — o padrão ouro de custódia multi-sig.
              </p>
              <a href="https://app.safe.global/new-safe/create" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-primary underline underline-offset-4">
                Criar Safe em safe.global →
              </a>
            </div>
          </>
        ) : (
          <>
            {/* Network Selector Solana */}
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Rede Solana</Label>
              <Select value={solanaNetwork} onValueChange={(v) => setSolanaNetwork(v as SolanaNetwork)}>
                <SelectTrigger className="font-mono bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOLANA_NETWORKS.map((n) => (
                    <SelectItem key={n.id} value={n.id} className="font-mono">
                      <span className="flex items-center gap-2">
                        <span className={n.color}>●</span>
                        {n.name}
                        <span className="text-muted-foreground text-xs ml-auto">{n.gas}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-background/50 border border-border/30 rounded-lg px-3 py-2">
                <Shield className="h-3 w-3 text-chart-3 shrink-0" />
                Solana · {selectedSolanaNetwork.name} · {selectedSolanaNetwork.gas}
              </div>
            </div>

            {/* Contract Type Solana */}
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Tipo de Programa</Label>
              <Tabs value={solanaContractType} onValueChange={(v) => { setCode(""); setSolanaContractType(v as SolanaContractType); }}>
                <TabsList className="grid grid-cols-5 w-full bg-background/50 h-auto p-1">
                  {[
                    { value: "spl-token", icon: Coins, label: "Token" },
                    { value: "nft", icon: Image, label: "NFT" },
                    { value: "multi-token", icon: Layers, label: "Multi" },
                    { value: "dao", icon: Users, label: "DAO" },
                    { value: "custom", icon: Sparkles, label: "Custom" },
                  ].map(({ value, icon: Icon, label }) => (
                    <TabsTrigger key={value} value={value} className="flex flex-col gap-1 py-2 h-auto data-[state=active]:bg-card font-mono text-xs">
                      <Icon className="h-4 w-4" />
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* SPL Token */}
                <TabsContent value="spl-token" className="space-y-4 mt-4">
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">SPL Token</CardTitle><CardDescription className="text-xs">Token fungível nativo da Solana</CardDescription></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Nome do Token</Label><Input value={splName} onChange={(e) => setSplName(e.target.value)} className="font-mono bg-background h-8 text-sm" placeholder="MeuToken" /></div>
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Símbolo</Label><Input value={splSymbol} onChange={(e) => setSplSymbol(e.target.value.toUpperCase())} className="font-mono bg-background h-8 text-sm" placeholder="MTK" maxLength={10} /></div>
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Decimais (padrão: 9)</Label><Input value={splDecimals} onChange={(e) => setSplDecimals(e.target.value)} className="font-mono bg-background h-8 text-sm" type="number" min="0" max="9" /></div>
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Supply inicial</Label><Input value={splPremint} onChange={(e) => setSplPremint(e.target.value)} className="font-mono bg-background h-8 text-sm" type="number" min="0" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">Funcionalidades</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4">
                      <SwitchRow id="spl-mintable" label="Mintable" desc="Criar novos tokens" checked={splMintable} onCheckedChange={setSplMintable} />
                      <SwitchRow id="spl-burnable" label="Burnable" desc="Queima de tokens" checked={splBurnable} onCheckedChange={setSplBurnable} />
                      <SwitchRow id="spl-pausable" label="Pausable" desc="Pausar transferências" checked={splPausable} onCheckedChange={setSplPausable} />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* NFT */}
                <TabsContent value="nft" className="space-y-4 mt-4">
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">NFT Collection</CardTitle><CardDescription className="text-xs">Metaplex · Anchor Framework</CardDescription></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Nome da Coleção</Label><Input value={nftName} onChange={(e) => setNftName(e.target.value)} className="font-mono bg-background h-8 text-sm" /></div>
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Símbolo</Label><Input value={nftSymbol} onChange={(e) => setNftSymbol(e.target.value.toUpperCase())} className="font-mono bg-background h-8 text-sm" maxLength={10} /></div>
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Base URI de Metadata</Label><Input value={nftUri} onChange={(e) => setNftUri(e.target.value)} className="font-mono bg-background h-8 text-sm" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">Funcionalidades</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4">
                      <SwitchRow id="nft-sol-mintable" label="Mintable" desc="Criar novos NFTs" checked={nftMintable} onCheckedChange={setNftMintable} />
                      <SwitchRow id="nft-sol-burnable" label="Burnable" desc="Queimar NFTs" checked={nftBurnable} onCheckedChange={setNftBurnable} />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Multi-Token */}
                <TabsContent value="multi-token" className="space-y-4 mt-4">
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">Multi-Token</CardTitle><CardDescription className="text-xs">Token-2022 · Múltiplos tipos de token</CardDescription></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Nome do Programa</Label><Input value={multiName} onChange={(e) => setMultiName(e.target.value)} className="font-mono bg-background h-8 text-sm" /></div>
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">URI de Metadata</Label><Input value={multiUri} onChange={(e) => setMultiUri(e.target.value)} className="font-mono bg-background h-8 text-sm" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">Funcionalidades</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4">
                      <SwitchRow id="multi-sol-mintable" label="Mintable" checked={multiMintable} onCheckedChange={setMultiMintable} />
                      <SwitchRow id="multi-sol-burnable" label="Burnable" checked={multiBurnable} onCheckedChange={setMultiBurnable} />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* DAO */}
                <TabsContent value="dao" className="space-y-4 mt-4">
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">DAO On-Chain</CardTitle><CardDescription className="text-xs">Governança nativa na Solana</CardDescription></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Nome da DAO</Label><Input value={daoName} onChange={(e) => setDaoName(e.target.value)} className="font-mono bg-background h-8 text-sm" /></div>
                      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Quórum mínimo (%)</Label><Input value={daoQuorum} onChange={(e) => setDaoQuorum(e.target.value)} className="font-mono bg-background h-8 text-sm" type="number" min="1" max="100" /></div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Delay de votação</Label>
                        <Select value={daoDelay} onValueChange={setDaoDelay}>
                          <SelectTrigger className="font-mono bg-background h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0" className="font-mono text-sm">0 (imediato)</SelectItem>
                            <SelectItem value="86400" className="font-mono text-sm">1 dia</SelectItem>
                            <SelectItem value="172800" className="font-mono text-sm">2 dias</SelectItem>
                            <SelectItem value="604800" className="font-mono text-sm">1 semana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Período de votação</Label>
                        <Select value={daoPeriod} onValueChange={setDaoPeriod}>
                          <SelectTrigger className="font-mono bg-background h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="86400" className="font-mono text-sm">1 dia</SelectItem>
                            <SelectItem value="259200" className="font-mono text-sm">3 dias</SelectItem>
                            <SelectItem value="604800" className="font-mono text-sm">1 semana</SelectItem>
                            <SelectItem value="1209600" className="font-mono text-sm">2 semanas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4 mt-4">
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-chart-3" />
                        Programa Personalizado
                      </CardTitle>
                      <CardDescription className="text-xs">Descreva o programa em português e a IA gera o Rust/Anchor completo</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <Textarea
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder={"Ex: Quero um programa de staking onde usuários depositam SOL e recebem recompensas diárias. O admin pode pausar o programa. Com função de emergência para sacar sem penalidade."}
                        className="font-mono text-xs bg-background min-h-[160px] resize-none leading-relaxed"
                      />
                      <Button
                        className="w-full font-mono text-xs gap-2 bg-chart-3 hover:bg-chart-3/90 text-black"
                        onClick={handleGenerateCustom}
                        disabled={isGenerating || !customDescription.trim()}
                      >
                        {isGenerating
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Gerando...</>
                          : <><Sparkles className="h-3.5 w-3.5" />Gerar com IA</>}
                      </Button>
                      {isGenerating && (
                        <p className="text-[10px] font-mono text-muted-foreground text-center animate-pulse">
                          Gerando programa Anchor/Rust... O código aparece à direita em tempo real
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="bg-background/30 border-border/50">
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-mono uppercase tracking-wider">Dicas</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                      {[
                        "Mencione as instruções (funções) que o programa deve ter",
                        "Descreva as contas (accounts) e seus relacionamentos",
                        "Informe quem pode chamar cada instrução (authority, owner)",
                        "Cite padrões: staking, swap, vault, governance, lottery",
                      ].map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-chart-3 font-mono text-xs mt-0.5">›</span>
                          <p className="text-xs text-muted-foreground">{tip}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Solana Playground info */}
            <div className="bg-chart-3/5 border border-chart-3/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-chart-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.645 16.225a.77.77 0 0 1 .541-.223h15.614a.386.386 0 0 1 .273.658l-3.09 3.09a.77.77 0 0 1-.541.223H1.828a.386.386 0 0 1-.273-.658l3.09-3.09zM4.645 4.025a.77.77 0 0 1 .541-.223h15.614a.386.386 0 0 1 .273.658l-3.09 3.09a.77.77 0 0 1-.541.223H1.828a.386.386 0 0 1-.273-.658l3.09-3.09zM20.172 10.125a.386.386 0 0 1-.273.658H4.285a.77.77 0 0 1-.541-.223l-3.09-3.09a.386.386 0 0 1 .273-.658H16.54a.77.77 0 0 1 .541.223l3.09 3.09z" />
                </svg>
                <p className="text-sm font-mono font-bold text-chart-3 uppercase tracking-wider">Solana Playground</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O <strong className="text-foreground">Solana Playground</strong> é o web IDE oficial para compilar, testar e fazer deploy de programas Anchor direto no browser — sem instalar nada.
              </p>
              <a href="https://beta.solpg.io/" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-chart-3 underline underline-offset-4">
                beta.solpg.io →
              </a>
            </div>
          </>
        )}
      </div>

      {/* Right panel — code output */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0f]">
        {/* Toolbar */}
        <div className="h-12 border-b border-border/30 flex items-center justify-between px-4 bg-card/20 shrink-0">
          <div className="flex items-center gap-3">
            <Code2 className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              {currentFileName}
            </span>
            {platform === "evm" ? (
              <>
                <Badge variant="outline" className="font-mono text-[10px] bg-secondary/10 text-secondary border-secondary/20 uppercase">
                  Solidity ^0.8.22
                </Badge>
                <Badge variant="outline" className={`font-mono text-[10px] uppercase ${selectedEvmNetwork.color} bg-background border-border/30`}>
                  {selectedEvmNetwork.name}
                </Badge>
              </>
            ) : (
              <>
                <Badge variant="outline" className="font-mono text-[10px] bg-chart-3/10 text-chart-3 border-chart-3/20 uppercase">
                  Rust · Anchor
                </Badge>
                <Badge variant="outline" className={`font-mono text-[10px] uppercase ${selectedSolanaNetwork.color} bg-background border-border/30`}>
                  {selectedSolanaNetwork.name}
                </Badge>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="font-mono text-xs">
                {platform === "evm" ? "Download .sol" : "Download .rs"}
              </TooltipContent>
            </Tooltip>
            <Button variant="outline" size="sm" className="font-mono text-xs h-8 gap-2" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5 text-secondary" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : "Copiar"}
            </Button>
            {platform === "evm" ? (
              <a href="https://remix.ethereum.org" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="font-mono text-xs h-8 bg-primary hover:bg-primary/90">
                  Abrir no Remix
                </Button>
              </a>
            ) : (
              <Button
                size="sm"
                className="font-mono text-xs h-8 bg-chart-3 hover:bg-chart-3/90 text-black gap-2"
                onClick={handleOpenSolanaPlayground}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.645 16.225a.77.77 0 0 1 .541-.223h15.614a.386.386 0 0 1 .273.658l-3.09 3.09a.77.77 0 0 1-.541.223H1.828a.386.386 0 0 1-.273-.658l3.09-3.09zM4.645 4.025a.77.77 0 0 1 .541-.223h15.614a.386.386 0 0 1 .273.658l-3.09 3.09a.77.77 0 0 1-.541.223H1.828a.386.386 0 0 1-.273-.658l3.09-3.09zM20.172 10.125a.386.386 0 0 1-.273.658H4.285a.77.77 0 0 1-.541-.223l-3.09-3.09a.386.386 0 0 1 .273-.658H16.54a.77.77 0 0 1 .541.223l3.09 3.09z" />
                </svg>
                Abrir no Playground
              </Button>
            )}
          </div>
        </div>

        {/* Code Block */}
        <div className="flex-1 overflow-auto p-6">
          {isCustomMode && !code && !isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <Sparkles className="h-10 w-10 text-primary/30" />
              <p className="font-mono text-sm text-muted-foreground/60">
                Descreva seu contrato e clique em <strong className="text-muted-foreground">Gerar com IA</strong>
              </p>
              <p className="font-mono text-xs text-muted-foreground/40 max-w-xs">
                O código gerado aparecerá aqui em tempo real conforme a IA escreve
              </p>
            </div>
          ) : (
            <pre className={`font-mono text-sm leading-relaxed whitespace-pre-wrap break-all ${platform === "solana" ? "text-orange-300/90" : "text-green-300/90"}`}>
              <code>{code}{isGenerating && <span className="animate-pulse text-primary">▋</span>}</code>
            </pre>
          )}
        </div>

        {/* Footer strip */}
        <div className="h-10 border-t border-border/30 bg-card/10 flex items-center px-4 gap-6 shrink-0">
          <div className="flex items-center gap-1.5">
            <Info className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {code.split('\n').length} linhas · {platform === "evm" ? "OpenZeppelin v5" : "Anchor Framework"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {platform === "evm"
              ? "Código auditado e testado pela equipe OpenZeppelin"
              : "Gerado com Anchor · Rust · Solana Program Library"}
          </span>
          <span className={`text-[10px] font-mono ml-auto ${platform === "solana" ? "text-chart-3" : "text-secondary"}`}>
            {platform === "evm"
              ? `Deploy em ${selectedEvmNetwork.name}: ${selectedEvmNetwork.gas} de gas`
              : `Deploy em ${selectedSolanaNetwork.name}: ${selectedSolanaNetwork.gas}`}
          </span>
        </div>
      </div>
    </div>
  );
}
