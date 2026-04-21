<div align="center">
  <img src="https://via.placeholder.com/150/6366F1/FFFFFF?text=CP" width="100" height="100" alt="CareerPilot AI Logo">
  <h1>CareerPilot AI 🚀</h1>
  <p><strong>Advanced AI-Powered Career Trajectory & Interview Simulation Engine</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?style=flat&logo=next.js)](#)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg?style=flat&logo=nodedotjs)](#)
  [![Gemini AI](https://img.shields.io/badge/Google-Gemini_AI-4285F4.svg?style=flat&logo=google)](#)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg?style=flat&logo=mongodb)](#)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg?style=flat&logo=typescript)](#)
</div>

---

## ⚡ Overview

CareerPilot AI is an enterprise-grade, highly-extensible recruitment platform designed to mentor software engineers and job seekers computationally. By harnessing the determinism of Google Gemini AI and a scalable React/Express client-server paradigm, it automates ATS parsing, conducts stateful AI interviews, and orchestrates long-term career roadmaps.

> [!NOTE]
> For a highly exhaustive architectural breakdown, logic mapping, and systemic design patterns, please refer to the deep-dive [About Project Documentation module](about_project.md).

## 🚀 Advanced Capabilities

- **[ADVANCED] ATS Resume Deconstruction**: Parses unstructured binary PDFs via Node streams, forces strict JSON schema constraints into Gemini, and maps structural gaps back to industry thresholds.
- **[ADVANCED] Stateful Iterative Interviews**: Generates isolated technical behavioral tests dynamically on React loops. Every prompt response is individually mapped, validated, and natively scored securely via backend endpoints.
- **[ADVANCED] Zero-Friction Polymorphic Monetization**: Fuses Stripe checkout sessions mathematically with an innovative *Atomic Ad-Viewing Engine*. Users seamlessly unlock features via Webhooks OR by executing 15-second virtualized SaaS ads mapping strictly to a localized MongoDB state index.
- **[ADVANCED] Immutable JWT Interception**: Custom Axios implementations instantly trap `401 Unauthorized` hits, firing invisible rotational `/refresh` requests, rearming the JWT tokens transparently to preserve frontend UX logic.

---

## 📂 Project Architecture & Folder Structure

CareerPilot leverages a decoupled monolithic setup, maximizing independence across the React frontend and Node backend.

```text
careerpilot-ai/
├── backend/                             # Express Server Architecture
│   ├── src/
│   │   ├── config/                      # Webhooks, Gemini API, DB integrations
│   │   ├── controllers/                 # Stateless request mapping
│   │   ├── middleware/                  # Auth Guards & Event Resolvers
│   │   ├── models/                      # Deep Mongoose Schema Models
│   │   ├── routes/                      # RESTful Route handlers
│   │   ├── services/                    # Heavy business logic & GenAi functions
│   │   └── server.ts                    # Application bootloader
│   └── .env                             # Backend SECRETS
└── frontend/                            # Next.js 14 App Router
    ├── app/
    │   ├── (auth)/                      # Grouped public routing scopes
    │   ├── dashboard/                   # Unified state-locked hubs
    │   ├── ads/                         # Advanced Token Monetization Component
    │   └── ...                          # Independent capability directories
    ├── components/
    │   └── ui/                          # Granular, re-usable Radix primitives
    ├── hooks/                           # Custom React event synchronizers
    ├── store/                           # Zustand persistent tree managers
    ├── types/                           # Universal global Interfaces
    └── .env.local                       # Frontend SECRETS
```

---

## 🛠️ Quick Start & Installation

### 1. Prerequisites
- **Node.js**: `v18.0.0` or greater.
- **MongoDB**: Active connection string.
- **API Keys**: Google Gemini (`AI Studio`), Stripe (optional for recurring billing workflows), Firebase (for resume blob processing).

### 2. Environment Configuration
Duplicate the environment placeholders into functional local configurations.

```bash
# Backend Setup
cd backend
cp .env.example .env
```
Populate `.env` with `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, and `STRIPE_SECRET_KEY`.

```bash
# Frontend Setup
cd ../frontend
cp .env.example .env.local
```
Expose the backend port via `NEXT_PUBLIC_API_URL`.

### 3. Execution Engine
Instanciate the decoupled environment locally via standard installation commands. Run in two discrete processes:

```bash
# Start Backend Listener on Port 5000
cd backend
npm install
npm run dev

# Mount Frontend on Port 3000
cd frontend
npm install
npm run dev
```

---

## 🛡️ Licensing & Deployment

Licensed under the MIT License. Enterprise-grade execution logic may require modification of internal MongoDB collections prior to horizontal scaling.
