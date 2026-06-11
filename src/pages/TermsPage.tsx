import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCanonical } from "@/hooks/use-canonical";
import { DiagfloLogo } from "@/components/logo/DiagfloLogo";
import { ArrowLeft } from "lucide-react";

const TermsPage = () => {
  const [isDark, setIsDark] = useState(true);
  useCanonical("/terms");

  useEffect(() => {
    document.title = "Terms of Service | Diagflo";
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
          Terms of Service
        </h1>
        <p className={`text-sm mb-10 ${isDark ? "text-white/30" : "text-black/30"}`}>
          Last updated: February 10, 2026
        </p>

        <Section title="Acceptance of Terms">
          <p>
            By accessing or using Diagflo ("the Service"), you agree to be bound by these Terms of Service.
            If you do not agree, do not use the Service.
          </p>
        </Section>

        <Section title="Description of Service">
          <p>
            Diagflo is an Intelligent diagramming tool that converts natural language prompts into visual diagrams
            using Mermaid.js and Chart.js. The Service operates primarily as a client-side application — your
            data stays in your browser.
          </p>
        </Section>

        <Section title="User Responsibilities">
          <p>You are responsible for:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Obtaining and managing your own Gemini API key from Google AI Studio</li>
            <li>Any API usage charges incurred through your Gemini API key</li>
            <li>The content of diagrams you create and share</li>
            <li>Keeping your API key secure — do not share it publicly</li>
          </ul>
        </Section>

        <Section title="API Key Usage">
          <p>
            Diagflo does not store, transmit, or have access to your API key. It is stored in your browser's
            localStorage and sent directly to Google's servers. You are solely responsible for any costs or
            usage associated with your API key.
          </p>
        </Section>

        <Section title="Shared Content">
          <p>
            When you share a diagram, the diagram code and title are stored on our servers (Neon Postgres) and
            accessible via a public link. You retain ownership of your content. By sharing, you grant Diagflo
            a non-exclusive license to host and display the shared diagram.
          </p>
          <p>
            You must not share diagrams containing illegal, harmful, or infringing content. We reserve the right
            to remove shared content that violates these terms.
          </p>
        </Section>

        <Section title="Intellectual Property">
          <p>
            Diagflo's source code, design, and branding are protected by copyright. Diagrams you create are yours.
            Mermaid.js and Chart.js are open-source projects with their own licenses.
          </p>
        </Section>

        <Section title="Disclaimer of Warranties">
          <p>
            The Service is provided "as is" without warranties of any kind, express or implied. We do not guarantee
            that the Service will be uninterrupted, error-free, or that AI-generated diagrams will be accurate or
            suitable for any particular purpose.
          </p>
        </Section>

        <Section title="Limitation of Liability">
          <p>
            To the maximum extent permitted by law, Diagflo and its creators shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from your use of the Service, including
            but not limited to loss of data, profits, or business opportunities.
          </p>
        </Section>

        <Section title="Premium Features">
          <p>
            Future premium features may be offered under additional terms. Pricing and feature details will be
            communicated before any charges apply. The premium waitlist does not constitute a commitment or
            guarantee of future features.
          </p>
        </Section>

        <Section title="Modifications">
          <p>
            We may update these Terms at any time. Continued use of the Service after changes constitutes
            acceptance of the updated Terms. We will update the "Last updated" date at the top of this page.
          </p>
        </Section>

        <Section title="Governing Law">
          <p>
            These Terms are governed by applicable law. Any disputes shall be resolved through good-faith
            negotiation before pursuing formal proceedings.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For questions about these Terms, contact us via{" "}
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

export default TermsPage;
