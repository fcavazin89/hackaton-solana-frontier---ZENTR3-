import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck, Play, Copy, Check, Download, Loader2,
  ChevronRight, Code2, FlaskConical, Search, Zap, RotateCcw, FileCode2, Box
} from "lucide-react";

type Language = "solidity" | "vyper" | "rust";
type Platform = "ethereum" | "solana" | "polkadot" | "stellar" | "near" | "cosmwasm";
type Mode = "full" | "audit" | "foundry-tests" | "vyper-tests" | "rust-tests";

const EXAMPLE_SOLIDITY = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleVault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount; // BUG: reentrancy
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}`;

const EXAMPLE_VYPER = `# @version ^0.3.10

balances: HashMap[address, uint256]

@external
@payable
def deposit():
    self.balances[msg.sender] += msg.value

@external
def withdraw(amount: uint256):
    assert self.balances[msg.sender] >= amount, "Insufficient"
    self.balances[msg.sender] -= amount
    send(msg.sender, amount)

@external
@view
def get_balance() -> uint256:
    return self.balance`;

const EXAMPLE_RUST_SOLANA = `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod simple_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.user.key();
        vault.balance = 0;
        Ok(())
    }

    // BUG: missing signer check — anyone can withdraw
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(vault.balance >= amount, VaultError::InsufficientFunds);
        vault.balance -= amount;
        **ctx.accounts.user.try_borrow_mut_lamports()? += amount;
        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 32 + 8)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    // BUG: user is not a Signer here
    #[account(mut)]
    pub user: AccountInfo<'info>,
}

#[account]
pub struct Vault {
    pub owner: Pubkey,
    pub balance: u64,
}

#[error_code]
pub enum VaultError {
    #[msg("Insufficient funds in vault")]
    InsufficientFunds,
}`;

const EXAMPLE_RUST_POLKADOT = `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod simple_vault {
    use ink::storage::Mapping;

    #[ink(storage)]
    pub struct SimpleVault {
        balances: Mapping<AccountId, Balance>,
        // BUG: owner not stored — no admin check possible
    }

    #[ink(event)]
    pub struct Deposit {
        #[ink(topic)]
        from: AccountId,
        value: Balance,
    }

    #[ink(event)]
    pub struct Withdrawal {
        #[ink(topic)]
        to: AccountId,
        value: Balance,
    }

    impl SimpleVault {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                balances: Mapping::default(),
            }
        }

        #[ink(message, payable)]
        pub fn deposit(&mut self) {
            let caller = self.env().caller();
            let value = self.env().transferred_value();
            let current = self.balances.get(caller).unwrap_or(0);
            self.balances.insert(caller, &(current + value));
            self.env().emit_event(Deposit { from: caller, value });
        }

        // BUG: no caller validation — anyone can call drain_all
        #[ink(message)]
        pub fn drain_all(&mut self, recipient: AccountId) -> Result<(), &'static str> {
            let total = self.env().balance();
            self.env().transfer(recipient, total)
                .map_err(|_| "Transfer failed")?;
            Ok(())
        }

        #[ink(message)]
        pub fn balance_of(&self, account: AccountId) -> Balance {
            self.balances.get(account).unwrap_or(0)
        }
    }
}`;

const EXAMPLE_RUST_STELLAR = `#![no_std]
use soroban_sdk::{contract, contractimpl, token, Address, Env, Symbol, symbol_short};

#[contract]
pub struct SimpleVault;

#[contractimpl]
impl SimpleVault {
    // BUG: no authorization check — anyone can initialize
    pub fn initialize(env: Env, token: Address, admin: Address) {
        env.storage().persistent().set(&symbol_short!("TOKEN"), &token);
        env.storage().persistent().set(&symbol_short!("ADMIN"), &admin);
    }

    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let token: Address = env.storage().persistent()
            .get(&symbol_short!("TOKEN")).unwrap();
        let client = token::Client::new(&env, &token);
        client.transfer(&from, &env.current_contract_address(), &amount);
        let current: i128 = env.storage().persistent()
            .get(&symbol_short!("BAL")).unwrap_or(0);
        env.storage().persistent().set(&symbol_short!("BAL"), &(current + amount));
        // BUG: missing TTL bump — storage can expire and lose funds
    }

    // BUG: no admin check — anyone can withdraw all funds
    pub fn withdraw_all(env: Env, to: Address) {
        let token: Address = env.storage().persistent()
            .get(&symbol_short!("TOKEN")).unwrap();
        let balance: i128 = env.storage().persistent()
            .get(&symbol_short!("BAL")).unwrap_or(0);
        let client = token::Client::new(&env, &token);
        client.transfer(&env.current_contract_address(), &to, &balance);
    }
}`;

const EXAMPLE_RUST_NEAR = `use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, AccountId, Balance, Promise};
use near_sdk::collections::LookupMap;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct SimpleVault {
    balances: LookupMap<AccountId, Balance>,
    owner: AccountId,
}

impl Default for SimpleVault {
    fn default() -> Self {
        // BUG: no init guard — can be re-initialized
        Self {
            balances: LookupMap::new(b"b"),
            owner: env::predecessor_account_id(),
        }
    }
}

#[near_bindgen]
impl SimpleVault {
    pub fn deposit(&mut self) {
        let account = env::predecessor_account_id();
        let amount = env::attached_deposit();
        let current = self.balances.get(&account).unwrap_or(0);
        self.balances.insert(&account, &(current + amount));
    }

    // BUG: missing predecessor check — any account can drain
    pub fn withdraw(&mut self, amount: Balance) -> Promise {
        let account = env::predecessor_account_id();
        let balance = self.balances.get(&account).unwrap_or(0);
        assert!(balance >= amount, "Insufficient balance");
        // BUG: state updated AFTER promise — reentrancy window
        Promise::new(account.clone()).transfer(amount)
            .then(
                Self::ext(env::current_account_id())
                    .on_withdraw_complete(account, amount)
            )
    }

    // BUG: no callback guard — anyone can call this
    pub fn on_withdraw_complete(&mut self, account: AccountId, amount: Balance) {
        let balance = self.balances.get(&account).unwrap_or(0);
        self.balances.insert(&account, &(balance - amount));
    }

    pub fn get_balance(&self, account: AccountId) -> Balance {
        self.balances.get(&account).unwrap_or(0)
    }
}`;

const EXAMPLE_RUST_COSMWASM = `use cosmwasm_std::{
    entry_point, to_json_binary, BankMsg, Binary, Coin, Deps, DepsMut,
    Env, MessageInfo, Response, StdError, StdResult, Uint128,
};
use serde::{Deserialize, Serialize};
use cw_storage_plus::{Item, Map};

#[derive(Serialize, Deserialize)]
pub struct Config {
    pub admin: String,
    pub denom: String,
}

const CONFIG: Item<Config> = Item::new("config");
const BALANCES: Map<&str, Uint128> = Map::new("balances");

#[derive(Serialize, Deserialize)]
pub struct InstantiateMsg { pub denom: String }

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Deposit {},
    Withdraw { amount: Uint128 },
    // BUG: no admin check enforced in handler
    UpdateAdmin { new_admin: String },
    // BUG: migration not guarded
    DrainAll { recipient: String },
}

#[entry_point]
pub fn instantiate(
    deps: DepsMut, _env: Env, info: MessageInfo, msg: InstantiateMsg,
) -> StdResult<Response> {
    CONFIG.save(deps.storage, &Config {
        admin: info.sender.to_string(),
        denom: msg.denom,
    })?;
    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[entry_point]
pub fn execute(
    deps: DepsMut, _env: Env, info: MessageInfo, msg: ExecuteMsg,
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::Deposit {} => {
            let config = CONFIG.load(deps.storage)?;
            let amount = info.funds.iter()
                .find(|c| c.denom == config.denom)
                .map(|c| c.amount)
                .unwrap_or(Uint128::zero());
            let current = BALANCES.may_load(deps.storage, &info.sender.to_string())?
                .unwrap_or(Uint128::zero());
            BALANCES.save(deps.storage, &info.sender.to_string(), &(current + amount))?;
            Ok(Response::new().add_attribute("action", "deposit"))
        }
        ExecuteMsg::Withdraw { amount } => {
            let config = CONFIG.load(deps.storage)?;
            let key = info.sender.to_string();
            let balance = BALANCES.may_load(deps.storage, &key)?.unwrap_or(Uint128::zero());
            if balance < amount {
                return Err(StdError::generic_err("Insufficient balance"));
            }
            BALANCES.save(deps.storage, &key, &(balance - amount))?;
            Ok(Response::new()
                .add_message(BankMsg::Send {
                    to_address: info.sender.to_string(),
                    amount: vec![Coin { denom: config.denom, amount }],
                })
                .add_attribute("action", "withdraw"))
        }
        // BUG: anyone can update admin
        ExecuteMsg::UpdateAdmin { new_admin } => {
            let mut config = CONFIG.load(deps.storage)?;
            config.admin = new_admin;
            CONFIG.save(deps.storage, &config)?;
            Ok(Response::new())
        }
        // BUG: no admin check — anyone drains the vault
        ExecuteMsg::DrainAll { recipient } => {
            let config = CONFIG.load(deps.storage)?;
            let balance = deps.querier.query_balance(_env.contract.address, &config.denom)?;
            Ok(Response::new()
                .add_message(BankMsg::Send {
                    to_address: recipient,
                    amount: vec![balance],
                }))
        }
    }
}`;

const RUST_PLATFORMS: { id: Platform; label: string; badge: string; color: string; example: string }[] = [
  { id: "solana", label: "Solana", badge: "Anchor", color: "text-[#9945FF]", example: EXAMPLE_RUST_SOLANA },
  { id: "polkadot", label: "Polkadot", badge: "ink!", color: "text-[#E6007A]", example: EXAMPLE_RUST_POLKADOT },
  { id: "stellar", label: "Stellar", badge: "Soroban", color: "text-[#08B5E5]", example: EXAMPLE_RUST_STELLAR },
  { id: "near", label: "NEAR", badge: "near-sdk", color: "text-[#00C08B]", example: EXAMPLE_RUST_NEAR },
  { id: "cosmwasm", label: "CosmWasm", badge: "cosmwasm-std", color: "text-[#6366F1]", example: EXAMPLE_RUST_COSMWASM },
];

function getModes(language: Language): { id: Mode; label: string; desc: string; icon: typeof ShieldCheck }[] {
  if (language === "rust") {
    return [
      { id: "full", label: "Completo", desc: "Auditoria + testes Rust", icon: Search },
      { id: "audit", label: "Só Auditoria", desc: "Vulnerabilidades e correções", icon: ShieldCheck },
      { id: "rust-tests", label: "Rust Tests", desc: "#[test] / #[ink::test]", icon: FlaskConical },
    ];
  }
  return [
    { id: "full", label: "Completo", desc: "Auditoria + todos os testes", icon: Search },
    { id: "audit", label: "Só Auditoria", desc: "Vulnerabilidades e correções", icon: ShieldCheck },
    { id: "foundry-tests", label: "Foundry Tests", desc: "forge-std Solidity tests", icon: FlaskConical },
    { id: "vyper-tests", label: "Vyper Tests", desc: "pytest + titanoboa", icon: FileCode2 },
  ];
}

function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" className="h-7 gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground" onClick={handleCopy}>
      {copied ? <Check className="h-3 w-3 text-secondary" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copiado!" : label}
    </Button>
  );
}

function extractCodeBlocks(text: string, lang?: string): string {
  const regex = lang
    ? new RegExp("```" + lang + "\\s*\\n([\\s\\S]*?)```", "gi")
    : /```(?:\w+)?\s*\n([\s\S]*?)```/gi;
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) blocks.push(match[1].trim());
  }
  return blocks.join("\n\n");
}

function MarkdownOutput({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactElement[] = [];
  let inCodeBlock = false;
  let codeLang = "";
  let codeLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        const code = codeLines.join("\n");
        const isRust = codeLang === "rust";
        const isPython = codeLang === "python";
        elements.push(
          <div key={`code-${i}`} className="relative group my-3">
            <div className="flex items-center justify-between bg-[#0d1117] border border-border/40 rounded-t-lg px-4 py-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{codeLang || "code"}</span>
              <CopyButton text={code} />
            </div>
            <pre className={`bg-[#0d1117] border border-t-0 border-border/40 rounded-b-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed whitespace-pre ${isRust ? "text-orange-300/90" : isPython ? "text-yellow-300/90" : "text-green-300/90"}`}>
              <code>{code}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeLines = [];
        codeLang = "";
      } else {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) { codeLines.push(line); continue; }

    if (line.startsWith("### ")) {
      const text = line.slice(4);
      const isCritical = /crítico/i.test(text);
      const isHigh = /\balto\b/i.test(text);
      const isMed = /médio/i.test(text);
      const isLow = /baixo|info/i.test(text);
      const color = isCritical ? "text-red-400" : isHigh ? "text-orange-400" : isMed ? "text-yellow-400" : isLow ? "text-blue-400" : "text-foreground";
      elements.push(<h3 key={i} className={`font-mono font-bold text-sm mt-4 mb-1 ${color}`}>{text}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="font-mono font-bold text-base text-primary mt-6 mb-2 uppercase tracking-wider border-b border-border/30 pb-1">{line.slice(3)}</h2>);
    } else if (line.match(/^\*\*[^*]+:\*\*/)) {
      const bold = line.match(/^\*\*([^*]+):\*\*(.*)/)!;
      elements.push(<p key={i} className="text-sm mt-1"><span className="font-mono font-bold text-secondary">{bold[1]}:</span><span className="text-muted-foreground">{bold[2]}</span></p>);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(<p key={i} className="font-mono text-xs font-bold text-foreground/80 mt-2">{line.slice(2, -2)}</p>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(<li key={i} className="text-sm text-muted-foreground ml-4 list-disc">{line.slice(2)}</li>);
    } else if (line.match(/^\d+\. /)) {
      elements.push(<li key={i} className="text-sm text-muted-foreground ml-4 list-decimal">{line.replace(/^\d+\. /, "")}</li>);
    } else if (line.startsWith("---")) {
      elements.push(<hr key={i} className="border-border/30 my-4" />);
    } else if (line.trim()) {
      elements.push(<p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>);
    }
  }

  return <div className="space-y-1">{elements}</div>;
}

export default function AuditStudio() {
  const { toast } = useToast();
  const [language, setLanguage] = useState<Language>("solidity");
  const [platform, setPlatform] = useState<Platform>("ethereum");
  const [code, setCode] = useState(EXAMPLE_SOLIDITY);
  const [mode, setMode] = useState<Mode>("full");
  const [isStreaming, setIsStreaming] = useState(false);
  const [output, setOutput] = useState("");
  const [activeTab, setActiveTab] = useState("full");
  const abortRef = useRef<AbortController | null>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming) outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output, isStreaming]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setOutput("");
    setMode("full");
    if (lang === "rust") {
      setPlatform("solana");
      setCode(EXAMPLE_RUST_SOLANA);
    } else if (lang === "vyper") {
      setPlatform("ethereum");
      setCode(EXAMPLE_VYPER);
    } else {
      setPlatform("ethereum");
      setCode(EXAMPLE_SOLIDITY);
    }
  };

  const handlePlatformChange = (p: Platform) => {
    setPlatform(p);
    setOutput("");
    const rustPlat = RUST_PLATFORMS.find((x) => x.id === p);
    if (rustPlat) setCode(rustPlat.example);
  };

  const handleAnalyze = async () => {
    if (!code.trim() || isStreaming) return;
    setIsStreaming(true);
    setOutput("");
    setActiveTab("full");
    abortRef.current = new AbortController();

    const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

    try {
      const response = await fetch(`${BASE}/api/audit/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, platform, mode }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error("Request failed");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) setOutput((prev) => prev + data.content);
              if (data.done) { setIsStreaming(false); return; }
              if (data.error) throw new Error(data.error);
            } catch { /* skip malformed */ }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast({ title: "Erro na análise", description: "Tente novamente.", variant: "destructive" });
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStop = () => { abortRef.current?.abort(); setIsStreaming(false); };

  const handleReset = () => {
    setOutput("");
    if (language === "rust") {
      const rustPlat = RUST_PLATFORMS.find((x) => x.id === platform);
      setCode(rustPlat?.example ?? EXAMPLE_RUST_SOLANA);
    } else {
      setCode(language === "vyper" ? EXAMPLE_VYPER : EXAMPLE_SOLIDITY);
    }
  };

  const downloadOutput = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const isRust = language === "rust";
  const MODES = getModes(language);

  const rustCode = extractCodeBlocks(output, "rust");
  const foundryCode = extractCodeBlocks(output, "solidity");
  const vyperCode = extractCodeBlocks(output, "python");
  const primaryTestCode = isRust ? rustCode : foundryCode;
  const primaryTestFilename = isRust
    ? `${platform}_tests.rs`
    : "ContractTest.t.sol";

  const showFoundryTab = !isRust && (mode === "full" || mode === "foundry-tests");
  const showVyperTab = !isRust && (mode === "full" || mode === "vyper-tests");
  const showRustTab = isRust && (mode === "full" || mode === "rust-tests");

  const currentPlatformInfo = RUST_PLATFORMS.find((p) => p.id === platform);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left Panel */}
      <div className="w-[430px] shrink-0 border-r border-border/50 flex flex-col bg-card/10">
        <div className="p-4 border-b border-border/50 space-y-3">
          {/* Title */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-base">Audit Studio</h1>
              <p className="text-xs font-mono text-muted-foreground">AuditBot · Powered by FORGE3</p>
            </div>
          </div>

          {/* Language selector */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Linguagem</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(["solidity", "vyper", "rust"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`py-2 px-3 rounded-lg border font-mono text-xs font-bold transition-all ${
                    language === lang
                      ? lang === "rust"
                        ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                        : "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/40 bg-background/30 text-muted-foreground hover:border-border"
                  }`}
                >
                  {lang === "solidity" ? "Solidity" : lang === "vyper" ? "Vyper" : "🦀 Rust"}
                </button>
              ))}
            </div>
          </div>

          {/* Platform selector — only for Rust */}
          {isRust && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Plataforma</p>
              <div className="grid grid-cols-3 gap-1.5">
                {RUST_PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePlatformChange(p.id)}
                    className={`py-2 px-2 rounded-lg border text-left transition-all ${
                      platform === p.id
                        ? "border-orange-500/40 bg-orange-500/10"
                        : "border-border/40 bg-background/30 hover:border-border/60"
                    }`}
                  >
                    <p className={`font-mono text-[11px] font-bold ${p.color}`}>{p.label}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{p.badge}</p>
                  </button>
                ))}
              </div>
              {currentPlatformInfo && (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                  <Box className="h-3 w-3 text-orange-400 shrink-0" />
                  <p className="text-[10px] font-mono text-orange-300/80">
                    {platform === "solana" && "Anchor framework · solana-program-test"}
                    {platform === "polkadot" && "ink! 5.x · #[ink::test] module"}
                    {platform === "stellar" && "Soroban SDK · testutils + Env"}
                    {platform === "near" && "near-sdk-rs · VMContextBuilder tests"}
                    {platform === "cosmwasm" && "cosmwasm-std · mock_dependencies + mock_info"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mode selector */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Modo</p>
            <div className={`grid gap-1.5 ${MODES.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
              {MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                      mode === m.id
                        ? isRust
                          ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                          : "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/40 bg-background/30 text-muted-foreground hover:border-border"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-mono font-bold leading-none">{m.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Code editor */}
        <div className="flex-1 flex flex-col min-h-0 p-3 gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Código do Contrato
            </p>
            <div className="flex items-center gap-1">
              <CopyButton text={code} label="Copiar" />
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleReset} title="Reset para exemplo">
                <RotateCcw className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Cole seu contrato ${language === "solidity" ? "Solidity (.sol)" : language === "vyper" ? "Vyper (.vy)" : "Rust (.rs)"} aqui...`}
            className={`flex-1 font-mono text-xs resize-none bg-[#0a0a0f] border-border/50 leading-relaxed focus-visible:ring-primary/30 min-h-0 ${isRust ? "text-orange-300/80" : "text-green-300/80"}`}
          />
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-border/50 space-y-2">
          {isStreaming ? (
            <Button onClick={handleStop} variant="destructive" className="w-full font-mono uppercase tracking-wider">
              <div className="h-3 w-3 bg-current rounded-sm mr-2" />
              Parar Análise
            </Button>
          ) : (
            <Button
              onClick={handleAnalyze}
              disabled={!code.trim()}
              className={`w-full font-mono uppercase tracking-wider ${isRust ? "bg-orange-600 hover:bg-orange-500 text-white" : "bg-primary hover:bg-primary/90"}`}
            >
              <Play className="h-4 w-4 mr-2" />
              Analisar Contrato
            </Button>
          )}
          <div className="flex gap-1.5">
            {primaryTestCode && (
              <Button variant="outline" size="sm" className="flex-1 font-mono text-xs h-7"
                onClick={() => downloadOutput(primaryTestCode, primaryTestFilename)}>
                <Download className="h-3 w-3 mr-1" />{isRust ? ".rs" : ".t.sol"}
              </Button>
            )}
            {vyperCode && (
              <Button variant="outline" size="sm" className="flex-1 font-mono text-xs h-7"
                onClick={() => downloadOutput(vyperCode, "test_contract.py")}>
                <Download className="h-3 w-3 mr-1" />pytest
              </Button>
            )}
            {output && (
              <Button variant="outline" size="sm" className="flex-1 font-mono text-xs h-7"
                onClick={() => downloadOutput(output, "audit-report.md")}>
                <Download className="h-3 w-3 mr-1" />.md
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!output && !isStreaming ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-12">
            <div className="text-center space-y-3 max-w-lg">
              <ShieldCheck className={`h-16 w-16 mx-auto ${isRust ? "text-orange-500/20" : "text-primary/20"}`} />
              <h2 className="text-xl font-bold font-mono uppercase tracking-widest text-muted-foreground">Audit Studio</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cole um contrato, escolha o modo e clique em{" "}
                <span className={`font-mono ${isRust ? "text-orange-400" : "text-primary"}`}>Analisar Contrato</span>.
              </p>
            </div>

            {isRust ? (
              <div className="grid grid-cols-3 gap-2.5 w-full max-w-2xl">
                {RUST_PLATFORMS.map(({ id, label, badge, color }) => {
                  const vulns: Record<string, string[]> = {
                    solana: ["Missing Signer", "Account Ownership", "Arbitrary CPI", "PDA Collision"],
                    polkadot: ["Caller Validation", "Reentrancy", "Cross-contract", "Error Handling"],
                    stellar: ["require_auth()", "TTL / Storage", "Token Auth", "Replay Attacks"],
                    near: ["Predecessor Check", "Callback Guard", "State-before-Promise", "Init Guard"],
                    cosmwasm: ["Admin Check", "Reply Reentrancy", "Unbounded Iter", "Migrate Guard"],
                  };
                  return (
                    <button
                      key={id}
                      onClick={() => handlePlatformChange(id)}
                      className={`bg-card/30 border rounded-xl p-3 space-y-1.5 text-left transition-all hover:border-orange-500/30 ${platform === id ? "border-orange-500/40 bg-orange-500/5" : "border-border/50"}`}
                    >
                      <p className={`font-mono text-xs font-bold ${color}`}>{label}</p>
                      <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0">{badge}</Badge>
                      <ul className="space-y-0.5">
                        {(vulns[id] ?? []).map((v) => (
                          <li key={v} className="text-[9px] text-muted-foreground flex items-center gap-1">
                            <ChevronRight className="h-2 w-2 text-border shrink-0" />{v}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                {[
                  { icon: ShieldCheck, color: "text-red-400", label: "Vulnerabilidades", items: ["Reentrância", "Overflow", "Access Control", "Flash Loans"] },
                  { icon: FlaskConical, color: "text-secondary", label: "Foundry Tests", items: ["Unit Tests", "Fuzz Tests", "Invariants", "vm.prank()"] },
                  { icon: FileCode2, color: "text-chart-4", label: "Vyper / pytest", items: ["Fixtures", "Events", "State Checks", "titanoboa"] },
                ].map(({ icon: Icon, color, label, items }) => (
                  <div key={label} className="bg-card/30 border border-border/50 rounded-xl p-4 space-y-2">
                    <Icon className={`h-5 w-5 ${color}`} />
                    <p className="font-mono text-xs font-bold text-foreground">{label}</p>
                    <ul className="space-y-0.5">
                      {items.map((item) => (
                        <li key={item} className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <ChevronRight className="h-2.5 w-2.5 text-border" />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="border-b border-border/50 px-4 pt-2 bg-card/10 shrink-0 flex items-center gap-4">
              <TabsList className="bg-transparent border-0 h-auto p-0 gap-1">
                <TabsTrigger
                  value="full"
                  className="font-mono text-xs data-[state=active]:bg-card data-[state=active]:text-primary rounded-t-md rounded-b-none border border-b-0 border-border/30 px-3 py-2 h-auto data-[state=inactive]:border-transparent"
                >
                  <Search className="h-3 w-3 mr-1.5" />Relatório
                </TabsTrigger>

                {showFoundryTab && (
                  <TabsTrigger value="foundry" className="font-mono text-xs data-[state=active]:bg-card data-[state=active]:text-secondary rounded-t-md rounded-b-none border border-b-0 border-border/30 px-3 py-2 h-auto data-[state=inactive]:border-transparent">
                    <FlaskConical className="h-3 w-3 mr-1.5" />Foundry .t.sol
                  </TabsTrigger>
                )}
                {showVyperTab && (
                  <TabsTrigger value="vyper" className="font-mono text-xs data-[state=active]:bg-card data-[state=active]:text-chart-4 rounded-t-md rounded-b-none border border-b-0 border-border/30 px-3 py-2 h-auto data-[state=inactive]:border-transparent">
                    <FileCode2 className="h-3 w-3 mr-1.5" />pytest .py
                  </TabsTrigger>
                )}
                {showRustTab && (
                  <TabsTrigger value="rust" className="font-mono text-xs data-[state=active]:bg-card data-[state=active]:text-orange-400 rounded-t-md rounded-b-none border border-b-0 border-border/30 px-3 py-2 h-auto data-[state=inactive]:border-transparent">
                    <Code2 className="h-3 w-3 mr-1.5" />🦀 Rust Tests
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="ml-auto flex items-center gap-2 pb-1">
                {isStreaming && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${isRust ? "text-orange-400" : "text-secondary"}`}>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analisando...
                  </div>
                )}
                {output && !isStreaming && (
                  <Badge variant="outline" className={`font-mono text-[10px] ${isRust ? "text-orange-400 border-orange-400/20 bg-orange-400/10" : "text-secondary border-secondary/20 bg-secondary/10"}`}>
                    <Zap className="h-2.5 w-2.5 mr-1" />Análise completa
                  </Badge>
                )}
                {output && <CopyButton text={output} label="Copiar tudo" />}
              </div>
            </div>

            <TabsContent value="full" className="flex-1 overflow-auto p-5 m-0 data-[state=inactive]:hidden">
              <div className="max-w-3xl mx-auto">
                <MarkdownOutput content={output} />
                {isStreaming && <span className="inline-block w-1.5 h-4 bg-primary animate-pulse align-middle ml-1" />}
                <div ref={outputEndRef} />
              </div>
            </TabsContent>

            <TabsContent value="foundry" className="flex-1 overflow-auto m-0 data-[state=inactive]:hidden bg-[#0a0a0f]">
              {foundryCode ? (
                <div className="p-4">
                  <div className="flex items-center justify-between bg-card/30 border border-border/40 rounded-t-lg px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-secondary" />
                      <span className="font-mono text-xs text-secondary">ContractTest.t.sol</span>
                      <Badge variant="outline" className="font-mono text-[10px] bg-secondary/10 text-secondary border-secondary/20">forge-std</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyButton text={foundryCode} />
                      <Button variant="outline" size="sm" className="h-7 font-mono text-xs" onClick={() => downloadOutput(foundryCode, "ContractTest.t.sol")}>
                        <Download className="h-3 w-3 mr-1" />Download
                      </Button>
                    </div>
                  </div>
                  <pre className="bg-[#0d1117] border border-t-0 border-border/40 rounded-b-lg p-5 overflow-x-auto font-mono text-sm text-green-300/90 leading-relaxed whitespace-pre">
                    <code>{foundryCode}</code>
                  </pre>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center"><p className="font-mono text-sm text-muted-foreground">Aguardando testes Foundry...</p></div>
              )}
            </TabsContent>

            <TabsContent value="vyper" className="flex-1 overflow-auto m-0 data-[state=inactive]:hidden bg-[#0a0a0f]">
              {vyperCode ? (
                <div className="p-4">
                  <div className="flex items-center justify-between bg-card/30 border border-border/40 rounded-t-lg px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="h-4 w-4 text-chart-4" />
                      <span className="font-mono text-xs text-chart-4">test_contract.py</span>
                      <Badge variant="outline" className="font-mono text-[10px] bg-chart-4/10 text-chart-4 border-chart-4/20">pytest + titanoboa</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyButton text={vyperCode} />
                      <Button variant="outline" size="sm" className="h-7 font-mono text-xs" onClick={() => downloadOutput(vyperCode, "test_contract.py")}>
                        <Download className="h-3 w-3 mr-1" />Download
                      </Button>
                    </div>
                  </div>
                  <pre className="bg-[#0d1117] border border-t-0 border-border/40 rounded-b-lg p-5 overflow-x-auto font-mono text-sm text-yellow-300/90 leading-relaxed whitespace-pre">
                    <code>{vyperCode}</code>
                  </pre>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center"><p className="font-mono text-sm text-muted-foreground">Aguardando testes Vyper...</p></div>
              )}
            </TabsContent>

            <TabsContent value="rust" className="flex-1 overflow-auto m-0 data-[state=inactive]:hidden bg-[#0a0a0f]">
              {rustCode ? (
                <div className="p-4">
                  <div className="flex items-center justify-between bg-card/30 border border-border/40 rounded-t-lg px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-orange-400" />
                      <span className="font-mono text-xs text-orange-400">{primaryTestFilename}</span>
                      <Badge variant="outline" className="font-mono text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/20">
                        {platform === "solana" && "Anchor / solana-program-test"}
                        {platform === "polkadot" && "ink! #[ink::test]"}
                        {platform === "stellar" && "Soroban testutils"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyButton text={rustCode} />
                      <Button variant="outline" size="sm" className="h-7 font-mono text-xs" onClick={() => downloadOutput(rustCode, primaryTestFilename)}>
                        <Download className="h-3 w-3 mr-1" />Download
                      </Button>
                    </div>
                  </div>
                  <pre className="bg-[#0d1117] border border-t-0 border-border/40 rounded-b-lg p-5 overflow-x-auto font-mono text-sm text-orange-300/90 leading-relaxed whitespace-pre">
                    <code>{rustCode}</code>
                  </pre>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center"><p className="font-mono text-sm text-muted-foreground">Aguardando testes Rust...</p></div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
