use crate::error::RNGProgramError::{
    InvalidAuth, NotSigner
};
use crate::instruction::{EmitterInstruction, WormholeProgramInstruction};
use crate::state::{Bumps, Config, FeeCollector, ForeignEmitter, ReceivedRaw, VaaHash, WormholeAddresses, WormholeEmitter, WormholeMessage};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::instruction::{AccountMeta, Instruction};
use solana_program::msg;
use solana_program::program::invoke_signed;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
};

pub struct Processor;
impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction: WormholeProgramInstruction = WormholeProgramInstruction::unpack(instruction_data)?;

        match instruction {
            WormholeProgramInstruction::Initialize => Self::initialize(accounts, program_id),
            WormholeProgramInstruction::RegisterEmitter {foreign_emitter}=> Self::register_emitter(accounts, program_id,foreign_emitter),
            WormholeProgramInstruction::SendMessage {message} => Self::send_message(accounts, program_id,message),
            WormholeProgramInstruction::ReceiveMessage {vaa_hash} => Self::receive_message(accounts, program_id, vaa_hash),
            WormholeProgramInstruction::InitConfigAndEmitter => Self::initialize_config_and_emitter(accounts, program_id),

        }
    }

    pub fn initialize(
        accounts: &[AccountInfo], 
        program_id: &Pubkey,
    ) -> ProgramResult {
        let accounts_iter: &mut std::slice::Iter<'_, AccountInfo<'_>> = &mut accounts.iter();

        let owner: &AccountInfo<'_> = next_account_info(accounts_iter)?; //signer
        let config: &AccountInfo<'_> = next_account_info(accounts_iter)?; //writable account data = Config
        let wormhole_program: &AccountInfo<'_> = next_account_info(accounts_iter)?; 
        let wormhole_bridge: &AccountInfo<'_> = next_account_info(accounts_iter)?; //writable account data = BridgeData
        let wormhole_fee_collector: &AccountInfo<'_> = next_account_info(accounts_iter)?; //writable account data FeeCollector
        let wormhole_emitter: &AccountInfo<'_> = next_account_info(accounts_iter)?; // account data WormholeEmitter
        let wormhole_sequence: &AccountInfo<'_> = next_account_info(accounts_iter)?; //writable
        let wormhole_message: &AccountInfo<'_> = next_account_info(accounts_iter)?; //writable
        let clock_account: &AccountInfo<'_> = next_account_info(accounts_iter)?;
        let rent_account: &AccountInfo<'_> = next_account_info(accounts_iter)?;
        let system_program: &AccountInfo<'_> = next_account_info(accounts_iter)?;


        let config_meta: AccountMeta = AccountMeta{pubkey:*config.key, is_signer:false, is_writable: true };
        let message_meta: AccountMeta = AccountMeta{pubkey:*wormhole_message.key, is_signer:true, is_writable: true };
        let emitter_meta: AccountMeta = AccountMeta{pubkey:*wormhole_emitter.key, is_signer:true, is_writable: true };
        let sequence_meta: AccountMeta = AccountMeta{pubkey:*wormhole_sequence.key, is_signer:false, is_writable: true };
        let payer_meta: AccountMeta = AccountMeta{pubkey:*owner.key, is_signer:true, is_writable: true };
        let fee_collector_meta: AccountMeta = AccountMeta{pubkey:*wormhole_fee_collector.key, is_signer:false, is_writable: true };
        let clock_meta: AccountMeta = AccountMeta{pubkey:*clock_account.key, is_signer:false, is_writable: false };
        let system_program_meta: AccountMeta = AccountMeta{pubkey:*system_program.key, is_signer:false, is_writable: false };
        let rent_meta: AccountMeta = AccountMeta{pubkey:*rent_account.key, is_signer:false, is_writable: false };

/*
        let wormhole_bridge_fee = FeeCollector::try_from_slice(&wormhole_fee_collector.data.borrow())?;
        let fee = wormhole_bridge_fee.fee;
        if fee > 0 {
            solana_program::program::invoke(
                &solana_program::system_instruction::transfer(
                    &owner.key,
                    &wormhole_fee_collector.key,
                    fee,
                ),
                &[owner.clone(),wormhole_fee_collector.clone()],
            )?;
        }
*/

        let mut payload: Vec<u8> = vec![0; 32];

        payload[..].copy_from_slice(&program_id.to_bytes());

        let ix:Instruction = Instruction { 
            program_id: *wormhole_program.key,
            accounts: [
                config_meta,
                message_meta,
                emitter_meta,
                sequence_meta,
                payer_meta,
                fee_collector_meta,
                clock_meta,
                system_program_meta,
                rent_meta,
            ].to_vec(), data:   EmitterInstruction::PostMessage 
            {   batch_id: 0, 
                alive: 0,
                payload: payload, 
                finality: 0 }.try_to_vec()?
        };

        const SEED_PREFIX_SENT: &[u8; 4] = b"sent";
        const INITIAL_SEQUENCE: u64 = 1;
        const SEED_PREFIX_EMITTER: &[u8; 7] = b"emitter";

        let (derived_message, bump) = Pubkey::find_program_address(&[SEED_PREFIX_SENT, &INITIAL_SEQUENCE.to_le_bytes(),], program_id);

        msg!("given message = {}",wormhole_message.key);
        msg!("derived message = {}",derived_message);
        msg!("{}",bump);

        invoke_signed(&ix, 
            &[
            owner.clone(),
            config.clone(),
            wormhole_program.clone(),
            wormhole_bridge.clone(),
            wormhole_fee_collector.clone(),
            wormhole_emitter.clone(),
            wormhole_sequence.clone(),
            wormhole_message.clone(),
            clock_account.clone(),
            rent_account.clone(),
            system_program.clone(),
            ], &[
                &[
                    SEED_PREFIX_SENT,
                    &INITIAL_SEQUENCE.to_le_bytes(),
                    &[255],
                ],
                &[
                    SEED_PREFIX_EMITTER, &[254]],
        ])?;




        Ok(())
    }

    pub fn register_emitter(
        accounts: &[AccountInfo], 
        program_id: &Pubkey,
        foreign_emitter: ForeignEmitter
    ) -> ProgramResult {
        let accounts_iter: &mut std::slice::Iter<'_, AccountInfo<'_>> = &mut accounts.iter();

        let owner: &AccountInfo<'_> = next_account_info(accounts_iter)?;//Signer
        let config_account: &AccountInfo<'_> = next_account_info(accounts_iter)?;
        let foreign_emitter_account: &AccountInfo<'_> = next_account_info(accounts_iter)?; //account data Foreign emitter

        let rent: Rent = Rent::default();
        let foreign_emitter_rent: u64 = rent.minimum_balance(42);
        let (foreign_emitter_pubkey, foreign_emitter_bump) = Pubkey::find_program_address(&[b"foreign_emitter"], program_id);

        let config =Config::try_from_slice(&config_account.data.borrow())?;

        if !owner.is_signer {return Err(NotSigner.into());}

        Self::check_authority(owner.key, config)?;

        invoke_signed(
            &system_instruction::create_account(
                owner.key, 
                &foreign_emitter_pubkey, 
                foreign_emitter_rent, 
                42, 
                program_id),
             &[owner.clone(),foreign_emitter_account.clone()], 
             &[&[b"foreign_emitter" ,&[foreign_emitter_bump]]])?;

        foreign_emitter.serialize(&mut &mut foreign_emitter_account.data.borrow_mut()[..])?;

        Ok(())
    }

    pub fn send_message(
        accounts: &[AccountInfo], 
        program_id: &Pubkey,
        message: WormholeMessage
    ) -> ProgramResult {
        let accounts_iter: &mut std::slice::Iter<'_, AccountInfo<'_>> = &mut accounts.iter();

        let owner: &AccountInfo<'_> = next_account_info(accounts_iter)?; //signer
        let config: &AccountInfo<'_> = next_account_info(accounts_iter)?; //writable account data = Config
        let wormhole_program: &AccountInfo<'_> = next_account_info(accounts_iter)?; 
        let wormhole_bridge: &AccountInfo<'_> = next_account_info(accounts_iter)?; //writable account data = BridgeData
        let wormhole_fee_collector: &AccountInfo<'_> = next_account_info(accounts_iter)?; //writable account data FeeCollector
        let wormhole_emitter: &AccountInfo<'_> = next_account_info(accounts_iter)?; // account data WormholeEmitter
        let wormhole_sequence: &AccountInfo<'_> = next_account_info(accounts_iter)?; //writable
        let wormhole_message: &AccountInfo<'_> = next_account_info(accounts_iter)?; //writable
        let clock_account: &AccountInfo<'_> = next_account_info(accounts_iter)?;
        let rent_account: &AccountInfo<'_> = next_account_info(accounts_iter)?;
        let system_program: &AccountInfo<'_> = next_account_info(accounts_iter)?;


        let config_meta: AccountMeta = AccountMeta{pubkey:*config.key, is_signer:false, is_writable: true };
        let message_meta: AccountMeta = AccountMeta{pubkey:*wormhole_message.key, is_signer:true, is_writable: true };
        let emitter_meta: AccountMeta = AccountMeta{pubkey:*wormhole_emitter.key, is_signer:true, is_writable: false };
        let sequence_meta: AccountMeta = AccountMeta{pubkey:*wormhole_sequence.key, is_signer:false, is_writable: true };
        let payer_meta: AccountMeta = AccountMeta{pubkey:*owner.key, is_signer:true, is_writable: true };
        let fee_collector_meta: AccountMeta = AccountMeta{pubkey:*wormhole_fee_collector.key, is_signer:false, is_writable: true };
        let clock_meta: AccountMeta = AccountMeta{pubkey:*clock_account.key, is_signer:false, is_writable: false };
        let system_program_meta: AccountMeta = AccountMeta{pubkey:*system_program.key, is_signer:false, is_writable: false };
        let rent_meta: AccountMeta = AccountMeta{pubkey:*rent_account.key, is_signer:false, is_writable: false };

        let wormhole_bridge_fee = FeeCollector::try_from_slice(&wormhole_fee_collector.data.borrow())?;
        let fee = wormhole_bridge_fee.fee;
        if fee > 0 {
            solana_program::program::invoke(
                &solana_program::system_instruction::transfer(
                    &owner.key,
                    &wormhole_fee_collector.key,
                    fee,
                ),
                &[owner.clone(),wormhole_fee_collector.clone()],
            )?;
        }

        let mut payload: Vec<u8> = vec![0; 8];

        message.serialize(&mut &mut payload)?;

        let ix:Instruction = Instruction { 
            program_id: *wormhole_program.key,
            accounts: [
                config_meta,
                message_meta,
                emitter_meta,
                sequence_meta,
                payer_meta,
                fee_collector_meta,
                clock_meta,
                system_program_meta,
                rent_meta,
            ].to_vec(), data:   EmitterInstruction::PostMessage 
            {   batch_id: 0, 
                alive: 1,
                payload: payload, 
                finality: 0 }.try_to_vec()?
        };

        const SEED_PREFIX_SENT: &[u8; 4] = b"sent";
        const INITIAL_SEQUENCE: u64 = 1;
        const SEED_PREFIX_EMITTER: &[u8; 7] = b"emitter";


        invoke_signed(&ix, 
            &[
            owner.clone(),
            config.clone(),
            wormhole_program.clone(),
            wormhole_bridge.clone(),
            wormhole_fee_collector.clone(),
            wormhole_emitter.clone(),
            wormhole_sequence.clone(),
            wormhole_message.clone(),
            clock_account.clone(),
            rent_account.clone(),
            system_program.clone(),
            ], &[
                &[
                    SEED_PREFIX_SENT,
                    &INITIAL_SEQUENCE.to_le_bytes(),
                    &[255],
                ],
                &[
                    SEED_PREFIX_EMITTER, &[254]],
        ])?;


        Ok(())
    }

    pub fn receive_message(
        accounts: &[AccountInfo], 
        program_id: &Pubkey,
        vaa_hash:VaaHash
    ) -> ProgramResult {
        let accounts_iter: &mut std::slice::Iter<'_, AccountInfo<'_>> = &mut accounts.iter();

        let payer: &AccountInfo<'_> = next_account_info(accounts_iter)?;
        let config: &AccountInfo<'_> = next_account_info(accounts_iter)?;
        let wormhole_program: &AccountInfo<'_> = next_account_info(accounts_iter)?;
        let posted: &AccountInfo<'_> = next_account_info(accounts_iter)?;
        let foreign_emitter: &AccountInfo<'_> = next_account_info(accounts_iter)?;
        let received: &AccountInfo<'_> = next_account_info(accounts_iter)?;
        let system_program: &AccountInfo<'_> = next_account_info(accounts_iter)?;
     
        const SEED_PREFIX_RECEIVE:  &[u8; 8] = b"received";

        let message_len = posted.data.borrow().len();

        let rent: Rent = Rent::default();
        let received_rent: u64 = rent.minimum_balance(message_len);

        let (received_pubkey, received_bump) = Pubkey::find_program_address(&[b"received"], program_id);

        invoke_signed(
            &system_instruction::create_account(
                payer.key, 
                &received_pubkey, 
                received_rent, 
                message_len as u64, 
             program_id),
             &[payer.clone(),received.clone()], 
             &[&[ SEED_PREFIX_RECEIVE,&[received_bump]]])?;

        Ok(())
    }

    pub fn initialize_config_and_emitter(
        accounts: &[AccountInfo], 
        program_id: &Pubkey
    ) -> ProgramResult {
        let accounts_iter: &mut std::slice::Iter<'_, AccountInfo<'_>> = &mut accounts.iter();

        let owner: &AccountInfo<'_> = next_account_info(accounts_iter)?; 
        let config: &AccountInfo<'_> = next_account_info(accounts_iter)?; 
        let wormhole_bridge: &AccountInfo<'_> = next_account_info(accounts_iter)?; 
        let wormhole_fee_collector: &AccountInfo<'_> = next_account_info(accounts_iter)?; 
        let wormhole_emitter: &AccountInfo<'_> = next_account_info(accounts_iter)?; 
        let wormhole_sequence: &AccountInfo<'_> = next_account_info(accounts_iter)?;


        const SEED_PREFIX_EMITTER: &[u8; 7] = b"emitter";
        const SEED_PREFIX_CONFIG:  &[u8; 6] = b"config";

        let rent: Rent = Rent::default();
        let config_rent: u64 = rent.minimum_balance(141);
        let emitter_rent: u64 = rent.minimum_balance(9);
        let (config_pubkey, config_bump) = Pubkey::find_program_address(&[b"config"], program_id);
        let (emitter_pubkey, emitter_bump) = Pubkey::find_program_address(&[b"emitter"], program_id);

        invoke_signed(
            &system_instruction::create_account(
                owner.key, 
                &config_pubkey, 
                config_rent, 
                141, 
                program_id),
             &[owner.clone(),config.clone()], 
             &[&[ SEED_PREFIX_CONFIG,&[config_bump]]])?;

        invoke_signed(
            &system_instruction::create_account(
                owner.key, 
                &emitter_pubkey, 
                emitter_rent, 
                9, 
                program_id),
             &[owner.clone(),wormhole_emitter.clone()], 
             &[&[SEED_PREFIX_EMITTER ,&[emitter_bump]]])?;

        let wormhole: WormholeAddresses = WormholeAddresses{
            bridge: wormhole_bridge.key.to_bytes(),
            fee_collector: wormhole_fee_collector.key.to_bytes(),
            sequence: wormhole_sequence.key.to_bytes(),
        };

        let config_data: Config = Config{
            discriminator: 0,
            owner: owner.key.to_bytes(),
            wormhole,
            batch_id: 0,
            finality: 0
        };

        let emitter_data: WormholeEmitter = WormholeEmitter {
             discriminator: 0, bump: emitter_bump };

        config_data.serialize(&mut &mut config.data.borrow_mut()[..])?;
        emitter_data.serialize(&mut &mut wormhole_emitter.data.borrow_mut()[..])?;

        Ok(())
    }


    fn check_authority(authority: &Pubkey, config: Config) -> ProgramResult {
        let owner: Pubkey = Pubkey::new_from_array(config.owner);

        if authority != &owner {return Err(InvalidAuth.into());}

        Ok(())
    }

}
