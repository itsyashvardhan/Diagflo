import type { VercelRequest, VercelResponse } from '@vercel/node';

// ═══════════════════════════════════════════════════════════════
//  Diagflo MCP Server — Streamable HTTP Transport (2025-03-26)
//  Exposes diagram generation as MCP tools for ChatGPT, Claude,
//  Cursor, Copilot, and any MCP-compatible client.
// ═══════════════════════════════════════════════════════════════

const PROTOCOL_VERSION = '2025-03-26';
const SERVER_NAME = 'diagflo-mcp-server';
const SERVER_VERSION = '1.0.0';

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ─── System prompt (shared with api/gemini.ts) ────────────────
const SYSTEM_PROMPT = `You are Archie, a professional system design and diagramming assistant.
Your sole responsibility is to help users create and refine flowcharts, technical diagrams, and 2D illustrations for software systems and workflows.

SUPPORTED DIAGRAM TYPES (Mermaid.js v11.12.0):
- flowchart LR/TD/TB/BT/RL — Flowcharts and process diagrams
- sequenceDiagram — Sequence/interaction diagrams
- classDiagram — UML class diagrams
- stateDiagram-v2 — State machine diagrams
- erDiagram — Entity-relationship diagrams
- gantt — Gantt/timeline charts
- pie — Simple pie charts
- gitGraph — Git branching diagrams
- mindmap — Mind maps and hierarchical ideas
- timeline — Historical/project timelines
- quadrantChart — 2x2 quadrant analysis
- requirementDiagram — Requirements traceability
- journey — User journey maps
- C4Context, C4Container, C4Component — C4 architecture diagrams
- xychart-beta — Simple XY charts (bar/line only)
- sankey-beta — Sankey flow diagrams
- block-beta — Block diagrams

ADVANCED CHARTS (Chart.js DSL):
For log scales, scatter plots, annotations, and complex data viz, output a JSON object inside a \`\`\`chartjs code block.

OUTPUT FORMAT:
Always output the diagram code inside a fenced code block (\`\`\`mermaid or \`\`\`chartjs).
Provide a brief explanation before the code block.
Do not include suggestion lists unless asked.`;

// ─── Tool definitions ─────────────────────────────────────────
const TOOLS = [
    {
        name: 'generate_diagram',
        description:
            'Generate a Mermaid.js or Chart.js diagram from a natural language prompt. Returns the raw diagram code and an explanation. Supports flowcharts, sequence diagrams, ER diagrams, class diagrams, state diagrams, Gantt charts, mind maps, and advanced Chart.js visualizations.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                prompt: {
                    type: 'string',
                    description: 'Natural language description of the diagram to generate.',
                },
                diagramType: {
                    type: 'string',
                    description:
                        'Optional hint for the diagram type (e.g., "flowchart", "sequenceDiagram", "erDiagram"). If omitted, Archie will choose automatically.',
                },
            },
            required: ['prompt'],
        },
    },
    {
        name: 'refine_diagram',
        description:
            'Refine an existing diagram with a follow-up instruction. Provide the current diagram code and a refinement prompt. Returns the updated diagram code and explanation.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                prompt: {
                    type: 'string',
                    description: 'Follow-up instruction to refine the diagram (e.g., "Add error handling", "Use different colors").',
                },
                currentDiagram: {
                    type: 'string',
                    description: 'The current Mermaid or Chart.js diagram code to refine.',
                },
                chatHistory: {
                    type: 'array',
                    description: 'Optional array of previous chat messages for context. Each item: { role: "user"|"assistant", content: string }.',
                    items: {
                        type: 'object',
                        properties: {
                            role: { type: 'string' },
                            content: { type: 'string' },
                        },
                    },
                },
            },
            required: ['prompt', 'currentDiagram'],
        },
    },
    {
        name: 'list_diagram_types',
        description:
            'Returns all supported Mermaid.js and Chart.js diagram types with their syntax keywords and descriptions.',
        inputSchema: {
            type: 'object' as const,
            properties: {},
        },
    },
];

const DIAGRAM_TYPES_RESPONSE = [
    { type: 'flowchart', syntax: 'flowchart TD', description: 'Process flows, decision trees, workflows' },
    { type: 'sequence', syntax: 'sequenceDiagram', description: 'API interactions, message flows between services' },
    { type: 'class', syntax: 'classDiagram', description: 'OOP class hierarchies and relationships' },
    { type: 'state', syntax: 'stateDiagram-v2', description: 'State machines and lifecycle flows' },
    { type: 'er', syntax: 'erDiagram', description: 'Database schema / entity-relationship diagrams' },
    { type: 'gantt', syntax: 'gantt', description: 'Project timelines and scheduling' },
    { type: 'pie', syntax: 'pie', description: 'Data distribution visualization' },
    { type: 'gitGraph', syntax: 'gitGraph', description: 'Git branching and merge visualization' },
    { type: 'mindmap', syntax: 'mindmap', description: 'Brainstorming and concept mapping' },
    { type: 'timeline', syntax: 'timeline', description: 'Chronological events and milestones' },
    { type: 'quadrant', syntax: 'quadrantChart', description: '2×2 quadrant / priority matrices' },
    { type: 'sankey', syntax: 'sankey-beta', description: 'Flow quantities and energy diagrams' },
    { type: 'block', syntax: 'block-beta', description: 'System architecture block diagrams' },
    { type: 'xy', syntax: 'xychart-beta', description: 'Simple line and bar charts' },
    { type: 'requirement', syntax: 'requirementDiagram', description: 'Requirements traceability' },
    { type: 'journey', syntax: 'journey', description: 'User journey maps' },
    { type: 'c4', syntax: 'C4Context', description: 'C4 architecture diagrams (Context, Container, Component)' },
    { type: 'chartjs-line', syntax: '```chartjs { "type": "line" }```', description: 'Advanced line charts with log scales and annotations' },
    { type: 'chartjs-scatter', syntax: '```chartjs { "type": "scatter" }```', description: 'Scatter plots with labeled data points' },
    { type: 'chartjs-bar', syntax: '```chartjs { "type": "bar" }```', description: 'Bar charts with custom styling' },
];

// ─── JSON-RPC helpers ─────────────────────────────────────────
interface JsonRpcRequest {
    jsonrpc: '2.0';
    id?: string | number | null;
    method: string;
    params?: Record<string, unknown>;
}

interface JsonRpcResponse {
    jsonrpc: '2.0';
    id: string | number | null;
    result?: unknown;
    error?: { code: number; message: string; data?: unknown };
}

function rpcResult(id: string | number | null, result: unknown): JsonRpcResponse {
    return { jsonrpc: '2.0', id, result };
}

function rpcError(
    id: string | number | null,
    code: number,
    message: string,
    data?: unknown,
): JsonRpcResponse {
    return { jsonrpc: '2.0', id, error: { code, message, data } };
}

// JSON-RPC error codes
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;
const INVALID_REQUEST = -32600;

// ─── Gemini API call ──────────────────────────────────────────
async function callGemini(
    apiKey: string,
    userPrompt: string,
    currentDiagram?: string,
    chatHistory?: Array<{ role: string; content: string }>,
): Promise<string> {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Append chat history (last 10 messages)
    if (chatHistory && chatHistory.length > 0) {
        for (const m of chatHistory.slice(-10)) {
            contents.push({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            });
        }
    }

    // Build the user message
    let finalPrompt = userPrompt;
    if (currentDiagram) {
        finalPrompt = `Current diagram code:\n\`\`\`\n${currentDiagram}\n\`\`\`\n\nUser request: ${userPrompt}`;
    }
    contents.push({ role: 'user', parts: [{ text: finalPrompt }] });

    const body = {
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (response.status === 429) {
        throw new Error('Gemini API rate limit exceeded. Please try again in a moment.');
    }

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        'No diagram could be generated. Please try rephrasing your prompt.';
    return text;
}

// ─── Extract API key from Authorization header ────────────────
function extractApiKey(req: VercelRequest): string | null {
    // Try query parameter first (for custom BYOK URLs)
    if (req.query.key && typeof req.query.key === 'string') {
        return req.query.key;
    }

    // Try Authorization header
    const auth = req.headers.authorization;
    if (auth) {
        if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
        return auth.trim();
    }

    // Fallback to server environment (for self-hosting or admin bypass)
    return process.env.GEMINI_API_KEY || null;
}

// ─── Handle a single JSON-RPC request ─────────────────────────
async function handleRpcRequest(
    rpc: JsonRpcRequest,
    apiKey: string,
): Promise<JsonRpcResponse | null> {
    const { id, method, params } = rpc;

    // Notifications (no id) → no response
    if (id === undefined || id === null) {
        // MCP notifications we can silently accept
        if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
            return null; // 202 Accepted, no response body
        }
        return null;
    }

    switch (method) {
        // ── Protocol lifecycle ──────────────────────────────────
        case 'initialize': {
            return rpcResult(id, {
                protocolVersion: PROTOCOL_VERSION,
                capabilities: {
                    tools: { listChanged: false },
                },
                serverInfo: {
                    name: SERVER_NAME,
                    version: SERVER_VERSION,
                },
            });
        }

        case 'ping': {
            return rpcResult(id, {});
        }

        // ── Tool discovery ──────────────────────────────────────
        case 'tools/list': {
            return rpcResult(id, { tools: TOOLS });
        }

        // ── Tool invocation ─────────────────────────────────────
        case 'tools/call': {
            const toolName = (params as { name?: string })?.name;
            const toolArgs = (params as { arguments?: Record<string, unknown> })?.arguments ?? {};

            if (!toolName) {
                return rpcError(id, INVALID_PARAMS, 'Missing tool name');
            }

            try {
                switch (toolName) {
                    case 'generate_diagram': {
                        const prompt = toolArgs.prompt as string;
                        if (!prompt) {
                            return rpcError(id, INVALID_PARAMS, 'Missing required parameter: prompt');
                        }
                        const diagramType = toolArgs.diagramType as string | undefined;
                        const fullPrompt = diagramType
                            ? `Create a ${diagramType} diagram: ${prompt}`
                            : prompt;

                        const result = await callGemini(apiKey, fullPrompt);
                        return rpcResult(id, {
                            content: [{ type: 'text', text: result }],
                        });
                    }

                    case 'refine_diagram': {
                        const prompt = toolArgs.prompt as string;
                        const currentDiagram = toolArgs.currentDiagram as string;
                        if (!prompt || !currentDiagram) {
                            return rpcError(
                                id,
                                INVALID_PARAMS,
                                'Missing required parameters: prompt and currentDiagram',
                            );
                        }
                        const chatHistory = (toolArgs.chatHistory as Array<{ role: string; content: string }>) ?? [];

                        const result = await callGemini(apiKey, prompt, currentDiagram, chatHistory);
                        return rpcResult(id, {
                            content: [{ type: 'text', text: result }],
                        });
                    }

                    case 'list_diagram_types': {
                        const markdown = DIAGRAM_TYPES_RESPONSE.map(
                            (d) => `- **${d.type}** (\`${d.syntax}\`) — ${d.description}`,
                        ).join('\n');
                        return rpcResult(id, {
                            content: [
                                {
                                    type: 'text',
                                    text: `Diagflo supports the following diagram types:\n\n${markdown}`,
                                },
                            ],
                        });
                    }

                    default:
                        return rpcError(id, METHOD_NOT_FOUND, `Unknown tool: ${toolName}`);
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                return rpcError(id, INTERNAL_ERROR, message);
            }
        }

        default:
            return rpcError(id, METHOD_NOT_FOUND, `Method not supported: ${method}`);
    }
}

// ═══════════════════════════════════════════════════════════════
//  Vercel serverless handler
// ═══════════════════════════════════════════════════════════════
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers for cross-origin MCP clients
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Mcp-Session-Id');
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

    // Preflight
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    // GET — SSE stream endpoint (spec: server MAY return 405)
    // We return 405 since we are stateless (no server-initiated messages)
    if (req.method === 'GET') {
        res.status(405).json(
            rpcError(null, -32600, 'GET not supported. Use POST to send JSON-RPC messages.'),
        );
        return;
    }

    // Only POST is allowed for JSON-RPC messages
    if (req.method !== 'POST') {
        res.status(405).json(rpcError(null, INVALID_REQUEST, 'Method not allowed'));
        return;
    }

    // Extract API key
    const apiKey = extractApiKey(req);
    if (!apiKey) {
        res.status(401).json(
            rpcError(null, -32000, 'Missing API key. Provide a Gemini API key via Authorization: Bearer <key> header or configure GEMINI_API_KEY environment variable.'),
        );
        return;
    }

    // Parse the JSON-RPC message(s)
    const body = req.body;
    if (!body) {
        res.status(400).json(rpcError(null, INVALID_REQUEST, 'Empty request body'));
        return;
    }

    // Handle batching: body can be a single object or an array
    const isBatch = Array.isArray(body);
    const requests: JsonRpcRequest[] = isBatch ? body : [body];

    // Validate basic structure
    for (const rpc of requests) {
        if (!rpc.jsonrpc || rpc.jsonrpc !== '2.0' || !rpc.method) {
            res.status(400).json(rpcError(rpc?.id ?? null, INVALID_REQUEST, 'Invalid JSON-RPC 2.0 message'));
            return;
        }
    }

    // Check if ALL are notifications (no id) → return 202
    const allNotifications = requests.every((r) => r.id === undefined || r.id === null);
    if (allNotifications) {
        // Process notifications silently
        for (const rpc of requests) {
            await handleRpcRequest(rpc, apiKey);
        }
        res.status(202).end();
        return;
    }

    // Process requests → collect responses
    const responses: JsonRpcResponse[] = [];
    for (const rpc of requests) {
        const result = await handleRpcRequest(rpc, apiKey);
        if (result) responses.push(result);
    }

    // Determine response format based on Accept header
    const accept = req.headers.accept || '';
    const wantsSSE = accept.includes('text/event-stream');

    if (wantsSSE && responses.length > 0) {
        // Respond with SSE stream (spec: Content-Type: text/event-stream)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for (const response of responses) {
            res.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
        }
        res.end();
    } else {
        // Respond with plain JSON
        res.setHeader('Content-Type', 'application/json');
        if (isBatch) {
            res.status(200).json(responses);
        } else {
            res.status(200).json(responses[0] || rpcError(null, INTERNAL_ERROR, 'No response generated'));
        }
    }
}
