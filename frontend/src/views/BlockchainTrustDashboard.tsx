import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from '@/lib/router';
import {
  createEscrow,
  getBlockchainReputation,
  listContributions,
  logContribution,
  registerIdeaProof,
  registerNdaProof,
  releaseEscrow,
  verifyIdeaProof,
  verifyNdaProof,
} from '@/lib/blockchainClient';
import { ArrowLeft, BadgeCheck, Blocks, Coins, FileCheck2, Shield, Star, Wallet } from 'lucide-react';

function truncate(value: string) {
  if (!value) return '-';
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

export default function BlockchainTrustDashboard() {
  const navigate = useNavigate();

  const [ideaText, setIdeaText] = useState('Edge AI crop disease detector with autonomous intervention recommendations.');
  const [ideaResult, setIdeaResult] = useState<any>(null);
  const [ideaVerify, setIdeaVerify] = useState<any>(null);

  const [ndaText, setNdaText] = useState('Mutual NDA for architecture, source code, and deployment materials.');
  const [ndaResult, setNdaResult] = useState<any>(null);

  const [engineerWallet, setEngineerWallet] = useState('0x000000000000000000000000000000000000dEaD');
  const [milestoneTitle, setMilestoneTitle] = useState('M1 - Prototype Delivery');
  const [amountEth, setAmountEth] = useState('0.01');
  const [milestoneId, setMilestoneId] = useState('0');
  const [escrowResult, setEscrowResult] = useState<any>(null);

  const [repWallet, setRepWallet] = useState('0x000000000000000000000000000000000000dEaD');
  const [reputation, setReputation] = useState<any>(null);

  const [projectId, setProjectId] = useState('project_hydrokit');
  const [moduleName, setModuleName] = useState('ML scoring pipeline');
  const [contributorWallet, setContributorWallet] = useState('0x000000000000000000000000000000000000dEaD');
  const [contributionLog, setContributionLog] = useState<any>(null);

  return (
    <div className="min-h-screen bg-[#070d16] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" /> Back Home
          </button>
          <h1 className="text-xl font-semibold sm:text-2xl">Blockchain Trust Dashboard</h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Shield className="h-5 w-5 text-emerald-300" /> Idea Ownership Proof</h2>
            <textarea value={ideaText} onChange={(e) => setIdeaText(e.target.value)} className="min-h-[90px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={async () => setIdeaResult(await registerIdeaProof({ ideaText, title: 'Look-In Idea' }))} className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-900">Register Proof</button>
              <button onClick={async () => setIdeaVerify(await verifyIdeaProof({ ideaText }))} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm">Verify</button>
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-300">
              {ideaResult?.ideaHash ? <p>Hash: {ideaResult.ideaHash}</p> : null}
              {ideaResult?.txHash ? <p>Tx: {ideaResult.txHash}</p> : null}
              {ideaVerify?.exists ? (
                <p className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-300"><BadgeCheck className="h-3 w-3" /> Idea Ownership Verified</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Coins className="h-5 w-5 text-cyan-300" /> Escrow Milestones</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <input value={engineerWallet} onChange={(e) => setEngineerWallet(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm sm:col-span-2" placeholder="Engineer wallet" />
              <input value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Milestone title" />
              <input value={amountEth} onChange={(e) => setAmountEth(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Amount ETH" />
              <input value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Milestone ID" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={async () => setEscrowResult(await createEscrow({ engineerWallet, title: milestoneTitle, amountEth }))} className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900">Fund Escrow</button>
              <button onClick={async () => setEscrowResult(await releaseEscrow({ milestoneId: Number(milestoneId), autoApprove: true }))} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm">Approve + Release</button>
            </div>
            {escrowResult?.txHash ? <p className="mt-3 text-xs text-slate-300">Tx: {escrowResult.txHash}</p> : null}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Star className="h-5 w-5 text-amber-300" /> On-Chain Reputation</h2>
            <div className="flex gap-2">
              <input value={repWallet} onChange={(e) => setRepWallet(e.target.value)} className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Engineer wallet" />
              <button onClick={async () => setReputation(await getBlockchainReputation({ walletAddress: repWallet }))} className="rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-900">Fetch</button>
            </div>
            {reputation ? (
              <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-sm">
                <p className="text-slate-300">Wallet: {truncate(reputation.walletAddress)}</p>
                <p className="text-slate-300">Average Rating: {reputation.averageRating || 0}</p>
                <p className="text-slate-300">Completed Projects: {reputation.completedProjects || 0}</p>
                <p className="text-slate-300">Trust Score: {reputation.trustScore || 0}</p>
                {reputation.verified ? <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300"><BadgeCheck className="h-3 w-3" /> Blockchain Verified Reputation</p> : null}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><FileCheck2 className="h-5 w-5 text-fuchsia-300" /> NDA Hash Proof + Contribution Log</h2>
            <textarea value={ndaText} onChange={(e) => setNdaText(e.target.value)} className="min-h-[70px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
            <div className="mt-2 flex gap-2">
              <button onClick={async () => setNdaResult(await registerNdaProof({ ndaText, title: 'Project NDA' }))} className="rounded-lg bg-fuchsia-300 px-3 py-2 text-sm font-semibold text-slate-900">Anchor NDA</button>
              <button onClick={async () => setNdaResult(await verifyNdaProof({ ndaText }))} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm">Verify NDA</button>
            </div>
            {ndaResult?.ndaHash ? <p className="mt-2 text-xs text-slate-300">NDA Hash: {ndaResult.ndaHash}</p> : null}

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <input value={projectId} onChange={(e) => setProjectId(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Project ID" />
              <input value={moduleName} onChange={(e) => setModuleName(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Module name" />
              <input value={contributorWallet} onChange={(e) => setContributorWallet(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm sm:col-span-2" placeholder="Contributor wallet" />
            </div>
            <div className="mt-2 flex gap-2">
              <button onClick={async () => setContributionLog(await logContribution({ projectId, moduleName, contributorWallet }))} className="rounded-lg bg-indigo-300 px-3 py-2 text-sm font-semibold text-slate-900">Log Contribution</button>
              <button onClick={async () => setContributionLog(await listContributions({ projectId }))} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm">List</button>
            </div>
            {contributionLog?.txHash ? <p className="mt-2 text-xs text-slate-300">Tx: {contributionLog.txHash}</p> : null}
            {Array.isArray(contributionLog?.rows) ? (
              <div className="mt-2 space-y-1 text-xs text-slate-300">
                {contributionLog.rows.map((row: any, idx: number) => (
                  <motion.p key={`${row.moduleName}-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Blocks className="mr-1 inline h-3 w-3" /> {row.moduleName} by {truncate(row.contributor)}
                  </motion.p>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-400">
          <p className="inline-flex items-center gap-2"><Wallet className="h-3 w-3" /> Network target: Polygon Amoy (Chain ID 80002). Use funded test wallet for demo transactions.</p>
        </div>
      </div>
    </div>
  );
}
