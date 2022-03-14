use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{account_info::{next_account_info, AccountInfo}, entrypoint, entrypoint::ProgramResult, program::invoke, pubkey::Pubkey, program_error::ProgramError, msg};
use spl_token;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct InstructionData {
  pub amount: u64,
  pub git_ref: String,
}

entrypoint!(process_instruction);

pub fn process_instruction(
  _program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  // Parse instruction data
  let mut parsed: InstructionData = InstructionData::try_from_slice(&instruction_data)?;

  // Get account info
  let accounts_iter = &mut accounts.iter();
  let token_program = next_account_info(accounts_iter)?;
  let from_account = next_account_info(accounts_iter)?;
  let to_account = next_account_info(accounts_iter)?;
  let program_account = next_account_info(accounts_iter)?;
  let signer = next_account_info(accounts_iter)?;

  // Transfer to the associated token account owned by the program
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
  );

  match InstructionData::try_from_slice(&program_account.data.borrow()) {
    Ok(data) => {
      parsed.amount += data.amount;
    }
    Err(_) => {}
  };

  // Update the ledger account
  parsed.serialize(
    &mut &mut program_account.data.borrow_mut()[..]
  );

  Ok(())
}