'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Save } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez les paramètres de votre compte et de votre entreprise.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'entreprise</CardTitle>
          <CardDescription>
            Modifiez les informations de votre entreprise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nom de l'entreprise</Label>
            <Input id="companyName" placeholder="Mon Entreprise" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siret">SIRET</Label>
            <Input id="siret" placeholder="12345678901234" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Secteur d'activité</Label>
            <Input id="sector" placeholder="BTP, Industrie, Services..." />
          </div>
          <Button>
            <Save className="mr-2 w-4 h-4" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Préférences</CardTitle>
          <CardDescription>
            Personnalisez votre expérience AirNex
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications par email</Label>
              <p className="text-sm text-muted-foreground">
                Recevez des notifications par email
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Rapport hebdomadaire</Label>
              <p className="text-sm text-muted-foreground">
                Recevez un rapport hebdomadaire par email
              </p>
            </div>
            <Switch />
          </div>
          <Button>
            <Save className="mr-2 w-4 h-4" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}



