# AI Coding Experiments & Notes

> Documentation of AI-assisted development patterns, learnings, and automation experiments for the Firefox Bootstrap project.

## Experiment Log

### 2025-08-03: Project Inception & Planning

**AI Tools Used**: Claude Opus/Sonnet 4

**Experiment**: Full project architecture design through AI conversation
- **Input**: High-level feature requirements from `firefox-bootstrap.org`
- **Process**: Iterative refinement of technical specifications
- **Output**: Complete ROLLOUT_PLAN.md with 21 granular tasks
- **Success**: ✅ AI successfully translated vague requirements into actionable technical plan
- **Learning**: LLMs excel at structural planning when given clear constraints

**Key Patterns Discovered**:
1. **Constraint-First Design**: Providing explicit limitations (MVP, quick demo) led to better scoping
2. **Context Preservation**: The original .org file provided consistent reference throughout planning
3. **Incremental Refinement**: Breaking down complex features into phases worked well

### 2025-08-03: Repository Setup

**AI Tools Used**: Claude Sonnet 4

**Experiment**: Automated project scaffolding
- **Input**: File structure requirements and best practices
- **Process**: AI generated directory structure, manifest.json, .gitignore
- **Output**: Working extension foundation with proper Firefox WebExtensions structure
- **Success**: ✅ Generated proper manifest v3 syntax without manual reference

**Automation Opportunities Identified**:
- [ ] Git hook to auto-update AI_CODING_NOTES.md on commits
- [ ] Template generation for new components
- [ ] Automated dependency analysis

## AI Prompt Patterns That Work

### 1. Context + Constraints + Goal
```
Context: Building Firefox extension with React
Constraints: MVP in 12 days, LinkedIn demo focus
Goal: Create manifest.json with sidebar support
```

### 2. Incremental Specification
```
Start: "Create a Firefox extension"
Refine: "With React sidebar and background script"
Detail: "Supporting tab groups API and local LLM"
```

### 3. Reference Anchoring
```
"Based on the requirements in firefox-bootstrap.org..."
"Following the structure defined in ROLLOUT_PLAN.md..."
```

## AI Workflow Optimizations

### TodoWrite Integration
- **Pattern**: Use TodoWrite for planning, marking progress during execution
- **Benefit**: Provides clear accountability for AI-generated tasks
- **Challenge**: Need to train AI to update todos consistently

### Multi-Tool Coordination
- **Pattern**: Combine Read, Write, Bash tools in single responses
- **Benefit**: Faster execution, maintains context
- **Challenge**: Error handling across multiple operations

## Code Quality Observations

### AI-Generated Manifest.json Analysis
**Strengths**:
- ✅ Proper manifest v3 syntax
- ✅ Correct permissions for tab management
- ✅ Sidebar configuration included
- ✅ Security CSP properly set

**Potential Issues**:
- ⚠️ No validation of tabGroups API support in Firefox
- ⚠️ Missing error handling structure

**Mitigation Strategy**: Add validation steps to AI prompts

## Next Experiments

### Planned for Phase 1 (Build Pipeline)
1. **AI Package.json Generation**: Can AI correctly infer dependencies from requirements?
2. **Vite Config Automation**: Test AI's ability to configure multi-entry builds
3. **TypeScript Setup**: Evaluate AI's handling of complex tsconfig for extensions

### Planned for Phase 2 (Architecture)
1. **Message Passing Design**: AI's ability to design type-safe inter-script communication
2. **Error Handling Patterns**: Can AI proactively add robust error handling?
3. **State Management**: Test AI's React context/reducer pattern implementation

## Measurement Criteria

### Code Quality Metrics
- [ ] TypeScript compilation success rate
- [ ] ESLint/Prettier conformance
- [ ] Firefox extension validation results
- [ ] Manual code review scores (1-5 scale)

### AI Effectiveness Metrics
- [ ] Task completion rate (planned vs delivered)
- [ ] Iteration count per feature
- [ ] Time to working prototype
- [ ] Bug introduction rate

### Automation Success Metrics
- [ ] Number of manual interventions required
- [ ] Successful automated tests
- [ ] Build pipeline reliability
- [ ] Documentation completeness

## Tools & Extensions Used

### Primary AI Assistants
- **Claude Opus 4**: Architecture & planning
- **Claude Sonnet 4**: Implementation & coding

### Supporting Tools
- Git with conventional commits
- Firefox Web-ext for testing
- Linear for issue tracking

### Future Tool Integration
- [ ] GitHub Copilot for inline suggestions
- [ ] AI-powered testing frameworks
- [ ] Automated dependency updates
- [ ] AI code review integration

---

*This document is maintained by AI with human oversight. Last updated: 2025-08-03*