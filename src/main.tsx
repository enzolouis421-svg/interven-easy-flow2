import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary";

// Version simplifiée et fonctionnelle
const root = document.getElementById("root");

if (!root) {
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: system-ui;">Erreur: élément root non trouvé dans index.html</div>';
} else {
  // Afficher un message de chargement immédiatement
  root.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: system-ui; color: white;">
      <div style="text-align: center; padding: 40px; background: rgba(255,255,255,0.1); border-radius: 16px; backdrop-filter: blur(10px);">
        <h1 style="font-size: 48px; margin-bottom: 16px;">🚀 IntervenGo</h1>
        <p style="font-size: 24px; margin-bottom: 8px;">Chargement de l'application...</p>
        <div style="margin-top: 20px;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
      </div>
    </div>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;
  
  // Rendre l'application après un court délai pour que le message s'affiche
  setTimeout(() => {
    try {
      const reactRoot = createRoot(root);
      reactRoot.render(
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      );
    } catch (error: any) {
      root.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 20px; font-family: system-ui;">
          <div style="max-width: 700px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #dc2626; font-size: 28px; margin-bottom: 16px;">⚠️ Erreur de chargement</h1>
            <p style="color: #374151; margin-bottom: 16px; font-size: 18px;"><strong>Erreur:</strong> ${error.message}</p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 4px; margin-bottom: 16px;">
              <p style="color: #991b1b; font-size: 12px; font-family: monospace; word-break: break-all; white-space: pre-wrap;">${error.stack || error.toString()}</p>
            </div>
            <button onclick="window.location.reload()" style="background: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
              🔄 Recharger la page
            </button>
          </div>
        </div>
      `;
      console.error("Erreur de rendu:", error);
    }
  }, 100);
}
