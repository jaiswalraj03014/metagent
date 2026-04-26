# 🧠 Metagent
### Hallucination-free AI for your enterprise data catalog.

Every company wants to "chat with their database," but there is a massive roadblock: **LLMs lie.** If you ask a standard AI to write a query to find a customer's email, it may confidently hallucinate column names like `customer_email`. When that code runs, it breaks downstream pipelines, ruins dashboards, and destroys trust in data tools.

Enterprise data also has two massive unsolved problems: **security** and **technical debt**. AI should not leak sensitive fields like emails, passwords, or SSNs, and data catalogs should not sit empty with missing column descriptions.

**Metagent** solves this. It is a context-aware AI agent that refuses to guess, blocks sensitive data requests, and helps heal incomplete metadata by drafting missing documentation for your catalog.

## ✨ Core Enterprise Features

1. **Hallucination-Free Answers:** Metagent connects directly to the OpenMetadata API to verify the exact, real-time database schema before answering. If the schema does not prove it, the agent will not claim it.
2. **Governance Firewall:** Metagent scans user intent for sensitive data requests. If a user asks for PII such as emails, SSNs, passwords, phone numbers, credit cards, or addresses, it returns a hard governance block instead of exposing risky information.
3. **Self-Healing Catalog:** If Metagent detects columns with missing descriptions, it acts like an automated data steward. It analyzes the column name and data type, then proposes professional data dictionary definitions.
4. **Model-Agnostic Routing:** Metagent can route requests to OpenAI, Groq, or Google Gemini using a single `ACTIVE_LLM` environment variable.
5. **ChatGPT-Style Web UI:** A Next.js interface provides session-based chat, dark/light theme support, and a clean enterprise-friendly interaction flow.

## 🚀 How It Works

1. **The Ask:** A user asks a natural language question in the Metagent web UI.
2. **The Verification:** The API route sends the question to the core agent, which fetches live table context from **OpenMetadata**.
3. **The Governance Check:** Before calling an LLM, Metagent checks whether the user is asking for sensitive fields.
4. **The Lock-In:** Metagent builds a strict prompt using only the verified OpenMetadata schema.
5. **The Answer:** The selected LLM answers using the schema. If the answer is not supported by the catalog, Metagent says so.
6. **The Documentation Boost:** When metadata descriptions are missing, Metagent includes suggested documentation that can be reviewed by a human data steward.

## 🛠️ Tech Stack

Built to be fast, beautiful, and model-agnostic:

- **Frontend:** Next.js, React, and Tailwind CSS
- **UI:** ChatGPT-style session interface with dark/light theme support
- **Backend:** TypeScript and Node.js API routes
- **Source of Truth:** [OpenMetadata](https://open-metadata.org/) data catalog API
- **AI Router:** Hot-swappable provider support for **OpenAI**, **Groq** / Llama 3, and **Google Gemini**
- **Deployment Shape:** Serverless-ready Next.js application

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

Standard AI agents fail because they lack trusted business context. OpenMetadata acts as the source of truth for this project. By using its standardized API, Metagent can pull not just database schemas, but also human-written descriptions and metadata attached to real enterprise assets.

That turns a generic LLM into a specialized, secure data engineering assistant that knows when to answer, when to block, and when to say: "I do not know from the available schema."

## 🔒 Safety Principle

Metagent is designed around one simple rule:

> If the schema does not prove it, the agent should not claim it.

That principle powers the full product: grounded answers, PII-aware governance, and safer AI workflows for enterprise data teams.
