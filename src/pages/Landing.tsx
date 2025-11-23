import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Zap, Shield, Users } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: "Gestion simplifiée",
      description: "Créez et gérez vos interventions et devis en quelques clics",
    },
    {
      icon: Users,
      title: "Suivi client",
      description: "Gérez vos clients et techniciens efficacement",
    },
    {
      icon: Shield,
      title: "Sécurisé",
      description: "Vos données sont sécurisées et sauvegardées automatiquement",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/60 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-glow">
              IG
            </div>
            <span className="text-2xl font-bold text-gradient">IntervenGo</span>
          </div>
          <Button onClick={() => navigate("/auth")} variant="outline" className="gap-2">
            Connexion
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Gérez vos interventions
            <span className="block text-gradient mt-2">en toute simplicité</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            La solution complète pour gérer vos interventions techniques, vos devis, vos clients et votre équipe. 
            Professionnalisez votre activité dès aujourd'hui.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              onClick={() => navigate("/auth")} 
              size="lg" 
              className="btn-gradient text-lg px-8 py-6 shadow-glow hover:shadow-glow-lg transition-all"
            >
              Commencer
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 border-t border-border/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Pourquoi choisir IntervenGo ?
          </h2>
          <div className="space-y-4">
            {[
              "Créez et personnalisez vos devis en quelques minutes",
              "Suivez l'état de vos interventions en temps réel",
              "Gérez votre équipe de techniciens efficacement",
              "Générez des rapports PDF professionnels",
              "Accédez à vos données partout, à tout moment",
              "Assistant IA pour vous aider dans vos tâches",
            ].map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-card/30 border border-border/30 hover:border-primary/30 transition-colors"
              >
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 border-t border-border/40">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Prêt à démarrer ?
          </h2>
          <p className="text-xl text-muted-foreground">
            Rejoignez les professionnels qui ont choisi IntervenGo pour gérer leur activité
          </p>
          <Button 
            onClick={() => navigate("/auth")} 
            size="lg" 
            className="btn-gradient text-lg px-8 py-6 shadow-glow"
          >
            Créer un compte gratuitement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} IntervenGo. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
