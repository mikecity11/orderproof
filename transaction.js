export function assertSuccessfulTransaction(receipt) {
  const status = receipt?.statusName || ({5:'ACCEPTED',7:'FINALIZED'})[receipt?.status] || receipt?.status;
  if (!['ACCEPTED', 'FINALIZED'].includes(status)) throw Error(`Transaction did not reach acceptance (${status || 'unknown'}).`);
  const raw = receipt?.consensus_data?.leader_receipt;
  const entries = (Array.isArray(raw) ? raw : [raw]).filter(Boolean);
  // Stable StudioNet includes both leader and validator runs in this field.
  const leaders = entries.filter(x => x.mode === 'leader' || !x.mode);
  if (!leaders.length || leaders.some(x => x.result?.status !== 'return')) {
    throw Error('Contract execution was rejected. Check the agreement state and evidence requirements.');
  }
  return status;
}
