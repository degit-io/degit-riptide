use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
  account_info::{next_account_info, AccountInfo},
  entrypoint,
  entrypoint::ProgramResult,
  program_error::ProgramError,
  pubkey::Pubkey,
  program::invoke,
  msg,
};
use std::io::{Error};
use spl_token::{check_id};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct DAOInstruction {
  pub account_type: String,
  pub repo_owner: String,
  pub repo_name: String,
  pub orbit_id: String,
  pub total_investment: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct InvestInstruction {
  pub account_type: String,
  pub repo_owner: String,
  pub repo_name: String,
  pub orbit_id: String,
  pub investor: String,
  pub invested_amount: u64,
}

entrypoint!(process_instruction);

pub fn process_instruction(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  let accounts_iter = &mut accounts.iter();

  // The first account is the repository owner account
  let signer_account = next_account_info(accounts_iter)?;
  if !signer_account.is_signer {
    return Err(ProgramError::MissingRequiredSignature);
  }

  // The second account is the repository account
  let dao_account = next_account_info(accounts_iter)?;
  if dao_account.owner != program_id {
    return Err(ProgramError::IllegalOwner);
  }

  // Try if the instruction is a CreateDAOInstruction
  let dao_ins: Result<DAOInstruction, Error> = DAOInstruction::try_from_slice(
    &instruction_data
  );
  match dao_ins {
    Ok(ins) => {
      if ins.account_type == "dao".to_string() {
        let derived_pub_key = Pubkey::create_with_seed(
          signer_account.key,
          &ins.repo_name,
          program_id,
        )?;
        if derived_pub_key != *dao_account.key {
          return Err(ProgramError::InvalidArgument);
        }
        ins.serialize(
          &mut &mut dao_account.data.borrow_mut()[..]
        )?;
        return Ok(());
      }
    }
    Err(e) => {
      msg!("DAO instruction error {:?}", e);
    }
  }

  // Try if the instruction is a CreateDAOInstruction
  let invest_ins: Result<InvestInstruction, Error> = InvestInstruction::try_from_slice(
    &instruction_data
  );
  match invest_ins {
    Ok(ins) => {
      if ins.account_type == "investor".to_string() {
        // Validate DAO being invested
        let mut dao_data: DAOInstruction = match DAOInstruction::try_from_slice(
          &dao_account.data.borrow()
        ) {
          Ok(d) => d,
          Err(_) => return Err(ProgramError::InvalidAccountData),
        };

        // Validate investor account
        let investor_account = next_account_info(accounts_iter)?;
        if investor_account.owner != program_id {
          return Err(ProgramError::IllegalOwner);
        }

        // Get token accounts
        let from_token_account = next_account_info(accounts_iter)?;
        let to_token_account = next_account_info(accounts_iter)?;
        let token_program = next_account_info(accounts_iter)?;
        let assert_token_program_valid = check_id(token_program.key);

        if !assert_token_program_valid {
          return Err(ProgramError::InvalidArgument);
        }

        if from_token_account.owner != token_program.key {
          return Err(ProgramError::InvalidArgument);
        }

        if to_token_account.owner != token_program.key {
          return Err(ProgramError::InvalidArgument);
        }

        // Transfer token
        let instruction = spl_token::instruction::transfer(
          token_program.key,
          from_token_account.key,
          to_token_account.key,
          signer_account.key,
          &[signer_account.key],
          ins.invested_amount,
        ).unwrap();

        invoke(
          &instruction,
          &[
            from_token_account.clone(),
            to_token_account.clone(),
            signer_account.clone(),
            token_program.clone(),
          ],
        )?;

        // Update DAO total investment amount
        dao_data.total_investment += ins.invested_amount;
        dao_data.serialize(
          &mut &mut dao_account.data.borrow_mut()[..]
        )?;

        // Update investor total investment amount
        let mut investor_data = InvestInstruction::try_from_slice(&investor_account.data.borrow());
        if !investor_data.is_err() {
          let mut investor_data = investor_data.unwrap();
          investor_data.invested_amount += ins.invested_amount;
          investor_data.serialize(
            &mut &mut investor_account.data.borrow_mut()[..]
          )?;
        } else {
          ins.serialize(
            &mut &mut investor_account.data.borrow_mut()[..]
          )?;
        }

        return Ok(());
      }
    }
    Err(e) => {
      msg!("Investment instruction error {:?}", e);
    }
  };

  msg!("Program failed");
  Err(ProgramError::InvalidInstructionData)
}