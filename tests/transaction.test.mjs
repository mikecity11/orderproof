import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertSuccessfulTransaction as check} from '../transaction.js';
test('accepted transaction can still contain a rejected contract execution',()=>{
 assert.throws(()=>check({status:5,consensus_data:{leader_receipt:[{result:{status:'contract_error',payload:'exit_code 1'}}]}}),/rejected/);
});
test('accepted execution and finalized execution are recognized',()=>{
 const consensus_data={leader_receipt:[{result:{status:'return'}}]};
 assert.equal(check({status:5,consensus_data}),'ACCEPTED');
 assert.equal(check({status:7,consensus_data}),'FINALIZED');
});
test('pending, undetermined, and receipts missing execution evidence fail',()=>{
 for(const r of [{status:6},{status:'PENDING'},{status:5}])assert.throws(()=>check(r));
});

test('an idle validator run does not override a successful leader run',()=>{
 assert.equal(check({status:7,consensus_data:{leader_receipt:[{mode:'leader',result:{status:'return'}},{mode:'validator',result:{status:'contract_error',payload:'idle'}}]}}),'FINALIZED');
});
