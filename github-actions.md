---
sidebar_position: 4
---

# Github Actions

## Introduction à GitHub Actions

GitHub Actions est un service d'intégration continue et de déploiement continu (CI/CD) intégré directement dans GitHub. Il vous permet d'automatiser vos workflows de construction, de test et de déploiement directement depuis votre dépôt.

### Concepts clés de GitHub Actions

- **Workflow** : Un processus automatisé configurable que vous pouvez définir dans votre dépôt.
- **Job** : Un ensemble d'étapes qui s'exécutent sur le même runner (machine virtuelle).
- **Step** : Une tâche individuelle qui peut exécuter des commandes ou des actions.
- **Action** : Une application indépendante et réutilisable qui effectue une tâche complexe fréquemment répétée.
- **Runner** : Un serveur qui exécute vos workflows lorsqu'ils sont déclenchés.
- **Event** : Une activité spécifique qui déclenche un workflow (push, pull request, etc.).

## Structure d'un workflow GitHub Actions

Les workflows sont définis dans des fichiers YAML stockés dans le répertoire `.github/workflows` de votre dépôt. Voici la structure de base d'un workflow :

```yaml
name: Nom du workflow

on: # Événements qui déclenchent le workflow
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  job-name: # Nom du job
    runs-on: ubuntu-latest # Système d'exploitation du runner

    steps:
      - name: Nom de l'étape # Description de l'étape
        uses: actions/checkout@v3 # Action à utiliser
        # ou
        run: echo "Hello World" # Commande à exécuter
```

## Création d'un workflow CI pour un projet Node.js

Commençons par créer un workflow CI de base qui s'exécute à chaque push et pull request. Créez un fichier `.github/workflows/ci.yml` :

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Run tests
        run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Archive production artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist
          retention-days: 5

  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

      # Ce workflow sera complété dans le chapitre sur le déploiement
      # avec les étapes pour déployer l'application sur Railway

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Run tests
        run: npm test
```

Ce workflow :
1. S'exécute sur les pushes vers les branches `main` et `develop` et sur les pull requests vers ces branches
2. Utilise Ubuntu comme système d'exploitation
3. Checkout le code source
4. Configure Node.js
5. Installe les dépendances
6. Lance le linter
7. Exécute les tests

## Matrices : Tester sur plusieurs versions de Node.js

Pour s'assurer que votre application fonctionne sur différentes versions de Node.js, vous pouvez utiliser une matrice de configurations :

```yaml
jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm test
```

## Ajout de la construction du projet

Ajoutons un job pour construire notre application après les tests :

```yaml
jobs:
  test:
  # ... (comme précédemment)

  build:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Archive production artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist
```

Le job `build` :
1. S'exécute uniquement si le job `test` réussit
2. Construit l'application avec `npm run build`
3. Archive les fichiers générés comme un artifact qui peut être téléchargé ou utilisé par d'autres jobs

## Validation de la convention des commits

Pour s'assurer que tous les commits respectent la convention Conventional Commits, ajoutons une vérification :

```yaml
jobs:
  lint-commits:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install commitlint
        run: |
          npm install @commitlint/cli @commitlint/config-conventional

      - name: Create commitlint config
        run: |
          echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js

      - name: Validate commits
        run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose
```

Ce job s'exécute uniquement sur les pull requests et vérifie que tous les commits ajoutés respectent la convention.

## Ajout de tests de sécurité

GitHub propose des outils intégrés pour analyser la sécurité de votre code, comme CodeQL :

```yaml
jobs:
  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
```

Vous pouvez aussi ajouter des analyses de dépendances avec des outils comme Snyk :

```yaml
- name: Run Snyk to check for vulnerabilities
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

## Utilisation de variables d'environnement et de secrets

Pour les configurations sensibles comme les clés API, utilisez les secrets GitHub :

```yaml
jobs:
  deploy:
    # ...
    steps:
      # ...
      - name: Deploy
        env:
          API_KEY: ${{ secrets.API_KEY }}
        run: |
          echo "Deploying with API key: $API_KEY"
```

Les secrets sont configurés dans les paramètres de votre dépôt GitHub (Settings > Secrets and variables > Actions).

## Notification des résultats

Vous pouvez configurer des notifications pour informer votre équipe des résultats du workflow :

```yaml
jobs:
  notify:
    needs: [test, build]
    runs-on: ubuntu-latest
    if: always()

    steps:
      - name: Slack Notification
        uses: rtCamp/action-slack-notify@v2
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
          SLACK_CHANNEL: ci-cd
          SLACK_COLOR: ${{ job.status }}
          SLACK_TITLE: CI/CD Status
          SLACK_MESSAGE: |
            Repository: ${{ github.repository }}
            Status: ${{ job.status }}
            Workflow: ${{ github.workflow }}
            Run: ${{ github.run_id }}
            Actor: ${{ github.actor }}
```

## Workflow CI/CD complet

Voici un exemple de workflow CI/CD complet pour une application Node.js :

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  validate:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    
    - name: Lint commit messages
      uses: wagoid/commitlint-github-action@v5
  
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x]
    
    steps:
    - uses: actions/checkout@v3