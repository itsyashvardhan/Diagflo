import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCanonical } from "@/hooks/use-canonical";
import { DiagfloLogo } from "@/components/logo/DiagfloLogo";
import { ArrowLeft } from "lucide-react";

const PrivacyPage = () => {
  const [isDark, setIsDark] = useState(true);
  useCanonical("/privacy");

  useEffect(() => {
    document.title = "Privacy Policy | Diagflo";
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-10">
      <h2 className={`text-xl font-semibold tracking-tight mb-3 ${isDark ? "text-white" : "text-black"}`}>{title}</h2>
      <div className={`space-y-3 text-[15px] leading-relaxed ${isDark ? "text-white/60" : "text-black/60"}`}>{children}</div>
    </section>
  );

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${isDark ? "bg-[#0a0a0a] text-[#F5F5F7]" : "bg-[#fafafa] text-[#111111]"}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b ${isDark ? "bg-black/60 border-white/10" : "bg-white/60 border-black/5"}`}>
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <DiagfloLogo className="w-7 h-7" />
            <span className="font-semibold text-[15px] bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Diagflo
            </span>
          </Link>
          <Link
            to="/"
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className={`text-4xl font-semibold tracking-tight mb-2 ${isDark ? "text-white" : "text-black"}`}>
          Privacy Policy
        </h1>
        <p className={`text-sm mb-10 ${isDark ? "text-white/30" : "text-black/30"}`}>
          Last updated: February 10, 2026
        </p>

        <Section title="Overview">
          <p>
            Diagflo ("we", "our", "the app") is a client-side web application for Intelligent diagram generation.
            We are committed to protecting your privacy. This policy explains what data we collect, how we use it,
            and your rights.
          </p>
        </Section>

        <Section title="Data We Collect">
          <p><strong>API Keys.</strong> Your Gemini API key is stored exclusively in your browser's localStorage. It is never transmitted to Diagflo's servers — requests go directly from your browser to Google's Gemini API.</p>
          <p><strong>Shared Diagrams.</strong> When you choose to share a diagram, the diagram code and title are stored in our Postgres db. No personal data, API keys, or chat history is included in shared diagrams.</p>
          <p><strong>Waitlist Emails.</strong> If you join our premium waitlist, your email address is stored in our Postgres instance. We use it solely to notify you about premium feature availability.</p>
          <p><strong>Analytics.</strong> We use Vercel Analytics, which collects anonymous, aggregated page-view data. No cookies are set, and no personal information is tracked.</p>
        </Section>

        <Section title="Data We Do NOT Collect">
          <p>We do not collect, store, or have access to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Your Gemini API key</li>
            <li>Your chat history or prompts</li>
            <li>Your diagram history (stored locally in your browser)</li>
            <li>Personal identification information (unless you join the waitlist)</li>
            <li>Cookies or tracking pixels</li>
          </ul>
        </Section>

        <Section title="Third-Party Services">
          <p>Diagflo integrates with the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Google Gemini API</strong> — Diagram generation. Governed by <a href="https://ai.google.dev/terms" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">Google's Terms of Service</a>.</li>
            <li><strong>Neon</strong> — Postgres database for shared diagram storage and waitlist.</li>
            <li><strong>Vercel</strong> — Hosting and anonymous analytics.</li>
          </ul>
        </Section>

        <Section title="Data Retention">
          <p>Shared diagrams are retained indefinitely unless you request deletion. Waitlist emails are retained until premium launch or upon request.</p>
        </Section>

        <Section title="Your Rights">
          <p>You may request deletion of your shared diagrams or waitlist email at any time by contacting us. Since most data is stored locally in your browser, you can clear it at any time by clearing your browser's localStorage for this site.</p>
        </Section>

        <Section title="Security">
          <p>
            Our deployment includes security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection,
            Content-Security-Policy, Referrer-Policy). All traffic is served over HTTPS. API keys never leave your browser.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>We may update this policy from time to time. Changes will be reflected on this page with an updated "Last updated" date.</p>
        </Section>

        <Section title="Contact">
          <p>
            For privacy questions, contact us via{" "}
            <a href="https://linkedin.com/in/yashvardhan04" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
              LinkedIn
            </a>{" "}
            or open an issue on our{" "}
            <a href="https://github.com/itsyashvardhan/diagflo" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
              GitHub
            </a>.
          </p>
        </Section>
      </main>

      <style>{`
        .font-sans {
          font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `}</style>
    </div>
  );
};

export default PrivacyPage;
