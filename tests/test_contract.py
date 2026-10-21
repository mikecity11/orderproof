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
        self.c.submit_evidence(self.id,'Storage differs','abc');self.c.open_dispute(self.id);self.c.assess_dispute(self.id)
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
        old=gl.eq_principle.prompt_non_comparative
        gl.eq_principle.prompt_non_comparative=lambda *a,**k:'{"outcome":"PAY_BUYER"}'
        try:
            with self.assertRaises(Exception):self.c.assess_dispute(self.id)
            self.assertEqual(json.loads(self.c.get_agreement(self.id))['status'],'Disputed')
        finally:gl.eq_principle.prompt_non_comparative=old
if __name__=='__main__': unittest.main()
