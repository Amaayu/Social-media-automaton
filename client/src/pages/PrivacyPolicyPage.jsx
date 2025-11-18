import { Link } from 'react-router-dom';

const LAST_UPDATED = 'February 3, 2025';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            Instagram Automation
          </Link>
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-8">
            Last updated: {LAST_UPDATED}
          </p>

          <div className="prose prose-blue max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                1. Overview
              </h2>
              <p className="text-gray-700 leading-relaxed">
                This Privacy Policy describes how we collect, use, store, and share information when you
                access or use the Instagram Automation platform (the "Service"). This policy is publicly
                accessible, non-geo-blocked, and crawlable as required by Meta’s Platform Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                2. Information We Collect
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We collect information you provide directly to us and data we receive through connected
                Meta platforms:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  Account data: name, email address, hashed password, organization details, subscription
                  status, support inquiries, and consent records.
                </li>
                <li>
                  Connected platform data: Instagram or YouTube OAuth tokens, account IDs, usernames,
                  granted scopes, media metadata, comments, messages, and webhook notifications delivered
                  by Meta on your behalf.
                </li>
                <li>
                  Usage data: feature usage logs, automation settings, API call metadata, device/browser
                  information, IP address, and cookies or similar technologies.
                </li>
                <li>
                  Content data: AI-generated replies, media assets you upload, dual-publishing jobs, and
                  any additional materials you store within the Service.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                3. Legal Basis & Consent
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We rely on your explicit consent and our legitimate interest in providing the Service as the
                primary legal bases for processing personal data. You must authorize each connected social
                profile through the official OAuth flow and consent to any profile building or augmentation.
                You may revoke consent at any time through the Service or the connected platform’s settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                4. How We Use Your Information
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We process collected data to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Authenticate you and operate your workspace dashboards.</li>
                <li>Automate Instagram comment replies, messaging, and dual-publishing workflows you initiate.</li>
                <li>Respond to webhook events, generate activity logs, and provide analytics you request.</li>
                <li>Deliver product updates, security alerts, and customer support communications.</li>
                <li>Maintain platform security, prevent abuse, and comply with legal or platform obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                5. Information Sharing & Disclosure
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We do not sell personal data. We share information only when necessary:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>With Meta, Google, or other APIs you connect to complete requested actions.</li>
                <li>With service providers (hosting, analytics, security, email) bound by confidentiality.
                </li>
                <li>To comply with legal requests, enforce policies, or respond to safety issues.</li>
                <li>With your explicit direction (for example, exporting automation logs or transferring accounts).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                6. Data Retention & Deletion
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We retain data only while your account is active or as needed to fulfill the purposes described
                above. Access tokens, webhook payloads, logs, and generated content follow retention schedules
                documented in your workspace settings. You may request deletion of your account and associated
                data through support or the in-app controls; we honor verified requests promptly and notify Meta
                when required.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                7. Your Data Rights
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Depending on your jurisdiction, you may have rights to access, correct, delete, restrict, or
                object to processing of your personal data, and to withdraw consent or port your data. Submit
                requests through the dashboard or by email. If we operate as a Tech Provider, we will promptly
                forward any data subject requests received from Meta to the applicable client.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                8. Cookies & Tracking Technologies
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies and similar technologies for authentication, session management, analytics,
                and product improvements. You may adjust your browser settings to restrict cookies; however,
                some functionality may become unavailable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                9. Security
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We apply technical and organizational safeguards, including encryption of credentials, scoped
                access controls, network monitoring, and regular security audits. We notify affected users and
                Meta as soon as practicable if we learn of a security incident that impacts personal data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                10. Webhooks & Automated Processing
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We subscribe to Meta webhook fields (including comments, messages, mentions, story_insights)
                to deliver real-time automation features you enable. Payloads are authenticated via Meta
                signatures, processed securely, logged for audit purposes, and deleted according to retention
                policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                11. International Transfers
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. Where
                required, we implement safeguards such as standard contractual clauses or rely on adequacy
                decisions to protect personal data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                12. Changes to This Policy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy to reflect changes in our practices, services, or legal
                obligations. We will post updates here, revise the "Last updated" date, and notify you through
                the Service or by email when material changes occur. Continued use of the Service after
                changes take effect constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                13. Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about this Privacy Policy, data processing, or wish to exercise your
                rights, contact us through your account dashboard or via email at privacy@autoflow.app.
              </p>
            </section>
          </div>

          {/* Footer Links */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4 justify-center">
            <Link
              to="/terms"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Terms of Service
            </Link>
            <span className="text-gray-400">•</span>
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign In
            </Link>
            <span className="text-gray-400">•</span>
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
