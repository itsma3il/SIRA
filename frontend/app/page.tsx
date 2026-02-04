"use client";

import Link from "next/link";
import {
  ArrowRight,
  Brain,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserNav } from "@/components/user-nav";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description: "Advanced RAG system analyzes your profile against thousands of programs to find your perfect academic fit.",
  },
  {
    icon: Target,
    title: "Personalized Recommendations",
    description: "Get tailored program suggestions based on your grades, interests, budget, and career goals.",
  },
  {
    icon: MessageSquare,
    title: "Interactive Conversations",
    description: "Chat with SIRA to refine recommendations, ask questions, and explore different academic pathways.",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Insights",
    description: "Receive match scores, admission requirements, and tuition details for instant decision-making.",
  },
];

const howItWorks = [
  {
    step: "1",
    icon: Users,
    title: "Create Your Profile",
    description: "Fill out a comprehensive profile with your academic history, interests, and preferences.",
  },
  {
    step: "2",
    icon: Search,
    title: "AI Analysis",
    description: "Our hybrid RAG system searches through curated university programs using semantic and keyword matching.",
  },
  {
    step: "3",
    icon: Sparkles,
    title: "Get Recommendations",
    description: "Receive personalized program recommendations with match scores, requirements, and tuition information.",
  },
  {
    step: "4",
    icon: Lightbulb,
    title: "Explore & Decide",
    description: "Chat with SIRA to refine results, compare options, and make informed academic decisions.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col mx-auto items-between">
      {/* Header */}
      <header className="sticky top-4 z-50 px-4 mx-auto rounded-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60" role="banner">
        <nav className="container flex h-16 gap-8 items-center justify-between text-sm" aria-label="Main navigation">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm" />
              <div className="relative bg-linear-to-br from-primary to-primary/70 size-10 rounded-lg flex items-center justify-center">
                <GraduationCap className="size-6 text-primary-foreground" />
              </div>
            </div>
            <span className="font-bold text-lg" aria-label="SIRA - Système Intelligent de Recommandation Académique">SIRA</span>
          </div>
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#docs" className="hover:text-primary transition-colors">Docs</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          <UserNav />
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto flex flex-col items-center justify-center gap-6 py-16 md:py-24 lg:py-32" aria-label="Hero">
        <Badge variant="secondary" className="gap-2">
          <Sparkles className="h-3 w-3" />
          AI-Powered Academic Guidance
        </Badge>
        <div className="flex max-w-245 flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Find Your Perfect
            <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {" "}Academic Path
            </span>
          </h1>
          <p className="max-w-175 text-lg text-muted-foreground sm:text-xl">
            SIRA uses advanced AI to match you with graduate programs that align with your goals,
            grades, and preferences. Get personalized recommendations in minutes.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard/profiles/new">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard/chat">Try Chat Demo</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto py-16 md:py-24" aria-labelledby="features-heading">
        <div className="mx-auto flex max-w-245 flex-col items-center gap-4 text-center mb-12">
          <Badge variant="outline" aria-hidden="true">Features</Badge>
          <h2 id="features-heading" className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            Why Choose SIRA?
          </h2>
          <p className="max-w-175 text-muted-foreground">
            Powered by cutting-edge AI technology to deliver accurate, personalized academic recommendations.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto py-16 md:py-24" aria-labelledby="how-it-works-heading">
        <div className="mx-auto flex max-w-245 flex-col items-center gap-4 text-center mb-12">
          <Badge variant="outline" aria-hidden="true">Process</Badge>
          <h2 id="how-it-works-heading" className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            How It Works
          </h2>
          <p className="max-w-175 text-muted-foreground">
            From profile creation to final decision, SIRA guides you through every step of your academic journey.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-md" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/70">
                      <Icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-primary font-bold text-primary text-sm">
                      {item.step}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto py-16 md:py-24">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-primary/5 to-background" />
          <CardContent className="relative flex flex-col items-center gap-6 p-12 text-center">
            <div className="flex max-w-150 flex-col gap-4">
              <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Ready to Discover Your Future?
              </h2>
              <p className="text-muted-foreground">
                Join thousands of students who have found their ideal academic programs with SIRA&apos;s AI-powered recommendations.
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <Link href="/dashboard/profiles/new">
                Create Your Profile Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="py-2 mx-auto" role="contentinfo">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2026 SIRA - Système Intelligent de Recommandation Académique
          </p>
          <nav className="flex gap-4" aria-label="Footer navigation">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/profiles" className="text-sm text-muted-foreground hover:underline hover:text-foreground transition-colors">
              Profiles
            </Link>
            <Link href="/dashboard/chat" className="text-sm text-muted-foreground hover:underline hover:text-foreground transition-colors">
              Chat
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
