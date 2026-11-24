# 🧵 Darzzee

### Your Style. Your Fit. Your Tailor.

**Darzzee** is a modern tailoring platform designed to bring customers and tailoring services together through a seamless digital experience.

The vision behind Darzzee is to modernize traditional tailoring by making custom clothing more accessible, convenient, and technology-driven.

## ✨ About the Project

Darzzee aims to bridge the gap between traditional tailoring and modern technology, creating a digital-first experience for custom clothing and tailoring services.

Built with a focus on simplicity, usability, and modern design, Darzzee explores how technology can transform the tailoring industry.

## 🎯 Vision

To create a smarter tailoring ecosystem where customers can experience personalized clothing services with greater convenience and accessibility.

## 🛠️ Built With

- **OpenAI Codex** – AI-powered coding and development assistance.
- Modern web technologies.
- Contemporary UI/UX principles.
- Responsive design practices.

## 🤖 Developed with OpenAI Codex

Darzzee was developed with **OpenAI Codex**, OpenAI's coding agent.

Codex assisted throughout the development process, including:
- Code generation and implementation.
- Development workflows.
- Debugging and problem-solving.
- Improving code quality and development efficiency.

## 🚀 Project Goals

- Digitize traditional tailoring services.
- Improve customer convenience.
- Create a modern custom-clothing experience.
- Connect technology with the traditional fashion industry.
- Build a scalable digital tailoring ecosystem.

## 📌 Project Status

**Development:** Ongoing

Darzzee is an evolving project, with its features and capabilities being developed and refined.

## 🧑‍💻 Development

**Stack:** React 18 + Vite 5 (single-page app), Supabase (auth, database, storage), deployed on Vercel.

```bash
cp .env.example .env.local   # add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev                  # local dev server
npm run build                # production build into dist/
npm run test:e2e             # Playwright end-to-end tests
```

- Only browser-safe values (Supabase URL + anon/publishable key) belong in `VITE_*` variables. Data is protected by Row Level Security in Supabase.
- Routes: `/`, `/tailors`, `/book/:tailorId`, `/alterations`, `/join`, `/profile`, `/admin`, `/login`, `/signup`, `/forgot-password`, `/reset-password`. `vercel.json` rewrites all paths to `index.html` and sets the security headers (CSP, HSTS, X-Frame-Options, …).
- The end-to-end tests run against a production build with an in-memory fake of the Supabase API (`tests/e2e/fake-supabase.js`), so they need no credentials or network access.
- `supabase/migrations/` contains SQL for the tailor-application, newsletter and upload features. Review it and apply it to the Supabase project (SQL editor or `supabase db push`); it is not applied automatically.

## 👨‍💻 Created By

**Arnab Jyoti Hazarika**

Founder & Developer

[GitHub](https://github.com/VelopX3)

---

<p align="center">
  <b>Darzzee — Redefining the Future of Tailoring.</b>
  <br/>
  Made with ❤️ and OpenAI Codex.
</p>
