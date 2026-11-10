# FRIDAY AI — Your Personal AI Assistant

### *Inspired by the vision of Tony Stark.*

---

## 👋 About Me

Hi, I'm **Syed Akasha Hashmi**, a first-year Computer Science and Engineering (CSE) student at Satavahana University, passionate about Artificial Intelligence, software development, and building technology that solves real-world problems.

I believe in learning by building. I enjoy exploring new technologies, experimenting with AI-powered applications, participating in hackathons, and turning ideas into working projects.

FRIDAY AI is one of my projects through which I'm exploring AI integration, frontend development, backend services, and voice-enabled interaction.

**My goal is to keep learning, keep building, and turn ambitious ideas into practical technology.**

## 🚀 About FRIDAY AI

**What if we had an AI assistant like Tony Stark's FRIDAY from the Marvel universe?**

That question inspired me to build FRIDAY AI — a personal AI assistant designed to bring conversational intelligence, voice interaction, and a futuristic interface into one application.

FRIDAY AI currently runs as a web application. My long-term vision is to evolve it into a Windows desktop assistant that can understand context, interact with the user's screen with permission, and help perform digital tasks more efficiently.

This project is a work in progress, and its capabilities will continue to expand as development advances.

## ✨ Features

- **AI-powered conversations** — Interact with the assistant using natural language.
- **Voice interaction** — Speech input and AI-generated voice responses, where configured.
- **Futuristic interface** — A dark, space-inspired design featuring a cyan orb, violet orbital ring, and animated visual effects.
- **Backend integration** — Connects the interface to configured backend services for AI functionality.
- **Interactive chat** — Send messages and view conversations through the web interface.
- **Extensible design** — A foundation for adding new assistant tools and capabilities.

*Feature availability depends on the current implementation, backend configuration, and service availability.*

## 🛠️ Technology Stack

The project uses the following technologies and services:

- **Frontend:** React, TypeScript, Vite
- **UI and Styling:** CSS and modern UI components
- **Backend Services:** Supabase Edge Functions
- **AI Integration:** Gnani AI services
- **Voice Capabilities:** Speech-to-Text (STT) and Text-to-Speech (TTS)
- **Development and Version Control:** Lovable, GitHub, Visual Studio Code

The exact implementation may evolve as the project develops.

## ⚙️ How FRIDAY AI Works

1. **User interaction:** The user sends a message or uses a supported voice feature.
2. **Request processing:** The frontend communicates with the configured backend.
3. **AI processing:** The backend connects to the relevant AI service.
4. **Response delivery:** The response returns to the interface.
5. **Voice output:** Where supported, the response can be delivered through text-to-speech.

Private provider credentials should remain on the server side rather than being exposed in frontend code.

## 🚀 Getting Started

### Prerequisites

Before running the project, make sure you have:

- [Node.js](https://nodejs.org/) and npm installed
- [Git](https://git-scm.com/) installed
- A Supabase project configured for the application
- The required environment variables and backend services

### 1. Clone the Repository

```bash
git clone https://github.com/Akashahashmi/friday-ai-model-a36c88dd.git
```

### 2. Open the Project

```bash
cd friday-ai-model-a36c88dd
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Check the project's `.env.example` file, if available, for the required variable names.

Create a local `.env` file and configure the necessary values. Set up private provider credentials in the appropriate backend secrets.

**Never commit your real `.env` file or private API keys to GitHub.**

### 5. Start the Development Server

```bash
npm run dev
```

Open the local development URL displayed in your terminal.

*Additional Supabase configuration or deployment steps may be required depending on the current project setup.*

## 🔐 Security

Security is an important part of building a reliable AI assistant.

- Never publish private API keys, access tokens, passwords, or secret environment files.
- Store private AI provider credentials in secure server-side environment variables or Supabase secrets.
- Use Supabase Row Level Security (RLS) policies to protect database access.
- Authenticate and authorize requests to backend functions where required.
- Apply rate limits and appropriate usage controls to public endpoints.
- Review repository history before publishing because removing a secret from the latest version does not erase it from earlier Git commits.

Publishable client keys are intended for frontend use, but they do not replace proper backend authorization or database security.

## 🗺️ Roadmap

FRIDAY AI is an evolving project. The following are development goals, not promises that every feature is already available.

- [x] Develop the initial web interface
- [x] Establish backend service integration
- [x] Build the core chat experience
- [x] Develop voice interaction capabilities
- [ ] Improve reliability and error handling
- [ ] Expand assistant tools and supported actions
- [ ] Improve conversation context and personalization
- [ ] Develop a dedicated Windows desktop application
- [ ] Explore screen-aware assistance with user permission
- [ ] Explore safe, user-approved desktop automation

## 🎯 My Vision

I want FRIDAY AI to become more than a chatbot.

My vision is to build a personal assistant that combines conversational AI, voice interaction, contextual understanding, and useful digital actions in one place.

The long-term goal is to make everyday computer tasks easier through an assistant that can respond naturally, understand what the user needs, and help complete supported tasks safely.

The current web application is the starting point. I'm continuing to learn, experiment, and improve FRIDAY AI one step at a time.

## 📌 Project Status

**Status:** Actively developing

FRIDAY AI is currently a web-based project. A dedicated Windows application and advanced screen interaction are part of the future vision.

Features, integrations, and implementation details may change as development progresses.

## 👨‍💻 Developer

**Akasha Hashmi**  
Computer Science and Engineering Student  
Satavahana University

Building FRIDAY AI with curiosity, continuous learning, and a vision for more capable personal AI assistants.

## 📄 License

No open-source license has been specified yet. A license can be added when the project's distribution and reuse terms have been decided.

---

*FRIDAY AI — Building my vision of a personal AI assistant, one step at a time.*
