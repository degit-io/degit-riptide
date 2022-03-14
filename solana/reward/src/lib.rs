use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
  account_info::{next_account_info, AccountInfo},
  entrypoint,
  entrypoint::ProgramResult,
  program::invoke,
  pubkey::Pubkey,
  program_error::ProgramError,
};
use spl_token;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct InstructionData {
  pub amount: u64,
  pub env: String,
}

entrypoint!(process_instruction);

const LOCAL_TOKEN_SOURCE_ACCOUNT: &str = "3GC36PPDbSd2BMDbXWrcMiZgu2uZTLXCrQ5hRwSNMWhG";
const DEV_TOKEN_SOURCE_ACCOUNT: &str = "3GC36PPDbSd2BMDbXWrcMiZgu2uZTLXCrQ5hRwSNMWhG";
const PROD_TOKEN_SOURCE_ACCOUNT: &str = "3GC36PPDbSd2BMDbXWrcMiZgu2uZTLXCrQ5hRwSNMWhG";


pub fn process_instruction(
  _program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  let accounts_iter = &mut accounts.iter();

  // Get account info
  let token_program = next_account_info(accounts_iter)?;
  let from_account = next_account_info(accounts_iter)?;
  let to_account = next_account_info(accounts_iter)?;
  let signer = next_account_info(accounts_iter)?;

  // Parse instruction data
  let parsed: InstructionData = InstructionData::try_from_slice(&instruction_data)?;

  let token_source_account = match parsed.env.as_str() {
    "local" => LOCAL_TOKEN_SOURCE_ACCOUNT,
    "dev" => LOCAL_TOKEN_SOURCE_ACCOUNT,
    "prod" => LOCAL_TOKEN_SOURCE_ACCOUNT,
    _ => return Err(ProgramError::InvalidArgument),
  };
  if from_account.key.to_string() != token_source_account {
    return Err(ProgramError::IllegalOwner);
  }

  let instruction = spl_token::instruction::transfer(
    token_program.key,
    from_account.key,
    to_account.key,
    signer.key,
    &[signer.key],
    parsed.amount,
  ).unwrap();

  invoke(
    &instruction,
    &[
      from_account.clone(),
      to_account.clone(),
      signer.clone(),
      token_program.clone(),
    ],
  )?;

  Ok(())
}