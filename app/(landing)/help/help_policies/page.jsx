"use client";

import React from "react";
import HelpLayout from "../../../../components/help/helplayout";

export default function PoliciesLegalPage() {
  return (
    <HelpLayout>
      <div className="space-y-10 pb-[116px]">
        {/* Title */}
        <h1 className="text-[31px] font-[700] mb-[20px] flex items-center gap-2">
          <img src="/assets/icons/policies.png" alt="Icon" className="w-[32px] h-[32px]" />
           Policies & Legal</h1>

        {/* Section: Privacy Policy Overview */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Privacy Policy Overview</h2>
          <p className="mb-4">
            Expair respects your privacy and only collects necessary data to improve platform functionality. You can read our full Privacy Policy at the bottom of every page.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Where can I find the Privacy Policy?<br />
              <strong>A:</strong> At the bottom of the homepage or under Help Center &gt; Legal.
            </li>
            <li>
              <strong>Q:</strong> Does Expair share my data?<br />
              <strong>A:</strong> No, we never sell or share your personal info.
            </li>
          </ul>
        </div>

        {/* Section: Terms of Service */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Terms of Service</h2>
          <p className="mb-4">
            By using Expair, you agree to abide by our Terms of Service. These include community conduct, platform usage, and dispute resolution terms.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> What am I agreeing to when signing up?<br />
              <strong>A:</strong> The terms are outlined in our Terms of Service page.
            </li>
            <li>
              <strong>Q:</strong> Can I access them again later?<br />
              <strong>A:</strong> Yes, they’re always in the Help Center.
            </li>
          </ul>
        </div>

        {/* Section: Security Measures */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Security Measures</h2>
          <p className="mb-4">
            We use encryption, authentication layers, and continuous monitoring to keep your data safe. 2FA is available and encouraged for all users.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Is my data safe on Expair?<br />
              <strong>A:</strong> Yes, we use industry-standard security measures.
            </li>
            <li>
              <strong>Q:</strong> How do I enable 2FA?<br />
              <strong>A:</strong> Under Security Settings in your profile.
            </li>
          </ul>
        </div>

        {/* Section: Community Guidelines */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Community Guidelines</h2>
          <p className="mb-4">
            All users are expected to respect others and follow our skill exchange code of conduct. Violations may lead to account restrictions or bans.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> What behavior is not allowed?<br />
              <strong>A:</strong> Harassment, spamming, or fraud of any kind.
            </li>
            <li>
              <strong>Q:</strong> Where can I read the full guidelines?<br />
              <strong>A:</strong> Visit the Community Guidelines under Legal &amp; Policies.
            </li>
          </ul>
        </div>

        {/* Section: Copyright and Intellectual Property */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Copyright and Intellectual Property</h2>
          <p className="mb-4">
            You retain rights to any work or intellectual property shared on Expair. Users who violate IP laws may be subject to removal or legal action.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Who owns my uploaded content?<br />
              <strong>A:</strong> You do. Expair does not claim ownership.
            </li>
            <li>
              <strong>Q:</strong> What if someone copies my work?<br />
              <strong>A:</strong> Report it immediately. We investigate all IP claims.
            </li>
          </ul>
        </div>
      </div>
    </HelpLayout>
  );
}
