# Firefox Bootstrap 🦊 - AI Coding Experiment

> **⚠️ Experimental Project**: This is an AI-assisted coding experiment, not production software. The primary goal is to explore and document AI coding workflows using Claude, GitHub Copilot, and other AI tools.

## What is this?

Firefox Bootstrap is a browser extension that adds AI-powered features to Firefox, serving as both a useful tool and a testbed for AI development practices. The extension features:

- 🤖 **Auto Tab Naming**: Automatically names tab groups using a local LLM
- 💬 **Dual LLM Chat**: Chat interface supporting both local (Ollama/llamafile) and API models (OpenRouter)
- 📝 **Context Awareness**: Captures highlighted text and page content for AI analysis
- 🔗 **Obsidian Integration**: Send chat content directly to your knowledge vault

## AI Development Approach

This project is being built almost entirely through AI pair programming:

1. **Architecture Design**: Initial system design created through conversation with LLMs
2. **Code Generation**: Most code written by AI with human guidance
3. **Problem Solving**: Debugging and feature implementation through AI collaboration
4. **Documentation**: This README and other docs are AI-assisted

See [AI_CODING_NOTES.md](AI_CODING_NOTES.md) for detailed experiments and learnings.

## Project Status

🚧 **Active Development** - Following the [ROLLOUT_PLAN.md](ROLLOUT_PLAN.md)

Current Phase: **Phase 0 - Foundation**

## Quick Start (Coming Soon)

```bash
# Clone the repository
git clone https://github.com/yourusername/firefox-bootstrap.git

# Install dependencies
npm install

# Build the extension
npm run build

# Load in Firefox
# 1. Navigate to about:debugging
# 2. Click "This Firefox"
# 3. Click "Load Temporary Add-on"
# 4. Select any file in the dist/ folder
```

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Editor**: TipTap for rich text
- **Build**: Vite
- **LLM Support**: Ollama/llamafile (local), OpenRouter (API)
- **Extension**: Firefox WebExtensions API

## Contributing

Since this is an AI coding experiment, contributions should focus on:

- Improving AI prompts and workflows
- Documenting AI coding patterns
- Testing AI-generated code
- Suggesting automation improvements

## Learning Resources

- [Building Firefox Extensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [AI Pair Programming Best Practices](AI_CODING_NOTES.md)
- [Project Architecture](ROLLOUT_PLAN.md)

## License

MIT - See [LICENSE](LICENSE)

---

*Built with 🤖 and ❤️ as an experiment in AI-assisted development*