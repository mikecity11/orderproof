import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const session=JSON.parse(readFileSync('/tmp/orderproof-studionet-qa.json','utf8'));
const clients=Object.fromEntries(['buyer','seller','outsider'].map(role=>[role,createClient({chain:studionet,account:createAccount(session[role+'Key'])})]));
const address=session.address,buyer=createAccount(session.buyerKey).address,seller=createAccount(session.sellerKey).address;
const freshReport={network:'studionet',chainId:61999,contract:address,deploymentHash:session.deployHash,startedAt:new Date().toISOString(),steps:[],scope:'SDK-to-StudioNet integration; browser wallet flow not tested'};
const resume=process.argv.includes('--resume-assessment');
const report=resume?JSON.parse(readFileSync('deployments/studionet-qa.json','utf8')):freshReport;
delete report.error;delete report.passed;
mkdirSync('deployments',{recursive:true});
const save=()=>writeFileSync('deployments/studionet-qa.json',JSON.stringify(report,null,2)+'\n');
const read=async()=>JSON.parse(await clients.buyer.readContract({address,functionName:'get_agreement',args:['1']}));
async function tx(role,method,args,expectedFailure=false){
 console.log('Submitting',role,method);
 const c=clients[role],hash=await c.writeContract({address,functionName:method,args,value:0n});
 const step={role,method,hash,expectedFailure};report.steps.push(step);save();
 const receipt=await c.waitForTransactionReceipt({hash,interval:3000,retries:100});
 const leader=receipt.consensus_data?.leader_receipt;
 const results=(Array.isArray(leader)?leader:[leader]).filter(x=>x && (x.mode==='leader'||!x.mode)).map(x=>x.result);
 step.status=receipt.statusName||receipt.status;step.consensus=receipt.result_name;step.execution=results;
 save(); console.log(JSON.stringify(step));
 if(expectedFailure)assert(results.some(x=>x?.status!=='return'),'Expected rejected execution');
 else assert(results.length&&results.every(x=>x?.status==='return'),'Expected successful execution');
 return receipt;
}
try{
 if(!resume){
 assert.equal(Number(await clients.buyer.readContract({address,functionName:'get_count',args:[]})),0,'Use a fresh contract for this test');
 await tx('buyer','create_agreement',[buyer,seller,JSON.stringify({item:'QA electronics fixture',specs:'Phone with 256GB storage; working display',price:'Test only, no payment',deadline:'2026-11-01',condition:'Used'})]);
 assert.equal((await read()).status,'Pending acceptance');
 await tx('outsider','accept_agreement',['1'],true);assert.equal((await read()).status,'Pending acceptance');
 await tx('seller','accept_agreement',['1']);assert.equal((await read()).status,'Active');
 await tx('seller','confirm_delivery',['1'],true);assert.equal((await read()).delivered,false);
 await tx('buyer','confirm_delivery',['1']);assert.equal((await read()).status,'Delivered');
 await tx('buyer','submit_evidence',['1','I claim this device has only 128GB storage. I have not provided independent inspection evidence.','']);
 await tx('buyer','open_dispute',['1']);
 await tx('buyer','assess_dispute',['1'],true);assert.equal((await read()).status,'Disputed');
 await tx('seller','submit_evidence',['1','I dispute the buyer claim and say storage is 256GB. No independent inspection or device data is available.','']);
 }
 assert.equal((await read()).status,'Disputed');
 await tx('buyer','assess_dispute',['1']);
 const assessed=await read();assert.equal(assessed.status,'Assessed');assert.equal(assessed.assessment.outcome,'INSUFFICIENT_EVIDENCE');report.assessment=assessed.assessment;save();
 await tx('seller','submit_evidence',['1','Additional note: an independent device inspection is still needed.','a'.repeat(64)]);
 const reopened=await read();assert.equal(reopened.status,'Disputed');assert.equal(reopened.assessment,null);assert.equal(reopened.assessment_history.length,1);
 report.reopened=true;report.completedAt=new Date().toISOString();report.passed=true;save();console.log('LIVE LIFECYCLE PASSED');
}catch(e){report.passed=false;report.error=e.shortMessage||e.message;save();console.error(report.error);process.exitCode=1;}finally{process.exit(process.exitCode||0)}
