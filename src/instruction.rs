use crate::{error::RNGProgramError::InvalidInstruction, state::{ ForeignEmitter, VaaHash, WormholeMessage}};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::program_error::ProgramError;

#[derive(Debug, PartialEq)]
pub enum WormholeProgramInstruction {
  Initialize,
  RegisterEmitter{foreign_emitter:ForeignEmitter},
  SendMessage{message:WormholeMessage},
  ReceiveMessage{vaa_hash:VaaHash},
  InitConfigAndEmitter
}

impl WormholeProgramInstruction {
  pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {

    let (tag, rest) = input.split_first().ok_or(InvalidInstruction)?;
    Ok(match tag {
      0 => Self::Initialize,
      1 => Self::RegisterEmitter{
        foreign_emitter:ForeignEmitter::try_from_slice(&rest)?
      },
      2 => Self::SendMessage{
        message:WormholeMessage::try_from_slice(&rest)?
      },
      38 => Self::ReceiveMessage{
        vaa_hash:VaaHash::try_from_slice(&rest)?

      },
      4 => Self::InitConfigAndEmitter,

      _ => return Err(InvalidInstruction.into()),
    })
  }
}

#[derive(BorshDeserialize, BorshSerialize)]
pub enum EmitterInstruction {
  Initialize, // placeholder
  PostMessage {
      batch_id: u32,
      alive:u8,
      payload: Vec<u8>,
      finality: u8,
  },
  PostVAA {
      version: u8,
      guardian_set_index: u32,
      timestamp: u32,
      nonce: u32,
      emitter_chain: u16,
      emitter_address: [u8; 32],
      sequence: u64,
      consistency_level: u8,
      payload: Vec<u8>,
  },
  SetFees,            // placeholder (governance action)
  TransferFees,       // placeholder (governance action)
  UpgradeContract,    // placeholder (governance action)
  UpgradeGuardianSet, // placeholder (governance action)
  VerifySignatures {
      signers: [i8; 19],
  },
  PostMessageUnreliable, // placeholder (unused)
}
