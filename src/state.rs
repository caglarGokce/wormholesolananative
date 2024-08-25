use borsh::{BorshDeserialize, BorshSerialize};


#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Config {
    //pub discriminator:u64,
    pub owner: [u8;32],
    pub wormhole: WormholeAddresses,
    pub batch_id: u32,
    pub finality: u8,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct WormholeAddresses {
    pub bridge: [u8;32],
    pub fee_collector: [u8;32],
    pub sequence: [u8;32],
}

#[derive(BorshSerialize, BorshDeserialize, Clone, PartialEq, Eq)]
pub struct BridgeData {
    pub guardian_set_index: u32,
    pub last_lamports: u64,
    pub config: BridgeConfig,
}



#[derive(Debug, Default, BorshSerialize, BorshDeserialize, Clone, PartialEq, Eq)]
pub struct BridgeConfig {
    pub guardian_set_expiration_time: u32,
    pub fee: u64,
}

#[derive(BorshSerialize, BorshDeserialize)]
pub struct WormholeEmitter {
    //pub discriminator: u64,
    pub bump: u8,
}


#[derive(Debug, Default, BorshSerialize, BorshDeserialize, Clone, PartialEq, Eq)]
pub struct FeeCollector {
    pub fee:u64
}



#[derive(Debug, Default, BorshSerialize, BorshDeserialize, Clone, PartialEq, Eq)]
pub struct SequenceTracker {
    pub sequence: u64,
}

#[derive(Debug, Default, BorshSerialize, BorshDeserialize, Clone, PartialEq, Eq)]
pub struct Bumps {
    pub message: u8,
    pub emitter: u8,
}

#[derive(Debug, Default, BorshSerialize, BorshDeserialize, Clone, PartialEq, Eq)]
pub struct ForeignEmitter {
    pub discriminator:u64,
    pub chain: u16,
    pub address: [u8; 32],
}


#[derive(Debug, Default, BorshSerialize, BorshDeserialize, Clone, PartialEq, Eq)]
pub struct WormholeMessage {
    pub discriminator:u64,
}

pub struct Received {
    pub discriminator: u64,
    pub batch_id: u32,
    pub wormhole_message_hash: [u8; 32],
    pub message_length:u32,
    pub message:u64,
}

#[derive(Debug, Default, BorshSerialize, BorshDeserialize, Clone, PartialEq, Eq)]
pub struct ReceivedRaw {
    pub message:Vec<u8>,
}

#[derive(Debug, Default, BorshSerialize, BorshDeserialize, Clone, PartialEq, Eq)]
pub struct VaaHash {
    discriminator: [u8;7],
    vaa_hash: [u8; 32]
}

