use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
  account_info::{next_account_info, AccountInfo},
  entrypoint,
  entrypoint::ProgramResult,
  program_error::ProgramError,
  pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct InstructionData {
  pub git_ref: String,
  pub quorum: u8,
  pub owner: String
}

entrypoint!(process_instruction);

pub fn process_instruction(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  let accounts_iter = &mut accounts.iter();

  // The first account is the repository owner account
  let repo_owner_account = next_account_info(accounts_iter)?;
  if !repo_owner_account.is_signer {
    return Err(ProgramError::MissingRequiredSignature);
  }

  // The second account is the repository account
  let program_account = next_account_info(accounts_iter)?;
  if program_account.owner != program_id {
    return Err(ProgramError::IllegalOwner);
  }

  // Transform the instruction data into InstructionData
  let parsed: InstructionData = InstructionData::try_from_slice(&instruction_data)?;

  // Confirm the repository owner (which is the signer) is the owner of the repository
  let derived_pub_key = Pubkey::create_with_seed(
    repo_owner_account.key,
    &parsed.git_ref,
    program_id,
  )?;
  if derived_pub_key != *program_account.key {
    return Err(ProgramError::InvalidArgument);
  }

  // Write the data to the account
  parsed.serialize(
    &mut &mut program_account.data.borrow_mut()[..]
  )?;

  Ok(())
}