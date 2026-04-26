# 🧠 Metagent
### Hallucination-free AI for your enterprise data catalog.

Every company wants to "chat with their database," but there is a massive roadblock: **LLMs lie.** If you ask a standard AI to write a query to find a customer's email, it may confidently hallucinate column names like `customer_email` or `user_contact`. When that code runs, it breaks downstream pipelines, ruins dashboards, and destroys trust in data tools.

**Metagent** solves this. It is a context-aware AI agent that refuses to guess. By integrating directly with OpenMetadata, Metagent verifies the exact, real-time database schema before it ever answers a question.

## 🚀 How It Works

Metagent bridges the gap between raw LLM intelligence and strictly governed enterprise data.

1. **The Ask:** A user asks a natural language question about a dataset.
2. **The Verification:** Instead of guessing, Metagent connects to the **OpenMetadata API** and pulls the live, verified context for that specific table, including column names, exact data types, and business descriptions.
3. **The Lock-In:** It builds a strict system prompt that locks the AI into using *only* the verified OpenMetadata schema.
4. **The Answer:** The AI returns a hallucination-resistant answer. If the data does not exist in the schema, the AI is instructed to say that clearly instead of inventing columns.

## 🛠️ Tech Stack

Built to be fast, serverless-friendly, and model-agnostic:

- **Core:** TypeScript and Node.js
- **Source of Truth:** [OpenMetadata](https://open-metadata.org/) data catalog API
- **AI Router:** Hot-swappable LLM routing for **OpenAI**, **Groq** / Llama 3, and **Google Gemini**
- **Local Runtime:** `tsx` for running TypeScript directly during development

## 💻 Quickstart

### 1. Clone and Install

```bash
git clone https://github.com/YOUR-USERNAME/metagent.git
cd metagent
npm install
```

### 2. Set Up Your Environment

Create a `.env` file in the root directory. You can copy `.env.example` as a starting point:

```bash
cp .env.example .env
```

You will need:

- Your OpenMetadata API URL, for example `http://localhost:8585/api`
- An OpenMetadata ingestion bot JWT token
- At least one API key for your preferred LLM provider

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

### 3. Run the Agent

```bash
npx tsx src/main.ts
```

By default, `src/main.ts` sends a sample question to Metagent for a configured OpenMetadata table. You can edit the `targetTable` and `question` values to test your own catalog metadata.

## 📁 Project Structure

```text
src/
  agent.ts      # Builds the strict prompt and routes requests to the active LLM
  main.ts       # Local CLI-style entry point for trying Metagent
  omClient.ts   # Fetches verified table context from OpenMetadata
```

## 💡 Why OpenMetadata?

Standard AI agents fail because they lack trusted business context. OpenMetadata acts as the source of truth for this project. By using its standardized API, Metagent can pull not just database schemas, but also human-written column descriptions and metadata attached to real enterprise assets.

That turns a generic LLM into a specialized data engineering assistant that knows when to answer and, just as importantly, when to say: "I do not know from the available schema."

## 🧪 Example Use Case

User question:

```text
Which column should I use to find the customer's email address, and what data type is it?
```

Metagent flow:

1. Fetch the table from OpenMetadata by fully qualified name.
2. Extract the actual column names, data types, and descriptions.
3. Ask the selected LLM to answer using only that verified context.
4. Return an answer grounded in the catalog instead of a guessed schema.

## 🔒 Safety Principle

Metagent is designed around one simple rule:

> If the schema does not prove it, the agent should not claim it.

This keeps data workflows trustworthy, especially when AI-generated answers are used to support analytics, dashboards, automation, or engineering decisions.
