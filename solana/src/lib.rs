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
pub struct DataAccount {
  pub git_ref: String,
}

entrypoint!(process_instruction);

pub fn process_instruction(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  // let msg = format!("Program working fine - {}", program_id);

  let accounts_iter = &mut accounts.iter();
  let account = next_account_info(accounts_iter)?;

  if account.owner != program_id {
    return Err(ProgramError::IllegalOwner);
  }

  // msg!("Account owner: {:?}", account.owner);
  //
  // let msg = account.key.to_string();
  // msg!(&msg);

  let data_account = DataAccount::try_from_slice(&instruction_data);
  let data_account = match data_account {
    Ok(a) => a,
    Err(err) => {
      msg!("Error deserializing DataAccount - {:?}", &err.to_string());
      return Err(ProgramError::InvalidInstructionData);
    }
  };

  let result = data_account.serialize(&mut &mut account.data.borrow_mut()[..]);
  if let Err(err) = result {
    msg!("Error deserializing DataAccount - {:?}", &err.to_string());
    return Err(ProgramError::InvalidInstructionData);
  }

  let account_data = DataAccount::try_from_slice(&account.data.borrow());
  match account_data {
    Ok(account_data) => {
      msg!(&account_data.git_ref);
    }
    Err(err) => {
      msg!("Error reading data - {:?}", &err.to_string());
      return Err(ProgramError::InvalidInstructionData);
    }
  }

  Ok(())
}