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
pub struct TestAccount {
  pub z: String,
}

entrypoint!(process_instruction);

pub fn process_instruction(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  let msg = format!("Program working fine - {}", program_id);
  msg!(&msg);

  let accounts_iter = &mut accounts.iter();
  let account = next_account_info(accounts_iter)?;
  let msg = account.key.to_string();
  msg!(&msg);

  let test_account = TestAccount::try_from_slice(&instruction_data);
  let mut t = match test_account {
    Ok(test_account) => test_account,
    Err(err) => {
      msg!("Error deserializing TestAccount");
      msg!(&err.to_string());
      return Ok(());
    }
  };

  let result = t.serialize(&mut &mut account.data.borrow_mut()[..]);
  if let Err(err) = result {
    msg!("Error serializing TestAccount");
    msg!(&err.to_string());
    return Ok(());
  }

  let account_data = TestAccount::try_from_slice(&account.data.borrow());
  match account_data {
    Ok(account_data) => {
      msg!(&account_data.z);
    }
    Err(err) => {
      msg!("Error reading account_data");
      msg!(&err.to_string());
      return Ok(());
    }
  }

  Ok(())
}