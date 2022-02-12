use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
  account_info::{next_account_info, AccountInfo},
  entrypoint,
  entrypoint::ProgramResult,
  msg,
  program_error::ProgramError,
  pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct InstructionData {
  pub git_ref: String,
}

entrypoint!(process_instruction);

pub fn process_instruction(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  let accounts_iter = &mut accounts.iter();
  let account = next_account_info(accounts_iter)?;

  // Validate the account is created by the program
  if account.owner != program_id {
    return Err(ProgramError::IllegalOwner);
  }

  // Transform the instruction data into a DataAccount
  let parsed = InstructionData::try_from_slice(&instruction_data);
  let parsed = match parsed {
    Ok(a) => a,
    Err(err) => {
      msg!("Failed to parse instruction data - {:?}", err);
      return Err(ProgramError::InvalidInstructionData);
    }
  };

  // Write the data to the account
  let result = parsed.serialize(&mut &mut account.data.borrow_mut()[..]);
  if let Err(err) = result {
    msg!("Error serialize InstructionData into account data - {:?}", err);
    return Err(ProgramError::InvalidInstructionData);
  }

  // Print the updated data for debug
  let account_data = InstructionData::try_from_slice(&account.data.borrow());
  msg!("Updated account data - {:?}", account_data);

  Ok(())
}