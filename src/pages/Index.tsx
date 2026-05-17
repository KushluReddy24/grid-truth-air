import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import heroImg from "@/assets/hero-emiq.jpg";
import { Map, ShieldCheck, Users, Database, ArrowRight, Factory } from "lucide-react";

const FEATURES = [
  {
    icon: Map,
    title: "Grid-Based Emission Map",
    desc: "Interactive heatmap showing PM10 emissions per 1km grid cell across Jeedimetla.",
  },
  {
    icon: Database,
    title: "Source-Level Truth",
    desc: "Drill down into vehicle, industry, domestic, and road-dust contributions for any cell.",
  },
  {
    icon: Users,
    title: "Crowd-Sourced Surveys",
    desc: "Contributors submit field survey data; a structured engine maps it to the correct grid.",
  },
  {
    icon: ShieldCheck,
    title: "Verifier Workflow",
    desc: "Authorized reviewers approve submissions and assign confidence scores with a full audit trail.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <img
          src={heroImg}
          alt="Aerial heatmap of Jeedimetla industrial grid showing emission concentrations"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-70"
        />
        <div className="relative container py-24 md:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-background/10 backdrop-blur border border-white/20 px-3 py-1 text-xs font-medium text-white">
              <Factory className="h-3 w-3" /> EMIQ · Jeedimetla Industrial Air Quality
            </span>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-white">
              Grid-level emissions.
              <br />
              <span className="bg-gradient-to-r from-primary-glow to-accent bg-clip-text text-transparent">
                Source-level truth.
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/85 max-w-xl">
              EMIQ is an industrial emissions intelligence platform for the Jeedimetla industrial cluster that tracks and visualizes PM10, PM2.5, CO, NO₂, SO₂, and VOC emissions from industries, enabling transparent air-quality monitoring, hotspot detection, community reporting, and data-driven environmental accountability.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-elegant">
                <Link to="/dashboard">
                  Explore the Map <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-background/10 backdrop-blur border-white/30 text-white hover:bg-background/20 hover:text-white">
                <Link to="/auth?mode=signup">Sign up to contribute</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">A transparent emissions stack</h2>
          <p className="mt-3 text-muted-foreground">
            From field survey to verified grid value — every number on EMIQ has a source.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border bg-gradient-card p-6 hover:shadow-elegant transition-all hover:-translate-y-1"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="rounded-2xl bg-gradient-hero p-10 md:p-14 text-center shadow-elegant">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to see Jeedimetla’s air?</h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto">
            Open the live grid map — no account required to explore. Sign up to submit data or verify.
          </p>
          <Button asChild size="lg" className="mt-6 bg-white text-primary hover:bg-white/90">
            <Link to="/dashboard">Open Map <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        EMIQ Jeedimetla · Open emissions intelligence
      </footer>
    </div>
  );
};

export default Index;
