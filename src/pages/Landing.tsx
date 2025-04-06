
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Eye, Shield, Cpu } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen angular-gradient overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 opacity-10 w-96 h-96 rounded-full bg-blue-500 blur-3xl floating"></div>
        <div className="absolute bottom-40 left-10 opacity-10 w-64 h-64 rounded-full bg-blue-300 blur-3xl floating" style={{ animationDelay: "-2s" }}></div>
      </div>

      <div className="container relative z-10 flex flex-col h-screen">
        <header className="pt-10 pb-8 flex justify-between items-center">
          <div className="text-2xl font-bold text-white">
            Nscan
          </div>
          <div className="hidden sm:flex space-x-4">
            <Button variant="ghost" className="text-white hover:text-blue-100" onClick={() => navigate("/auth")}>
              Log In
            </Button>
            <Button 
              className="bg-white text-blue-900 hover:bg-blue-50"
              onClick={() => navigate("/auth")}
            >
              Sign Up
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center max-w-screen-lg mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full">
            {/* Left column with text */}
            <div className="space-y-8 text-left">
              <h1 
                className={`text-5xl sm:text-6xl font-bold leading-tight text-white ${mounted ? 'blur-text' : ''}`}
              >
                Advanced Security <br /> Scanning Platform
              </h1>
              <p className="text-xl text-blue-100 max-w-md opacity-90 staggered">
                Comprehensive security scans and vulnerability assessments for modern network infrastructure.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 staggered">
                <Button 
                  className="bg-white text-blue-900 hover:bg-blue-50 text-lg h-12 px-6"
                  onClick={() => navigate("/auth")}
                >
                  Get Started <ArrowRight className="ml-2" />
                </Button>
               
              </div>
            </div>

            {/* Right column with feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FeatureCard 
                icon={Eye} 
                title="Quick Scans" 
                description="Fast reconnaissance with port scanning and basic vulnerability detection"
                delay={1}
              />
              <FeatureCard 
                icon={Cpu} 
                title="Service Detection" 
                description="Detailed analysis of running services and versions"
                delay={2}
              />
              <FeatureCard 
                icon={Lock} 
                title="Vulnerability Analysis" 
                description="Comprehensive vulnerability detection and assessment"
                delay={3}
              />
              <FeatureCard 
                icon={Shield} 
                title="Custom Scripts" 
                description="Run your own NSE scripts for specialized security assessments"
                delay={4}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description,
  delay
}: { 
  icon: any; 
  title: string; 
  description: string;
  delay: number;
}) => {
  return (
    <div 
      className="p-6 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 staggered" 
      style={{ animationDelay: `${delay * 0.1 + 0.5}s` }}
    >
      <Icon className="h-8 w-8 text-white mb-3" />
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-blue-100 opacity-90">{description}</p>
    </div>
  );
};

export default Landing;
