import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, BarChart3, FileText, Zap, Shield, TrendingDown } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">AirNex</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/demo" className="text-sm text-muted-foreground hover:text-foreground">
              Démo
            </Link>
            <Link href="/auth">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/auth?mode=signup">
              <Button>Essayer gratuitement</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Analyse Carbone Automatisée
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Mesurez, analysez et réduisez votre empreinte carbone avec l'IA.
          <br />
          Pour toutes les entreprises, tous secteurs confondus.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth?mode=signup">
            <Button size="lg" className="text-lg px-8">
              Commencer gratuitement
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Voir la démo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Tout ce dont vous avez besoin
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border bg-card">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Import automatique</h3>
            <p className="text-muted-foreground">
              Importez vos factures PDF, CSV, Excel. L'IA extrait et classe automatiquement vos données.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-card">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Calculs précis</h3>
            <p className="text-muted-foreground">
              Calculs d'émissions selon les standards GHG Protocol (Scope 1, 2, 3) avec facteurs d'émission ADEME.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-card">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <TrendingDown className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Recommandations IA</h3>
            <p className="text-muted-foreground">
              Recevez des recommandations personnalisées pour réduire vos émissions avec impact estimé.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-card">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Rapports professionnels</h3>
            <p className="text-muted-foreground">
              Générez automatiquement bilans carbone, rapports ESG et CSRD prêts à l'emploi.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-card">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sécurisé et conforme</h3>
            <p className="text-muted-foreground">
              Vos données sont sécurisées et vos rapports conformes aux réglementations européennes.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-card">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Tous secteurs</h3>
            <p className="text-muted-foreground">
              BTP, industrie, transport, logistique, services, commerce, tech... AirNex s'adapte à votre secteur.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto p-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border">
          <h2 className="text-3xl font-bold mb-4">Prêt à réduire votre empreinte carbone ?</h2>
          <p className="text-muted-foreground mb-8">
            Rejoignez les entreprises qui font confiance à AirNex pour leur analyse carbone.
          </p>
          <Link href="/auth?mode=signup">
            <Button size="lg" className="text-lg px-8">
              Démarrer maintenant
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 AirNex. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}



