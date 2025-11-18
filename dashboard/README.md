# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
 
 ## Environment
 
 - `VITE_API_BASE_URL`: Backend API base URL.
 - `VITE_EXPLORER_BASE_URL`: Default block explorer base (fallback if no chain mapping).
 - `VITE_EXPLORER_BASE_MAP`: Comma-separated `chainId=url` pairs to select explorer per network.
 
 ### Explorer mapping examples
 
 - BSC only: `56=https://bscscan.com,97=https://testnet.bscscan.com`
 - Multi-chain:
   - `1=https://etherscan.io,11155111=https://sepolia.etherscan.io,56=https://bscscan.com,97=https://testnet.bscscan.com,137=https://polygonscan.com,80002=https://amoy.polygonscan.com,42161=https://arbiscan.io,421614=https://sepolia.arbiscan.io,10=https://optimistic.etherscan.io,11155420=https://sepolia-optimism.etherscan.io,8453=https://basescan.org,84532=https://sepolia.basescan.org`
 
 Behavior:
 - Feed items with `chainId` use the mapped explorer. If unmapped, fall back to `VITE_EXPLORER_BASE_URL`.
 - The app includes defaults for common EVM chains; `.env` entries override them.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
