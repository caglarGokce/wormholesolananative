import { Keypair, SystemProgram, LAMPORTS_PER_SOL, TransactionMessage, 
    VersionedTransaction, PublicKey, TransactionInstruction, TransactionConfirmationStrategy, 
    SYSVAR_CLOCK_PUBKEY,
    SYSVAR_RENT_PUBKEY,
    Connection} from "@solana/web3.js";
import { deserialize, serialize } from "borsh";

var BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
var bs58 = require('base-x')(BASE58);

const payer_secret_key:number[] =   []

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

    const config_2 = PublicKey.findProgramAddressSync([Buffer.from([
      99,
      111,
      110,
      102,
      105,
      103
    ])],programId);

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

  console.log(config[0].toBase58())
  console.log(wormhole_emitter[0].toBase58())

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
            {isSigner:true,isWritable:true,pubkey:payer.publicKey},//owner
            {isSigner:false,isWritable:true,pubkey:config[0]},//config
            {isSigner:false,isWritable:false,pubkey:wormholeProgramId},//wormhole_program
            {isSigner:false,isWritable:true,pubkey:wormhole_bridge[0]},//wormhole_bridge
            {isSigner:false,isWritable:true,pubkey:wormhole_fee_collector[0]},//wormhole_fee_collector
            {isSigner:false,isWritable:true,pubkey:wormhole_emitter[0]},//wormhole_emitter
            {isSigner:false,isWritable:true,pubkey:wormhole_sequence[0]},//wormhole_sequence
            {isSigner:false,isWritable:true,pubkey:wormhole_message[0]},//wormhole_message
            {isSigner:false,isWritable:false,pubkey:SYSVAR_CLOCK_PUBKEY},//clock_account
            {isSigner:false,isWritable:false,pubkey:SYSVAR_RENT_PUBKEY},//rent_account
            {isSigner:false,isWritable:false,pubkey:SystemProgram.programId},//system_program
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

const update_discriminator = async () => {

//emitter   155, 12, 170, 224, 30, 250, 204, 130
//config    34,  95, 161, 132,  226, 225,  31,  11,

const config = PublicKey.findProgramAddressSync([Buffer.from("config")],programId)
const wormhole_bridge = PublicKey.findProgramAddressSync([Buffer.from("Bridge")],wormholeProgramId)
const wormhole_fee_collector = PublicKey.findProgramAddressSync([Buffer.from("fee_collector")],wormholeProgramId)
const wormhole_emitter = PublicKey.findProgramAddressSync([Buffer.from("emitter")],programId)
const wormhole_sequence = PublicKey.findProgramAddressSync([Buffer.from("Sequence")],wormholeProgramId)

const encoded_data = Uint8Array.of(5,...[34,  95, 161, 132,  226, 225,  31,  11]);

  const ix = new TransactionInstruction({
      programId:programId,
      keys:[
          {isSigner:false,isWritable:true,pubkey:wormhole_emitter[0]},
      ],
      data:Buffer.from(encoded_data)
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

const get_account_data = async () => {

  //emitter   155, 12, 170, 224, 30, 250, 204, 130
  //config    34,  95, 161, 132,  226, 225,  31,  11,
  
  const config = PublicKey.findProgramAddressSync([Buffer.from("config")],programId) //34,  95, 161, 132, 226, 225,  31,  11
  const wormhole_emitter = PublicKey.findProgramAddressSync([Buffer.from("emitter")],programId)//  155,  12, 170, 224, 30, 250, 204, 130,  254
  

  
  const inf = await connection.getAccountInfo(wormhole_emitter[0])

  console.log(Uint8Array.from(inf!.data))
  
  }

  const close_close = async () => {

    
    const config = PublicKey.findProgramAddressSync([Buffer.from("config")],programId)
    const wormhole_emitter = PublicKey.findProgramAddressSync([Buffer.from("emitter")],programId)

    
    
      const ix = new TransactionInstruction({
          programId:programId,
          keys:[
              {isSigner:false,isWritable:true,pubkey:wormhole_emitter[0]},
              {isSigner:false,isWritable:true,pubkey:payer.publicKey},
          ],
          data:Buffer.from([6])
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