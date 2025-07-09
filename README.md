## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/startope9/loop.git
   cd loop
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   * The app will be available at `http://localhost:5173/` by default.

---

## Folder Structure

```
├── public/
│   └── index.html
├── src/
│   ├── assets/
│   ├── components/
│   ├── redux/
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .eslintrc.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Running Tests

We use Jest with React Testing Library:

1. **Ensure testing dependencies are installed**

   ```bash
   npm install --save-dev jest ts-jest @testing-library/react @testing-library/jest-dom identity-obj-proxy
   ```

2. **Run tests**

   ```bash
   npm test
   # or
   yarn test
   ```

---

## Building for Production

```bash
npm run build
# or
yarn build
```

The production‑ready files will be in `dist/`. To preview them locally:

```bash
npm run preview
# or
yarn preview
```

## 🌐 Live Demo

Check out the deployed application here:  
👉 [https://loop-1ir3.vercel.app/](https://loop-1ir3.vercel.app/)

