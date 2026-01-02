import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erreur non gérée:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              ⚠️ Erreur de chargement
            </h1>
            <p className="text-gray-700 mb-4">
              Une erreur s'est produite lors du chargement de l'application.
            </p>
            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm text-red-800 font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Vérifications à faire :</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Le fichier .env existe à la racine du projet</li>
                <li>Les variables VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY sont définies</li>
                <li>Le serveur a été redémarré après la création du .env</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;




