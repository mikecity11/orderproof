import { createClient, createAccount, generatePrivateKey } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const sessionPath='/tmp/orderproof-studionet-qa.json';
const session=existsSync(sessionPath)?JSON.parse(readFileSync(sessionPath,'utf8')):{buyerKey:generatePrivateKey(),sellerKey:generatePrivateKey(),outsiderKey:generatePrivateKey(),transactions:[]};
const save=()=>writeFileSync(sessionPath,JSON.stringify(session),{mode:0o600});save();
const who=process.argv[3]||'buyer',account=createAccount(session[who+'Key']);
const client=createClient({chain:studionet,account});
const serial=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?v.toString():v);
const action=process.argv[2];
try {
if(action==='setup'){
 for(const role of ['buyer','seller','outsider']){
  const address=createAccount(session[role+'Key']).address;
  const result=await client.request({method:'sim_fundAccount',params:[address,10000000000000000000]});
  console.log(serial({role,address,funded:result}));
 }
}else if(action==='schema')console.log(serial(await client.getContractSchemaForCode(readFileSync('contracts/orderproof.py','utf8'))));
else if(action==='deploy'){
 const hash=await client.deployContract({code:readFileSync('contracts/orderproof.py','utf8'),args:[]});
 session.deployHash=hash;session.transactions.push({method:'deploy',hash});save();console.log(serial({hash}));
}else if(action==='receipt'){
 const hash=process.argv[4]||session.transactions.at(-1)?.hash;
 const tx=await client.getTransaction({hash});
 const address=tx?.data?.contract_address||tx?.contractAddress;
 if(address&&hash===session.deployHash){session.address=address;save();}
 writeFileSync('/tmp/orderproof-last-receipt.json',serial(tx)); console.log(serial({hash:tx.hash,status:tx.status,address,keys:Object.keys(tx),consensus:tx.consensus_data?.leader_receipt?.execution_result,consensusKeys:Object.keys(tx.consensus_data||{})}));
}else if(action==='read')console.log(serial(await client.readContract({address:session.address,functionName:process.argv[4]||'get_count',args:JSON.parse(process.argv[5]||'[]')})));
else if(action==='write'){
 const method=process.argv[4],args=JSON.parse(process.argv[5]||'[]');
 const hash=await client.writeContract({address:session.address,functionName:method,args,value:0n});
 session.transactions.push({method,role:who,hash});save();console.log(serial({method,hash}));
}else if(action==='addresses')console.log(serial({contract:session.address,buyer:createAccount(session.buyerKey).address,seller:createAccount(session.sellerKey).address,outsider:createAccount(session.outsiderKey).address}));
}catch(e){console.error(e.shortMessage||e.message);process.exitCode=1;}finally{process.exit(process.exitCode||0)}
