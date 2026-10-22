"""Deterministic contract logic tests using a minimal GenVM storage/context stub.
Not a substitute for GenVM or network testing.
"""
import sys, types, unittest, json
class TreeMap(dict):
    @classmethod
    def __class_getitem__(cls, _): return cls
class Public:
    write = staticmethod(lambda f:f)
    view = staticmethod(lambda f:f)
context=types.SimpleNamespace(sender_address='0x'+'1'*40)
gl=types.SimpleNamespace(Contract=object,public=Public(),message=context,
    eq_principle=types.SimpleNamespace(prompt_non_comparative=lambda *a,**k:json.dumps(dict(outcome='INSUFFICIENT_EVIDENCE',explanation='Unverified claims',missing_evidence=['Inspection']))))
sys.modules['genlayer']=types.SimpleNamespace(gl=gl,TreeMap=TreeMap,Address=str,u256=int)
namespace={}
exec(compile(open('contracts/orderproof.py').read(),'orderproof.py','exec'),namespace)
class ContractTests(unittest.TestCase):
    def setUp(self):
        self.b='0x'+'1'*40;self.s='0x'+'2'*40;self.x='0x'+'3'*40
        context.sender_address=self.b
        self.c=namespace['OrderProof']()
        self.id=self.c.create_agreement(self.b,self.s,json.dumps(dict(item='Phone',specs='256GB',price='100',deadline='2026-11-01')))
    def test_lifecycle(self):
        context.sender_address=self.s;self.c.accept_agreement(self.id)
        with self.assertRaises(Exception):self.c.confirm_delivery(self.id)
        context.sender_address=self.b;self.c.confirm_delivery(self.id)
        self.c.submit_evidence(self.id,'Storage differs','a'*64);self.c.open_dispute(self.id)
        context.sender_address=self.s;self.c.submit_evidence(self.id,'Seller response','');self.c.assess_dispute(self.id)
        a=json.loads(self.c.get_agreement(self.id));self.assertEqual(a['status'],'Assessed');self.assertEqual(len(a['accepted']),2)
    def test_outsider_rejected(self):
        context.sender_address=self.x
        for call in [lambda:self.c.accept_agreement(self.id),lambda:self.c.open_dispute(self.id),lambda:self.c.submit_evidence(self.id,'claim',''),lambda:self.c.assess_dispute(self.id)]:
            with self.assertRaises(Exception):call()
    def test_duplicate_acceptance(self):
        with self.assertRaises(Exception):self.c.accept_agreement(self.id)
    def test_no_assessment_before_dispute(self):
        with self.assertRaises(Exception):self.c.assess_dispute(self.id)
    def test_distinct_parties(self):
        with self.assertRaises(Exception):self.c.create_agreement(self.b,self.b,'{}')
    def test_invalid_decision_does_not_save(self):
        context.sender_address=self.s;self.c.accept_agreement(self.id);self.c.open_dispute(self.id)
        self.c.submit_evidence(self.id,'Seller response','')
        context.sender_address=self.b;self.c.submit_evidence(self.id,'Buyer claim','')
        old=gl.eq_principle.prompt_non_comparative
        gl.eq_principle.prompt_non_comparative=lambda *a,**k:'{"outcome":"PAY_BUYER"}'
        try:
            with self.assertRaises(Exception):self.c.assess_dispute(self.id)
            self.assertEqual(json.loads(self.c.get_agreement(self.id))['status'],'Disputed')
        finally:gl.eq_principle.prompt_non_comparative=old
    def disputed(self):
        context.sender_address=self.s;self.c.accept_agreement(self.id)
        context.sender_address=self.b;self.c.open_dispute(self.id)
        self.c.submit_evidence(self.id,'Buyer claim','')
    def test_one_sided_assessment_rejected(self):
        self.disputed()
        with self.assertRaisesRegex(Exception,'Both buyer and seller'):
            self.c.assess_dispute(self.id)
        self.assertEqual(json.loads(self.c.get_agreement(self.id))['status'],'Disputed')
    def test_insufficient_evidence_can_reopen_with_history(self):
        self.disputed()
        context.sender_address=self.s;self.c.submit_evidence(self.id,'Seller response','')
        self.c.assess_dispute(self.id)
        self.c.submit_evidence(self.id,'Additional inspection information','b'*64)
        a=json.loads(self.c.get_agreement(self.id))
        self.assertEqual(a['status'],'Disputed');self.assertIsNone(a['assessment'])
        self.assertEqual(a['assessment_history'][0]['outcome'],'INSUFFICIENT_EVIDENCE')
        self.assertEqual(len(a['evidence']),3)
    def test_bad_digest_rejected_without_state_change(self):
        self.disputed()
        before=self.c.get_agreement(self.id)
        with self.assertRaisesRegex(Exception,'SHA-256'):
            self.c.submit_evidence(self.id,'Another statement','abc')
        self.assertEqual(before,self.c.get_agreement(self.id))
    def test_conclusive_assessment_cannot_reopen(self):
        self.disputed()
        context.sender_address=self.s;self.c.submit_evidence(self.id,'Seller response','')
        old=gl.eq_principle.prompt_non_comparative
        gl.eq_principle.prompt_non_comparative=lambda *a,**k:json.dumps(dict(outcome='MATCHES',explanation='Test fixture',missing_evidence=[]))
        try:self.c.assess_dispute(self.id)
        finally:gl.eq_principle.prompt_non_comparative=old
        with self.assertRaisesRegex(Exception,'Evidence not allowed'):
            self.c.submit_evidence(self.id,'New claim','')
if __name__=='__main__': unittest.main()

