const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { StateGraph, Annotation } = require('@langchain/langgraph');
const { MemorySaver } = require('@langchain/langgraph');

/**
 * AI Post Generator Service (Friendly + Emoji Enhanced)
 * Generates human-like captions with contextual emojis + professional image prompts
 */
class AIPostGeneratorService {
  constructor() {
    this.model = null;
    this.initialized = false;
  }

  async initialize(apiKey) {
    if (!apiKey) throw new Error('Gemini API key is required');
    const cleanApiKey = apiKey.toString().trim();
    if (!cleanApiKey) throw new Error('Gemini API key is empty after trimming');

    try {
      this.model = new ChatGoogleGenerativeAI({
        apiKey: cleanApiKey,
        model: 'gemini-2.5-flash',
        temperature: 0.85 // slightly higher for friendly + creative touch
      });

      this.initialized = true;
      console.log('[AIPostGeneratorService] Initialized with gemini-2.5-flash (Friendly Mode)');
    } catch (error) {
      console.error('[AIPostGeneratorService] Initialization error:', error);
      throw new Error(`Failed to initialize AI model: ${error.message}`);
    }
  }

  async generatePost(context) {
    if (!this.initialized) throw new Error('Service not initialized. Call initialize() first.');

    const {
      accountType = 'tech personal brand',
      targetAudience = 'developers and computer science learners',
      brandVoice = 'friendly, modern, educational',
      topics = [],
      additionalContext = ''
    } = context;

    const StateAnnotation = Annotation.Root({
      accountType: Annotation,
      targetAudience: Annotation,
      brandVoice: Annotation,
      topics: Annotation,
      additionalContext: Annotation,
      caption: Annotation,
      enhancedCaption: Annotation,
      imagePrompt: Annotation,
      hashtags: Annotation
    });

    const workflow = new StateGraph(StateAnnotation);

    // 🧠 Step 1: Generate base caption (technical & educational)
    const generateBaseCaption = async (state) => {
      const topicsText = state.topics?.length
        ? `Focus on these topics: ${state.topics.join(', ')}.`
        : '';

      const prompt = `
You are a senior software engineer and AI content creator.
Write a clear, technical Instagram caption for a post.

Account Type: ${state.accountType}
Target Audience: ${state.targetAudience}
Brand Voice: ${state.brandVoice}
${topicsText}
Additional Context: ${state.additionalContext}

Requirements:
- 100–130 words.
- Focus on technical clarity, real-world coding, AI systems, or architecture insights.
- No emojis or slang.
- End with a one-line call-to-action like “Follow for more tech insights!”

Output only the plain caption text:
`;

      const response = await this.model.invoke(prompt);
      const caption = (response?.content || '').trim();
      return { ...state, caption };
    };

    // 😎 Step 2: Add emojis + friendly human tone
    const addEmojisToCaption = async (state) => {
      const prompt = `
Take this technical Instagram caption and rewrite it with a friendly, human tone and natural emojis.
Caption: "${state.caption}"

Rules:
- Keep it professional yet conversational.
- Add relevant emojis (only where it enhances emotion or clarity).
- Match emojis to post vibe:
  - Coding / Programming → 💻 👨‍💻 👩‍💻
  - AI / ML / Data → 🤖 🧠 📊
  - Cloud / DevOps → ☁️ ⚙️
  - System Design → 🧩 🏗️
  - Tech career / motivation → 🚀 💼 ✨
- Keep the same structure, don't shorten much.
- Retain call-to-action at the end.
- Avoid emoji spam; use 5–8 well-placed emojis maximum.
- IMPORTANT: Output ONLY the caption text itself. Do NOT include any intro lines like "Here's your rewritten caption" or similar phrases. Start directly with the caption content.

Output the improved caption:
`;

      const response = await this.model.invoke(prompt);
      let enhancedCaption = (response?.content || '').trim();
      
      // Remove any intro lines that might have been added
      enhancedCaption = enhancedCaption
        .replace(/^Here'?s? (your|the) (rewritten |improved |enhanced )?caption.*?:/i, '')
        .replace(/^Here'?s? (a|an) (rewritten |improved |enhanced )?version.*?:/i, '')
        .replace(/^(Rewritten |Improved |Enhanced )?caption.*?:/i, '')
        .trim();
      
      return { ...state, enhancedCaption };
    };

    // 🖼️ Step 3: Generate image prompt (for AI Image Generator)
    const generateImagePrompt = async (state) => {
      const topicsText = state.topics?.join(', ') || 'software development, AI, engineering';
      const prompt = `
Create a vivid, detailed AI image generation prompt for a post about:
"${state.enhancedCaption}"

Context:
- Account Type: ${state.accountType}
- Brand Voice: ${state.brandVoice}
- Topics: ${topicsText}

Guidelines:
- Focus on developer realism: screens, dashboards, diagrams, or code editors.
- Avoid "AI brain", robots, or abstract glowing shapes.
- Keep it professional, clean, futuristic.
- Use 150–200 characters max.
- The image should feel Instagram-ready.

Output only the image prompt:
`;

      const response = await this.model.invoke(prompt);
      const imagePrompt = (response?.content || '').trim();
      return { ...state, imagePrompt };
    };

    // 🔖 Step 4: Generate hashtags
    const generateHashtags = async (state) => {
      const prompt = `
Generate 12–15 Instagram hashtags based on this caption:
"${state.enhancedCaption}"

Focus on: AI, programming, system design, cloud, dev life, coding.
Mix of broad and niche tags.
Format: space-separated, all lowercase, no numbering.
`;

      const response = await this.model.invoke(prompt);
      const hashtags = (response?.content || '').trim();
      return { ...state, hashtags };
    };

    // Graph setup
    workflow.addNode('generateBaseCaption', generateBaseCaption);
    workflow.addNode('addEmojisToCaption', addEmojisToCaption);
    workflow.addNode('generateImagePrompt', generateImagePrompt);
    workflow.addNode('generateHashtags', generateHashtags);

    workflow.setEntryPoint('generateBaseCaption');
    workflow.addEdge('generateBaseCaption', 'addEmojisToCaption');
    workflow.addEdge('addEmojisToCaption', 'generateImagePrompt');
    workflow.addEdge('generateImagePrompt', 'generateHashtags');
    workflow.addEdge('generateHashtags', '__end__');

    // Run workflow
    const app = workflow.compile({ checkpointer: new MemorySaver() });
    const initialState = { accountType, targetAudience, brandVoice, topics, additionalContext };
    const result = await app.invoke(initialState, {
      configurable: { thread_id: Date.now().toString() }
    });

    console.log('[AIPostGeneratorService] Post generated successfully 🎉');

    return {
      caption: result.enhancedCaption,
      imagePrompt: result.imagePrompt,
      hashtags: result.hashtags,
      fullCaption: `${result.enhancedCaption}\n\n${result.hashtags}`
    };
  }

  static async validateApiKey(apiKey) {
    try {
      const cleanApiKey = apiKey.toString().trim();
      const testModel = new ChatGoogleGenerativeAI({
        apiKey: cleanApiKey,
        model: 'gemini-2.5-flash'
      });
      await testModel.invoke('Test');
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = AIPostGeneratorService;
