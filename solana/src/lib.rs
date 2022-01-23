use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

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

    let data = &account.data.borrow();
    msg!(data);

    Ok(())
}