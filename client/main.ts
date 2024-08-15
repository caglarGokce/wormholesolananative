import { Keypair, SystemProgram, LAMPORTS_PER_SOL, TransactionMessage, 
    VersionedTransaction, PublicKey, TransactionInstruction, TransactionConfirmationStrategy, 
    SYSVAR_CLOCK_PUBKEY,
    SYSVAR_RENT_PUBKEY,
    Connection} from "@solana/web3.js";
import { deserialize, serialize } from "borsh";

var BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
var bs58 = require('base-x')(BASE58);

const payer_secret_key =   [153, 187, 227, 210, 27, 108, 215, 173, 44, 244, 156, 74, 194, 28, 155, 122, 71, 217, 19, 208, 234, 242, 206, 140, 90, 56, 195, 207,
  73, 113, 207, 157, 220, 189, 39, 249, 130, 185, 164, 194, 196, 55, 144, 15, 84, 36, 233, 49, 66, 177, 100, 45, 220, 200,
  12, 207, 135, 110, 74, 254, 221, 39, 178, 75]

const payer = Keypair.fromSecretKey(Uint8Array.from(payer_secret_key));

const connection = new Connection("https://api.devnet.solana.com","confirmed")

//emitter   155, 12, 170, 224, 30, 250, 204, 130
//config    34,  95, 161, 132,  226, 225,  31,  11,

  class u64{
    val:bigint = BigInt(0);
  
    constructor(fields: {
        val:bigint;
  
     } | undefined = undefined)
      {if (fields) {
        this.val = fields.val; 

      }
    }
  }
  const u64Schema=new Map([
    [
        u64,
      {
        kind: "struct",
        fields: [
          ["val","u64"],
        ],
      },
    ],
  ]);

  class u16{
    val:number = 0;
  
    constructor(fields: {
        val:number;
  
     } | undefined = undefined)
      {if (fields) {
        this.val = fields.val; 

      }
    }
  }
  const u16Schema=new Map([
    [
        u16,
      {
        kind: "struct",
        fields: [
          ["val","u16"],
        ],
      },
    ],
  ]);

const programId = new PublicKey("HxDyaAUo5GLdQZMooNf18L8Xoa7kUHSviHPfRVNBxCDF")
const wormholeProgramId = new PublicKey("3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5")

const initialize_config_and_emitter = async () => {

    const config = PublicKey.findProgramAddressSync([Buffer.from("config")],programId)
    const wormhole_bridge = PublicKey.findProgramAddressSync([Buffer.from("Bridge")],wormholeProgramId)
    const wormhole_fee_collector = PublicKey.findProgramAddressSync([Buffer.from("fee_collector")],wormholeProgramId)
    const wormhole_emitter = PublicKey.findProgramAddressSync([Buffer.from("emitter")],programId)
    const wormhole_sequence = PublicKey.findProgramAddressSync([Buffer.from("Sequence")],wormholeProgramId)


    const ix = new TransactionInstruction({
        programId:programId,
        keys:[
            {isSigner:true,isWritable:true,pubkey:payer.publicKey},
            {isSigner:false,isWritable:true,pubkey:config[0]},
            {isSigner:false,isWritable:false,pubkey:wormhole_bridge[0]},
            {isSigner:false,isWritable:false,pubkey:wormhole_fee_collector[0]},
            {isSigner:false,isWritable:true,pubkey:wormhole_emitter[0]},
            {isSigner:false,isWritable:false,pubkey:wormhole_sequence[0]},
            {isSigner:false,isWritable:false,pubkey:SystemProgram.programId},
        ],
        data:Buffer.from([4])
    })


  const recentBlockhash = await connection.getLatestBlockhash();

  const message = new TransactionMessage({
    payerKey:payer.publicKey,
    recentBlockhash: recentBlockhash.blockhash,
    instructions: [ix]
  }).compileToV0Message();

  const tx = new VersionedTransaction(message);

  tx.sign([payer])

  const sig = await connection.sendTransaction(tx);

  console.log(payer.publicKey.toBase58())
  console.log(sig)

}

const initialize = async () => {

    const config = PublicKey.findProgramAddressSync([Buffer.from("config")],programId)
    const wormhole_bridge = PublicKey.findProgramAddressSync([Buffer.from("Bridge")],wormholeProgramId)
    const wormhole_fee_collector = PublicKey.findProgramAddressSync([Buffer.from("fee_collector")],wormholeProgramId)
    const wormhole_emitter = PublicKey.findProgramAddressSync([Buffer.from("emitter")],programId)
    const wormhole_sequence = PublicKey.findProgramAddressSync([Buffer.from("Sequence")],wormholeProgramId)


    const obj = new u64()
    obj.val = BigInt(1);
    const encoded = serialize(u64Schema,obj)
    const wormhole_message = PublicKey.findProgramAddressSync([Buffer.from("sent"),Buffer.from(encoded)],programId);

    console.log(wormhole_fee_collector[0].toString())

    const ix = new TransactionInstruction({
        programId:programId,
        keys:[
            {isSigner:true,isWritable:true,pubkey:payer.publicKey},
            {isSigner:false,isWritable:true,pubkey:config[0]},
            {isSigner:false,isWritable:false,pubkey:wormholeProgramId},
            {isSigner:false,isWritable:true,pubkey:wormhole_bridge[0]},
            {isSigner:false,isWritable:true,pubkey:wormhole_fee_collector[0]},
            {isSigner:false,isWritable:true,pubkey:wormhole_emitter[0]},
            {isSigner:false,isWritable:true,pubkey:wormhole_sequence[0]},
            {isSigner:false,isWritable:true,pubkey:wormhole_message[0]},
            {isSigner:false,isWritable:false,pubkey:SYSVAR_CLOCK_PUBKEY},
            {isSigner:false,isWritable:false,pubkey:SYSVAR_RENT_PUBKEY},
            {isSigner:false,isWritable:false,pubkey:SystemProgram.programId},
        ],
        data:Buffer.from([0])
    })


  const recentBlockhash = await connection.getLatestBlockhash();

  const message = new TransactionMessage({
    payerKey:payer.publicKey,
    recentBlockhash: recentBlockhash.blockhash,
    instructions: [ix]
  }).compileToV0Message();

  const tx = new VersionedTransaction(message);

  tx.sign([payer])

  const sig = await connection.sendTransaction(tx);  console.log(sig)

  
}

const register_emitter = async () => {


    const obj = new u16()
    obj.val = 1;//chain id
    const encoded = serialize(u16Schema,obj)
    const foreign_emitter = PublicKey.findProgramAddressSync([Buffer.from("foreign_emitter"),Buffer.from(encoded)],programId);
    const config = PublicKey.findProgramAddressSync([Buffer.from("config")],programId)

    const ix = new TransactionInstruction({
      programId:programId,
      keys:[
          {isSigner:true,isWritable:true,pubkey:payer.publicKey},
          {isSigner:false,isWritable:true,pubkey:config[0]},
          {isSigner:false,isWritable:false,pubkey:foreign_emitter[0]},
          {isSigner:false,isWritable:false,pubkey:SystemProgram.programId},
      ],
      data:Buffer.from([1])
    })

    const recentBlockhash = await connection.getLatestBlockhash();
    
    const message = new TransactionMessage({
      payerKey:payer.publicKey,
      recentBlockhash: recentBlockhash.blockhash,
      instructions: [ix]
    }).compileToV0Message();
    
    const tx = new VersionedTransaction(message);
    
    tx.sign([payer])
    
    const sig = await connection.sendTransaction(tx);
    
    console.log(sig)

}

const send_message = async () => {

  const config = PublicKey.findProgramAddressSync([Buffer.from("config")],programId)
  const wormhole_bridge = PublicKey.findProgramAddressSync([Buffer.from("Bridge")],programId)
  const wormhole_fee_collector = PublicKey.findProgramAddressSync([Buffer.from("fee_collector")],wormholeProgramId)
  const wormhole_emitter = PublicKey.findProgramAddressSync([Buffer.from("emitter")],wormholeProgramId)
  const wormhole_sequence = PublicKey.findProgramAddressSync([Buffer.from("Sequence")],wormholeProgramId)

  const obj = new u64()
  obj.val = BigInt(1);
  const encoded = serialize(u64Schema,obj)
  const wormhole_message = PublicKey.findProgramAddressSync([Buffer.from("sent"),Buffer.from(encoded)],programId);

  console.log("message = "+wormhole_message[1])

  const ix = new TransactionInstruction({
      programId:programId,
      keys:[
          {isSigner:true,isWritable:true,pubkey:payer.publicKey},
          {isSigner:false,isWritable:true,pubkey:config[0]},
          {isSigner:false,isWritable:false,pubkey:wormholeProgramId},
          {isSigner:false,isWritable:false,pubkey:wormhole_bridge[0]},
          {isSigner:false,isWritable:false,pubkey:wormhole_fee_collector[0]},
          {isSigner:false,isWritable:true,pubkey:wormhole_emitter[0]},
          {isSigner:false,isWritable:false,pubkey:wormhole_sequence[0]},
          {isSigner:false,isWritable:false,pubkey:wormhole_message[0]},
          {isSigner:false,isWritable:false,pubkey:SystemProgram.programId},
          {isSigner:false,isWritable:false,pubkey:SYSVAR_CLOCK_PUBKEY},
          {isSigner:false,isWritable:false,pubkey:SYSVAR_RENT_PUBKEY},
      ],
      data:Buffer.from([0])
  })

  const recentBlockhash = await connection.getLatestBlockhash();

  const message = new TransactionMessage({
    payerKey:payer.publicKey,
    recentBlockhash: recentBlockhash.blockhash,
    instructions: [ix]
  }).compileToV0Message();

  const tx = new VersionedTransaction(message);

  tx.sign([payer])

  const sig = await connection.sendTransaction(tx);

  console.log(sig)

}

initialize()

