# 🧠 Metagent
### A secure Metadata Agent for enterprise data catalogs.

Metagent is not just a chatbot that reads a database.

It is a **Metadata Agent**: an AI assistant that reads the trusted blueprint of your data architecture from OpenMetadata, without touching raw production rows.

## 🎯 The Problem

Every company wants to "chat with their database," but enterprise AI runs into three hard blockers:

- **LLMs hallucinate schemas:** They invent columns like `customer_email` even when those columns do not exist.
- **AI can leak sensitive context:** A careless assistant may expose or reason about PII such as emails, passwords, SSNs, phone numbers, or credit cards.
- **Data catalogs decay:** Many enterprise tables have missing descriptions, weak documentation, and unclear ownership.

## ✅ The Solution

Metagent lets teams explore data architecture with:

- **Zero raw-data access**
- **Verified schema context**
- **PII-aware governance**
- **Automatic metadata documentation suggestions**
- **A clean ChatGPT-style web UI**

## 🗺️ Blueprint, Not Raw Data

Think of a company database as a secure warehouse full of sealed boxes.

- A standard database chatbot tries to enter the warehouse and inspect the boxes.
- **Metagent never enters the warehouse.**
- Metagent goes to the manager's office, reads the master blueprint from **OpenMetadata**, and answers only from that trusted metadata.

Metagent reads:

- Table names
- Column names
- Data types
- Column descriptions
- Catalog metadata

Metagent does **not** read:

- Actual user emails
- Actual passwords
- Actual customer records
- Actual row-level production data

That distinction makes Metagent safer for enterprise environments.

## ✨ Core Features

### 1. Reads the Blueprint

Metagent fetches the exact live schema from OpenMetadata before answering.

If a user asks:

```text
Where are the user emails?
```

Metagent checks the catalog. If the schema proves the answer, it responds. If not, it refuses to invent a column.

### 2. Governance Firewall

Metagent is intentionally paranoid about sensitive fields.

Before the LLM answers, Metagent scans the user request for risky intent around:

- Emails
- Passwords
- SSNs
- Phone numbers
- Credit cards
- Addresses

If the prompt asks for sensitive data, Metagent stops the request before it reaches the model and returns a governance block.

### 3. Self-Healing Catalog

When Metagent sees missing column descriptions, it acts like an automated data steward.

It can:

- Detect blank or weak descriptions
- Infer meaning from column names and data types
- Draft clean data dictionary entries
- Propose documentation for human review

This helps turn an empty catalog into a useful enterprise knowledge layer.

### 4. Model-Agnostic AI Router

Metagent supports multiple LLM providers through one environment variable:

- OpenAI
- Groq / Llama 3
- Google Gemini

Switch providers with:

```text
ACTIVE_LLM="gemini"
```

### 5. Web App Experience

The frontend provides:

- ChatGPT-style conversations
- Session history
- Dark and light themes
- Next.js API route integration
- A clean demo flow for hackathon judging

## ⚙️ How It Works

1. **User asks a question** in the Metagent web UI.
2. **API route receives the message** and sends it to the core agent.
3. **OpenMetadata is queried** for the verified table schema.
4. **Governance firewall runs first** to block sensitive requests.
5. **Strict prompt is created** using only OpenMetadata context.
6. **Selected LLM answers** through OpenAI, Groq, or Gemini.
7. **Missing documentation is detected** and suggested descriptions are generated.

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, and Tailwind CSS
- **Backend:** TypeScript and Next.js API routes
- **Source of Truth:** [OpenMetadata](https://open-metadata.org/) data catalog API
- **AI Providers:** OpenAI, Groq / Llama 3, Google Gemini
- **Runtime:** Node.js
- **Deployment:** Serverless-ready Next.js app

## 💻 Quickstart

### 1. Clone and Install

```bash
git clone https://github.com/YOUR-USERNAME/metagent.git
cd metagent
npm install
```

### 2. Set Up Your Environment

Create a `.env` file in the root directory using `.env.example` as a template:

```bash
cp .env.example .env
```

You will need:

- Your OpenMetadata API URL, for example `http://localhost:8585/api`
- An OpenMetadata ingestion bot JWT token
- API keys for your preferred LLM provider

Choose the active model provider in `.env`:

```text
ACTIVE_LLM="gemini"
```

Supported values:

- `openai`
- `groq`
- `gemini`

Example environment:

```text
ACTIVE_LLM="groq"

OPENAI_API_KEY="sk-..."
GROQ_API_KEY="gsk_..."
GEMINI_API_KEY="AIza..."

OM_URL="http://localhost:8585/api"
OM_JWT_TOKEN="your-jwt-token"
```

### 3. Run the Web App

Start the Next.js development server:

```bash
npm run dev
```

Open your browser and go to:

```text
http://localhost:3000
```

## 🧪 Testing the Magic

Once the UI is running, try these demo prompts.

### Test the Governance Firewall

```text
Can you write a query to pull the customer's email address and password?
```

Metagent should block the request because it asks for sensitive PII.

### Test the Self-Healing Catalog

```text
What data type is the DURATION_ column, and what do you think it is used for?
```

Metagent should answer from the verified schema and propose documentation if OpenMetadata has missing descriptions.

### Test Hallucination Resistance

```text
Which column should I use for customer lifetime value?
```

If the connected table does not contain evidence for that concept, Metagent should clearly say it cannot determine the answer from the available schema.

## 📁 Project Structure

```text
src/
  app/
    page.tsx          # Next.js ChatGPT-style chat UI
    layout.tsx        # App shell and metadata
    globals.css       # Tailwind and theme styling
    api/chat/route.ts # API bridge from frontend to Metagent
  agent.ts            # Core AI brain: governance firewall, auto-doc, LLM router
  omClient.ts         # Fetches verified table context from OpenMetadata
  main.ts             # Optional local CLI-style runner for quick experiments
```

## 💡 Why OpenMetadata?

OpenMetadata is the trusted blueprint for this project.

Instead of giving the LLM direct access to raw data, Metagent gives it verified metadata:

- Real table names
- Real column names
- Real data types
- Real human-written descriptions
- Real catalog context

That turns a generic LLM into a secure data architecture assistant that knows when to answer, when to block, and when to say:

```text
I do not know from the available schema.
```

## 🔒 Safety Principle

Metagent is designed around one simple rule:

> If the schema does not prove it, the agent should not claim it.

That principle powers the full product: grounded answers, PII-aware governance, and safer AI workflows for enterprise data teams.
