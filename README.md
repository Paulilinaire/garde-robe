# Garde-robe

PWA perso : j'inventorie mes vêtements en photo et l'app me propose chaque matin une tenue tendance avec ce que j'ai déjà, selon mon humeur et la météo.

- Données 100 % sur le téléphone (IndexedDB), sauvegarde par export zip.
- IA : API Anthropic, appelée directement depuis le navigateur avec ma clé (saisie dans l'app, jamais dans le code).
- Météo : Open-Meteo.

## Développement

```bash
npm install
npm run dev      # http://localhost:5173/garde-robe/
npm test
npm run build
```

## Mise en ligne (GitHub Pages)

1. Créer le dépôt `garde-robe` sur GitHub (le nom compte : l'app est servie sous `/garde-robe/`).
2. Pousser le code sur `main`.
3. Dépôt → Settings → Pages → Source : **GitHub Actions**.
4. L'action `Deploy to GitHub Pages` publie l'app sur `https://<compte>.github.io/garde-robe/`.

## Installation sur le mobile

Ouvrir l'adresse dans Chrome → menu ⋮ → **Installer l'application**.

## Clé API

Sur https://console.anthropic.com : acheter des crédits, créer une clé (API Keys), et idéalement fixer une limite de dépense mensuelle.
