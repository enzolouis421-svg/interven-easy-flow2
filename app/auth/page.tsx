'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Zap, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function AuthPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') || 'signin'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    companyName: '',
  })

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard')
      }
    })
  }, [router, supabase])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) throw error

      if (data.user) {
        toast.success('Connexion réussie !')
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion')
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Créer l'utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Créer l'entreprise et l'utilisateur dans Prisma
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: authData.user.id,
            email: formData.email,
            name: formData.name,
            companyName: formData.companyName,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Erreur lors de la création du compte')
        }

        toast.success('Compte créé avec succès !')
        router.push('/dashboard/onboarding')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription')
      toast.error('Erreur d\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">AirNex</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
            </CardTitle>
            <CardDescription>
              {mode === 'signin'
                ? 'Connectez-vous à votre compte AirNex'
                : 'Commencez votre analyse carbone dès aujourd\'hui'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => router.push(`/auth?mode=${v}`)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email-signin">Email</Label>
                    <Input
                      id="email-signin"
                      type="email"
                      placeholder="vous@exemple.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signin">Mot de passe</Label>
                    <Input
                      id="password-signin"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jean Dupont"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nom de l'entreprise</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Mon Entreprise"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="vous@exemple.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Mot de passe</Label>
                    <Input
                      id="password-signup"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Création...' : 'Créer mon compte'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Retour à l'accueil
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}











