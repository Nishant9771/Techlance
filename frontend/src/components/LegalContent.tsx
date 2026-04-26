import React from 'react';

export const TermsContent = () => (
  <div className="space-y-6 text-sm text-slate-300">
    <div>
      <h4 className="text-white font-semibold text-base mb-2">1. Platform Purpose</h4>
      <p>TechLance is an engineering collaboration ecosystem designed to connect Users, Actors, and Suppliers for project development and execution.</p>
    </div>
    
    <div>
      <h4 className="text-white font-semibold text-base mb-2">2. User Responsibilities</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>No misuse of ideas or intellectual property.</li>
        <li>No fraudulent activities or misrepresentation.</li>
        <li>Respect agreed-upon contracts and scope of work.</li>
      </ul>
    </div>

    <div>
      <h4 className="text-white font-semibold text-base mb-2">3. Actor Responsibilities</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>Deliver agreed work within the stipulated timeline and quality.</li>
        <li>No idea theft or unauthorized use of client specifications.</li>
        <li>Maintain a high standard of professional quality.</li>
      </ul>
    </div>

    <div>
      <h4 className="text-white font-semibold text-base mb-2">4. Supplier Responsibilities</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>Provide correct and genuine products as listed.</li>
        <li>No fake listings or misrepresented business qualifications.</li>
      </ul>
    </div>

    <div>
      <h4 className="text-white font-semibold text-base mb-2">5. Payments</h4>
      <p>During this prototype phase, the platform is not responsible for facilitating or guaranteeing payments outside of explicitly managed escrows or smart contracts (where applicable).</p>
    </div>

    <div>
      <h4 className="text-white font-semibold text-base mb-2">6. Idea Protection</h4>
      <p>Non-Disclosure Agreement (NDA) acceptance is strictly required before full access is granted to Look-In projects or sensitive engineering requirements.</p>
    </div>

    <div>
      <h4 className="text-white font-semibold text-base mb-2">7. Account Suspension</h4>
      <p>Any violations of these terms, including fraud, disputes, or quality policy breaches, will lead to immediate account suspension or permanent blocking.</p>
    </div>
  </div>
);

export const PrivacyContent = () => (
  <div className="space-y-6 text-sm text-slate-300">
    <div>
      <h4 className="text-white font-semibold text-base mb-2">Data Collected</h4>
      <p>We collect essential information strictly required for platform operation, including Full Name, ID proofs, skill sets, verification documents, and payment info.</p>
    </div>

    <div>
      <h4 className="text-white font-semibold text-base mb-2">Usage</h4>
      <p>Your data is exclusively used for algorithmic matching, managing active contracts, processing communication, and calculating trust scores.</p>
    </div>

    <div>
      <h4 className="text-white font-semibold text-base mb-2">Protection</h4>
      <p>We enforce strict encrypted storage (conceptual framework limits) for all personally identifiable information and sensitive project specifications.</p>
    </div>

    <div>
      <h4 className="text-white font-semibold text-base mb-2">No Third-Party Selling</h4>
      <p>Your data is sacred. We do not and will not sell your personal, operational, or business data to third-party ad networks or brokers under any circumstance.</p>
    </div>
  </div>
);

export const HelpContent = () => (
  <div className="space-y-6 text-sm text-slate-300">
    <div>
      <h4 className="text-white font-semibold text-base mb-3">Frequently Asked Questions</h4>
      <div className="space-y-4">
        <div>
          <p className="font-medium text-blue-400">How to hire?</p>
          <p className="text-slate-400 mt-1">Post a "Look-In" describing your project, or directly browse the Actor Profile catalog matching your required skills.</p>
        </div>
        <div>
          <p className="font-medium text-blue-400">How to send an offer?</p>
          <p className="text-slate-400 mt-1">Visit a project or an Actor's profile and click the standard "Make Offer" or "Send Proposal" action button to draft terms.</p>
        </div>
        <div>
          <p className="font-medium text-blue-400">How to sell products?</p>
          <p className="text-slate-400 mt-1">Suppliers can manage their inventory from the Supplier Dashboard under "Ads" or directly interact with hardware requests.</p>
        </div>
      </div>
    </div>

    <div className="pt-4 border-t border-white/10">
      <h4 className="text-white font-semibold text-base mb-2">Contact Us</h4>
      <p>Need dedicated assistance? Reach out to our dummy support center:</p>
      <a href="mailto:support@techlance.com" className="text-blue-400 hover:text-blue-300 font-medium inline-block mt-2">support@techlance.com</a>
    </div>

    <div className="pt-4">
      <button className="w-full py-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 rounded-xl font-medium transition-colors border border-red-500/30">
        Report an Issue
      </button>
    </div>
  </div>
);
