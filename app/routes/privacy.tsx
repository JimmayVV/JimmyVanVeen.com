import { trackPageView } from "~/utils/analytics-loader";

import type { Route } from "./+types/privacy";

export const meta: Route.MetaFunction = () => [
  {
    title: "Privacy Policy - Jimmy Van Veen",
  },
  {
    name: "description",
    content:
      "Privacy policy for jimmyvanveen.com - Learn how we collect, use, and protect your data.",
  },
];

// Add analytics tracking to this route
export async function clientLoader() {
  // Track page view for privacy page
  trackPageView().catch((error) => {
    console.warn("Analytics tracking failed:", error);
  });

  return null;
}
clientLoader.hydrate = true;

export default function Privacy() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-white">Privacy Policy</h1>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <p className="text-lg text-gray-300 mb-6">
            <strong>Last updated:</strong> September 16, 2025
          </p>

          <p className="text-gray-300">
            This privacy policy describes how jimmyvanveen.com (&quot;we&quot;,
            &quot;our&quot;, or &quot;us&quot;) collects, uses, and protects
            information when you visit our website.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Information We Collect
          </h2>

          <h3 className="text-xl font-medium mb-2 text-gray-200">
            Analytics Data
          </h3>
          <p className="text-gray-300 mb-4">
            We collect basic analytics data for security monitoring, performance
            optimization, and understanding site usage, including:
          </p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li>Pages visited and time spent on each page</li>
            <li>General location (country/region level)</li>
            <li>Device type and browser information</li>
            <li>How you arrived at our site (referrer)</li>
            <li>Basic interaction data for functionality improvements</li>
          </ul>

          <h3 className="text-xl font-medium mb-2 mt-6 text-gray-200">
            Contact Form Data
          </h3>
          <p className="text-gray-300">
            When you use our contact form, we collect your name, email address,
            and message content solely to respond to your inquiry.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">
            How We Use Your Information
          </h2>
          <p className="text-gray-300 mb-4">
            We process this information based on our legitimate interests for:
          </p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li>
              <strong>Security monitoring:</strong> Detecting and preventing
              attacks or abuse
            </li>
            <li>
              <strong>Performance optimization:</strong> Improving site speed
              and functionality
            </li>
            <li>
              <strong>Error tracking:</strong> Identifying and fixing technical
              issues
            </li>
            <li>
              <strong>Contact responses:</strong> Responding to your inquiries
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Data Sharing
          </h2>
          <p className="text-gray-300">
            We do <strong>not</strong> sell, rent, or share your personal
            information with third parties. Analytics data is processed through
            Google Analytics 4, and contact forms are handled through our
            hosting provider (Netlify) for functionality purposes only.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Your Privacy Choices
          </h2>
          <p className="text-gray-300 mb-4">
            You can opt out of analytics tracking through several methods:
          </p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li>
              <strong>Browser settings:</strong> Enable &quot;Do Not Track&quot;
              in your browser preferences
            </li>
            <li>
              <strong>Ad blockers:</strong> Most ad blockers automatically
              prevent analytics tracking
            </li>
            <li>
              <strong>Contact us:</strong> Email us through our{" "}
              <a
                href="/#contact"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                contact form
              </a>{" "}
              to request opt-out
            </li>
          </ul>

          <p className="text-gray-300 mt-4">
            Opting out will not affect core website functionality but may limit
            our ability to detect and prevent security issues.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Data Security and Retention
          </h2>
          <p className="text-gray-300">
            We protect your data using industry-standard security practices:
          </p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li>All data transmission uses HTTPS encryption</li>
            <li>Analytics data is anonymized and aggregated</li>
            <li>
              Contact form data is processed securely and not stored long-term
            </li>
            <li>
              We retain only the minimum data necessary for the stated purposes
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Third-Party Services
          </h2>
          <p className="text-gray-300">
            This website uses the following services that may process data:
          </p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li>
              <strong>Google Analytics 4:</strong> For website analytics and
              security monitoring
            </li>
            <li>
              <strong>Netlify:</strong> For website hosting and contact form
              processing
            </li>
            <li>
              <strong>Contentful:</strong> For content management (blog posts)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Children&apos;s Privacy
          </h2>
          <p className="text-gray-300">
            This website is not directed to children under 13, and we do not
            knowingly collect personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Changes to This Policy
          </h2>
          <p className="text-gray-300">
            We may update this privacy policy occasionally. Changes will be
            posted on this page with an updated &quot;Last updated&quot; date.
            Continued use of the website after changes constitutes acceptance of
            the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">Contact</h2>
          <p className="text-gray-300">
            For questions about this privacy policy or to exercise your privacy
            rights, please contact us through our{" "}
            <a
              href="/#contact"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              contact form
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
