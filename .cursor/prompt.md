# Project: AI SuperAgent Development Platform

## Vision
SuperAgent is a self-evolving AI development platform that operates like an intelligent society. At its core is a "God node" that interfaces with users and orchestrates a network of specialized AI agents. Each agent can spawn sub-agents when needed, creating an organic, hierarchical structure that efficiently tackles complex tasks.

The system grows and improves itself over time, starting from a minimal core and expanding based on needs and experiences. Agents collaborate through efficient communication protocols, share resources intelligently, and work together to achieve user goals - whether that's reflecting on thoughts, processing videos, or building new tools.

## Core Principles
1. Organic Growth
   - Start minimal with core God node
   - Gradual capability expansion
   - Self-improving architecture
   - Performance-driven evolution

2. Societal Structure
   - Hierarchical agent network
   - Inter-agent communication protocols
   - Resource negotiation mechanisms
   - Collaborative problem-solving

3. Resource Intelligence
   - Smart context management
   - Efficient token utilization
   - Dynamic resource allocation
   - Lightweight communication protocols

## Technical Architecture
1. God Node Layer
   - User interface & request interpretation
   - Society management & optimization
   - Performance monitoring
   - System evolution control

2. Agent Network
   - Dynamic agent spawning
   - Task delegation logic
   - Resource negotiation
   - Inter-agent communication

3. Development Capabilities
   - Autonomous code generation
   - Dynamic UI creation
   - API integration
   - Self-debugging

4. Resource Management
   - Token optimization
   - GPU/CPU allocation
   - Memory management
   - Storage efficiency

## Implementation Features
1. Dynamic Tool Creation
   - Auto-detection of requirements
   - Model selection (LLM, Image, Audio)
   - Component generation
   - API integration

2. Interactive User Experience
   - Dynamic UI generation
   - Resource/credential management
   - Progress tracking
   - Result delivery

3. Security & Safety
   - Isolated execution environments
   - Code validation
   - Resource limitations
   - Access control

## Technical Stack
- TypeScript/React for frontend
- Node.js for backend
- Docker for isolation
- Various AI APIs as needed

## Development Phases
1. MVP (Current)
   - Core God node implementation
   - Basic agent spawning
   - Essential security
   - Fundamental UI

2. Evolution
   - Inter-agent communication
   - Resource negotiation
   - Performance monitoring
   - Society optimization

3. Advanced Features
   - Complex tool creation
   - Multi-modal processing
   - Advanced resource management
   - Enhanced security

Note: This system represents a living, evolving AI society. Each component should be designed with flexibility and growth in mind, allowing the system to naturally expand its capabilities while maintaining efficiency and security.

Director's note: 
'''
You are a world renowned, experienced Senior AI software architect, helping me in the following endeavour.

I want to build a superagent AI chat. The superagent should (ultimate goal) have all his minions for multimodal activities. For example, if I say "I want to reflect on my thoughts, he should either know that we have a reflection agent already in our agents package, or build one there himself. It should even be able to build tools with image or audio models, instead of llm apis, to I can say "I want to replace my video background with an artistic, animated backdrop" it should research which open source models / apis would be good for that, import them, build the necessary structure to execute the model and give the user a webpage as a nicely usable interface. In my example, I would have the option to upload my video there, it would show me a process bar and let me download the finished result.

If possible, it should even be able to interact with the user, like ask them for an API key, via use-specific, dynamically designed components. E. g. if it finds that the best way to achieve something via an API it could ask the user: "If you want to do this with the ChatGPT API, you will have to get an API token for that. You can respond by giving me that token or ask me to go another way, e. g. open source" and give them a suitable input field. 

It should basically be its own developer. I tell it, which tool I want and it guides my decisions with the right questions and suggestions, implements, builds and runs a little tool, debugs it, until it does what would be expected of it. Then it opens that tool as a new page and the user can have fun with that. 
'''