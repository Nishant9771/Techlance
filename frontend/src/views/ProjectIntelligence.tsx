import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from '@/lib/router';
import {
  analyzeProjectML,
  searchSemanticML,
} from '@/lib/vertexClient';
import { fetchProjectDashboard } from '@/services/firestore';
import {
  ArrowLeft,
  Search,
  BrainCircuit,
  ShieldAlert,
  Users,
  Gauge,
  DollarSign,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

type AnalysisResult = {
  innovationScore: number;
  noveltyScore: number;
  successProbability: number;
  fraudRisk: number;
  chemistryScore: number;
  scopeRisk: number;
  trustScore: number;
  pricingEstimate?: {
    min: number;
    recommended: number;
    max: number;
    currency?: string;
  };
  recommendedActors?: Array<{
    actorId: string;
    name: string;
    score: number;
    rating?: number;
    experience?: number;
    skills?: string[];
  }>;
  recoveryActions?: string[];
  details?: {
    semantic?: {
      results?: Array<{
        id: string;
        title: string;
        description: string;
        score: number;
        category: string;
      }>;
    };
    success?: {
      delayRisk?: number;
      failureRisk?: number;
    };
  };
};

function percent(value: number) {
  return Math.round((Number(value) || 0) * 100);
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 45) return 'text-amber-300';
  return 'text-rose-400';
}

export default function ProjectIntelligence() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('AI-powered Crop Health Monitoring');
  const [ideaText, setIdeaText] = useState('Use low-cost camera nodes and edge AI to detect crop diseases early and trigger interventions.');
  const [category, setCategory] = useState('agritech');
  const [skillsInput, setSkillsInput] = useState('computer vision, edge ai, iot, firmware');
  const [budget, setBudget] = useState('18000');
  const [timeline, setTimeline] = useState('90');
  const [teamSize, setTeamSize] = useState('4');
  const [complexity, setComplexity] = useState('7');
  const [searchQuery, setSearchQuery] = useState('edge AI disease detection');
  const [projectIdLookup, setProjectIdLookup] = useState('');

  const [semanticType, setSemanticType] = useState<'projects' | 'actors'>('projects');
  const [semanticResults, setSemanticResults] = useState<Array<{ id: string; title: string; description: string; score: number; category: string }>>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');

  const skills = useMemo(
    () => skillsInput.split(',').map((item) => item.trim()).filter(Boolean),
    [skillsInput],
  );

  async function runAnalyze() {
    setLoading(true);
    setError('');

    const payload = {
      title,
      ideaTitle: title,
      ideaText,
      description: ideaText,
      category,
      skills,
      budget,
      timeline,
      teamSize: Number(teamSize),
      complexity: Number(complexity),
      searchQuery,
      fraudPayload: {
        expert: { rating: 4.95, reviewsCount: 2, accountAgeDays: 10 },
        proposal: { message: 'Can start quickly and deliver in milestones with full platform compliance.' },
        behavior: { rapidBidCount24h: 6, externalContactAttempts: 0 },
      },
    };

    const result = await analyzeProjectML(payload);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setAnalysis(result as AnalysisResult);
    setSemanticResults(result?.details?.semantic?.results || []);
    setLoading(false);
  }

  async function runSemanticSearch() {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    const result = await searchSemanticML({
      query: searchQuery,
      type: semanticType,
      topK: 6,
    });

    if (!result?.error) {
      setSemanticResults(result.results || []);
    }

    setSearchLoading(false);
  }

  async function loadFromFirestore() {
    if (!projectIdLookup.trim()) {
      return;
    }

    setLoading(true);
    setError('');

    const dashboard = await fetchProjectDashboard(projectIdLookup.trim());
    if (!dashboard?.project) {
      setError('Project not found in Firestore.');
      setLoading(false);
      return;
    }

    const project = dashboard.project as Record<string, any>;
    const ai = (dashboard.aiAnalysis || {}) as Record<string, any>;

    setTitle(String(project.title || title));
    setIdeaText(String(project.description || project.problemStatement || ideaText));
    setCategory(String(project.category || category));
    setSkillsInput(Array.isArray(project.requiredSkills) ? project.requiredSkills.join(', ') : skillsInput);
    setBudget(String(project?.budget?.max || project?.budget?.min || budget));
    setTimeline(String(project.timelineDays || timeline));
    setTeamSize(String(project.teamSize || teamSize));
    setAnalysis({
      innovationScore: Number(ai.innovationScore || project.innovationScore || 0),
      noveltyScore: Number(ai.noveltyScore || project.noveltyScore || 0),
      successProbability: Number(ai.successProbability || project.successProbability || 0),
      fraudRisk: Number(ai.fraudRisk || project.fraudRisk || 0),
      chemistryScore: Number(ai.chemistryScore || 0),
      scopeRisk: Number(ai.scopeRisk || project.scopeRisk || 0),
      trustScore: Number(ai.trustScore || project.trustScore || 0),
      pricingEstimate: ai.pricingEstimate || project.pricingEstimate,
      recommendedActors: Array.isArray(ai.recommendedActors) ? ai.recommendedActors : [],
      recoveryActions: Array.isArray(ai.recoveryActions) ? ai.recoveryActions : [],
      details: ai.details || {},
    });
    setLoading(false);
  }

  const innovation = percent(analysis?.innovationScore || 0);
  const novelty = percent(analysis?.noveltyScore || 0);
  const success = percent(analysis?.successProbability || 0);
  const fraud = percent(analysis?.fraudRisk || 0);
  const chemistry = percent(analysis?.chemistryScore || 0);
  const scope = percent(analysis?.scopeRisk || 0);
  const trust = percent(analysis?.trustScore || 0);

  const radarStyle = {
    background: `conic-gradient(
      #34d399 0 ${innovation * 0.9}deg,
      #38bdf8 ${innovation * 0.9}deg ${(innovation + novelty) * 0.9}deg,
      #f59e0b ${(innovation + novelty) * 0.9}deg ${(innovation + novelty + success) * 0.9}deg,
      #f43f5e ${(innovation + novelty + success) * 0.9}deg 360deg
    )`,
  };

  return (
    <div className="min-h-screen bg-[#060b11] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/home')}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back Home
          </button>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Project Intelligence Dashboard</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><BrainCircuit className="h-5 w-5 text-cyan-300" /> Analyze My Project</h2>
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <input
                value={projectIdLookup}
                onChange={(e) => setProjectIdLookup(e.target.value)}
                className="min-w-[220px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                placeholder="Load by Firestore project ID"
              />
              <button
                onClick={loadFromFirestore}
                disabled={loading}
                className="rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20"
              >
                Load Stored Data
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Project title" />
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Category" />
              <input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm sm:col-span-2" placeholder="Skills (comma separated)" />
              <input value={budget} onChange={(e) => setBudget(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Budget" />
              <input value={timeline} onChange={(e) => setTimeline(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Timeline days" />
              <input value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Team size" />
              <input value={complexity} onChange={(e) => setComplexity(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Complexity (1-10)" />
              <textarea value={ideaText} onChange={(e) => setIdeaText(e.target.value)} className="min-h-[90px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm sm:col-span-2" placeholder="Project idea" />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={runAnalyze}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-300 disabled:opacity-60"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Analyze My Project
              </button>
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <h2 className="mb-4 text-lg font-semibold">Project Intelligence</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <p className="text-slate-400">Success</p>
                <p className={`text-2xl font-bold ${scoreColor(success)}`}>{success}%</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <p className="text-slate-400">Fraud Risk</p>
                <p className={`text-2xl font-bold ${scoreColor(100 - fraud)}`}>{fraud}%</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <p className="text-slate-400">Chemistry</p>
                <p className={`text-2xl font-bold ${scoreColor(chemistry)}`}>{chemistry}%</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <p className="text-slate-400">Scope Risk</p>
                <p className={`text-2xl font-bold ${scoreColor(100 - scope)}`}>{scope}%</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="h-24 w-24 rounded-full p-1" style={radarStyle}>
                <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-xs text-slate-300">Radar</div>
              </div>
              <div className="text-sm text-slate-300">
                <p>Innovation: <span className="font-semibold text-cyan-300">{innovation}%</span></p>
                <p>Novelty: <span className="font-semibold text-cyan-300">{novelty}%</span></p>
                <p>Trust Score: <span className="font-semibold text-cyan-300">{trust}%</span></p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
              <p className="mb-1 text-slate-400">Dynamic Budget Estimate</p>
              <p className="flex items-center gap-2 text-base font-semibold text-emerald-300">
                <DollarSign className="h-4 w-4" />
                {analysis?.pricingEstimate?.currency || 'USD'} {analysis?.pricingEstimate?.min ?? 0} - {analysis?.pricingEstimate?.max ?? 0}
              </p>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-indigo-300" /> Actor Recommendation Panel</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(analysis?.recommendedActors || []).map((actor) => (
                <motion.div key={actor.actorId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm">
                  <p className="font-semibold text-slate-100">{actor.name}</p>
                  <p className="text-slate-400">Score: {percent(actor.score)}%</p>
                  <p className="text-slate-400">Rating: {actor.rating || '-'} | Exp: {actor.experience || '-'}y</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{(actor.skills || []).join(', ')}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><ShieldAlert className="h-5 w-5 text-amber-300" /> Recovery Suggestions</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              {(analysis?.recoveryActions || []).map((action, index) => (
                <li key={`${action}-${index}`} className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
                  {action}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm">
              <p className="text-slate-400">Delay Risk</p>
              <p className="flex items-center gap-1 text-amber-300"><Gauge className="h-4 w-4" /> {percent(analysis?.details?.success?.delayRisk || 0)}%</p>
              <p className="text-slate-400">Failure Risk</p>
              <p className="text-rose-300">{percent(analysis?.details?.success?.failureRisk || 0)}%</p>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Search className="h-5 w-5 text-emerald-300" /> Semantic Search Bar</h2>
          <div className="flex flex-wrap items-center gap-3">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search projects or experts by meaning..." className="min-w-[250px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
            <select value={semanticType} onChange={(e) => setSemanticType(e.target.value as 'projects' | 'actors')} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
              <option value="projects">Projects</option>
              <option value="actors">Actors</option>
            </select>
            <button onClick={runSemanticSearch} disabled={searchLoading} className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-300 disabled:opacity-60">
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {semanticResults.map((result) => (
              <div key={result.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm">
                <p className="font-semibold text-slate-200">{result.title}</p>
                <p className="line-clamp-2 text-xs text-slate-500">{result.description}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>{result.category}</span>
                  <span>{percent(result.score)}% match</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
