/**
 * Diagram Sanitizer - Pre-processes Mermaid code to fix common issues
 * before rendering. This prevents rendering failures for edge cases
 * that the AI might generate incorrectly.
 */

import { isChartJSDSL } from './chartDSL';

export interface SanitizationResult {
    code: string;
    wasModified: boolean;
    fixes: string[];
    warnings: string[];
    diagramType: string | null;
}

/**
 * Detect the diagram type from Mermaid code or Chart.js DSL
 */
export function detectDiagramType(code: string): string | null {
    // First, check if it's a Chart.js DSL definition
    if (isChartJSDSL(code)) {
        return 'chartjs';
    }

    const trimmed = code.trim().toLowerCase();

    const typePatterns: [RegExp, string][] = [
        [/^flowchart\s/m, 'flowchart'],
        [/^graph\s/m, 'flowchart'],
        [/^sequencediagram/m, 'sequence'],
        [/^classdiagram/m, 'class'],
        [/^statediagram/m, 'state'],
        [/^statediagram-v2/m, 'state'],
        [/^erdiagram/m, 'er'],
        [/^gantt/m, 'gantt'],
        [/^pie/m, 'pie'],
        [/^gitgraph/m, 'gitGraph'],
        [/^mindmap/m, 'mindmap'],
        [/^timeline/m, 'timeline'],
        [/^quadrantchart/m, 'quadrant'],
        [/^requirementdiagram/m, 'requirement'],
        [/^c4context/m, 'c4'],
        [/^c4container/m, 'c4'],
        [/^c4component/m, 'c4'],
        [/^c4dynamic/m, 'c4'],
        [/^c4deployment/m, 'c4'],
        [/^journey/m, 'journey'],
        [/^xychart-beta/m, 'xychart'],
        [/^sankey-beta/m, 'sankey'],
        [/^block-beta/m, 'block'],
        [/^packet-beta/m, 'packet'],
        [/^architecture-beta/m, 'architecture'],
        [/^kanban/m, 'kanban'],
    ];

    for (const [pattern, type] of typePatterns) {
        if (pattern.test(trimmed)) {
            return type;
        }
    }

    return null;
}

/**
 * Sanitize XY Chart specific issues
 */
function sanitizeXYChart(code: string): { code: string; fixes: string[] } {
    const fixes: string[] = [];
    let result = code;

    // Fix 1: Remove "type logarithmic" or "type linear" from axes
    const typeModifierRegex = /\b(x-axis|y-axis)\s+("[^"]*")\s+type\s+(logarithmic|linear)/gi;
    if (typeModifierRegex.test(result)) {
        result = result.replace(typeModifierRegex, '$1 $2');
        fixes.push('Removed unsupported axis type modifiers (logarithmic/linear)');
    }

    // Fix 2: Remove labels after data arrays like: line [1,2,3] "Label"
    const labelAfterArrayRegex = /(line|bar)\s*\[([^\]]+)\]\s*"[^"]*"/gi;
    if (labelAfterArrayRegex.test(result)) {
        result = result.replace(labelAfterArrayRegex, '$1 [$2]');
        fixes.push('Removed invalid labels after data arrays');
    }

    // Fix 3: Remove scatter keyword (not supported)
    const scatterRegex = /^\s*scatter\s*\[/gim;
    if (scatterRegex.test(result)) {
        result = result.replace(scatterRegex, '    line [');
        fixes.push('Converted unsupported scatter to line chart');
    }

    // Fix 4: Remove objects in arrays like [{x:1, y:2}]
    const objectInArrayRegex = /\[\s*\{[^}]+\}\s*(,\s*\{[^}]+\})*\s*\]/g;
    if (objectInArrayRegex.test(result)) {
        // This is harder to fix automatically, just warn
        fixes.push('Warning: Object syntax in arrays not supported - may need manual fix');
    }

    // Fix 5: Remove "min" or "max" as standalone keywords
    const standaloneMinMax = /(y-axis|x-axis)\s+("[^"]*")\s+(min|max)\s+(\d+)/gi;
    if (standaloneMinMax.test(result)) {
        // Try to convert to proper range syntax
        result = result.replace(standaloneMinMax, (match, axis, label, minmax, value) => {
            if (minmax.toLowerCase() === 'min') {
                return `${axis} ${label} ${value} --> 100`;
            }
            return `${axis} ${label} 0 --> ${value}`;
        });
        fixes.push('Converted standalone min/max to range syntax');
    }

    return { code: result, fixes };
}

/**
 * Sanitize flowchart specific issues
 */
function sanitizeFlowchart(code: string): { code: string; fixes: string[] } {
    const fixes: string[] = [];
    let result = code;

    // Fix 0: Remove accidental markdown fences and section headers from code output
    const markdownNoiseRegex = /^```[\w-]*\s*$|^```\s*$|^\s*\*\*Explanation:\*\*\s*$|^\s*\*\*Structured Diagram Code:\*\*\s*$/gim;
    if (markdownNoiseRegex.test(result)) {
        result = result.replace(markdownNoiseRegex, '').trim();
        fixes.push('Removed markdown noise from flowchart code');
    }

    // Fix 1: Replace \n with <br/> in node labels
    const escapedNewlineRegex = /\["([^"]*?)\\n([^"]*?)"\]/g;
    let match;
    while ((match = escapedNewlineRegex.exec(result)) !== null) {
        const fixed = match[0].replace(/\\n/g, '<br/>');
        result = result.replace(match[0], fixed);
        fixes.push('Replaced \\n with <br/> in node labels');
    }

    // Fix 2: Fix linkStyle stroke-dasharray with spaces
    const dashArraySpaceRegex = /stroke-dasharray:\s*(\d+)\s+(\d+)/g;
    if (dashArraySpaceRegex.test(result)) {
        result = result.replace(dashArraySpaceRegex, 'stroke-dasharray:$1,$2');
        fixes.push('Fixed stroke-dasharray spacing');
    }

    // Fix 3: Normalize excessive hyphen links to stable arrow syntax
    const excessiveDashArrow = /-{3,}>/g;
    if (excessiveDashArrow.test(result)) {
        result = result.replace(excessiveDashArrow, '-->');
        fixes.push('Normalized unsupported long-dash arrow syntax');
    }

    const excessiveDashLink = /(\S)\s-{3,}\s(\S)/g;
    if (excessiveDashLink.test(result)) {
        result = result.replace(excessiveDashLink, '$1 --> $2');
        fixes.push('Converted ambiguous dashed links to standard arrows');
    }

    // Fix 4: Quote unsafe bracket labels to avoid parser ambiguity
    const unquotedBracketLabelRegex = /([A-Za-z_][A-Za-z0-9_]*)\[([^\]\n"]+)\]/g;
    if (unquotedBracketLabelRegex.test(result)) {
        result = result.replace(unquotedBracketLabelRegex, (_m, id: string, label: string) => {
            const normalizedLabel = label
                .replace(/\[/g, '(')
                .replace(/\]/g, ')')
                .replace(/"/g, '\\"')
                .trim();
            return `${id}["${normalizedLabel}"]`;
        });
        fixes.push('Quoted unquoted flowchart labels for parser safety');
    }

    // Fix 5: Normalize smart quotes and long dashes
    const smartTypography = /[“”‘’—–]/g;
    if (smartTypography.test(result)) {
        result = result
            .replace(/[“”]/g, '"')
            .replace(/[‘’]/g, "'")
            .replace(/[—–]/g, '-');
        fixes.push('Normalized smart typography characters');
    }

    // Fix 6: Remove problematic Unicode arrows in labels
    const unicodeArrows = /["']([^"']*)[→↑↓←←→]([^"']*)['"]/g;
    if (unicodeArrows.test(result)) {
        result = result.replace(/→/g, '->').replace(/←/g, '<-').replace(/↑/g, '^').replace(/↓/g, 'v');
        fixes.push('Replaced Unicode arrows with ASCII equivalents');
    }

    return { code: result, fixes };
}

/**
 * Sanitize state diagram issues
 */
function sanitizeStateDiagram(code: string): { code: string; fixes: string[] } {
    const fixes: string[] = [];
    let result = code;

    // Ensure using v2 syntax for better compatibility
    if (/^stateDiagram\s*$/m.test(result) && !/^stateDiagram-v2/m.test(result)) {
        result = result.replace(/^stateDiagram\s*$/m, 'stateDiagram-v2');
        fixes.push('Upgraded to stateDiagram-v2 for better compatibility');
    }

    return { code: result, fixes };
}

/**
 * Sanitize block diagram (block-beta) specific issues
 * Note: block-beta does NOT support 'title', 'accTitle', 'accDescr' like other diagrams
 */
function sanitizeBlockDiagram(code: string): { code: string; fixes: string[] } {
    const fixes: string[] = [];
    let result = code;

    // Fix 1: Remove unsupported 'title' statements (block-beta doesn't support titles)
    // The title keyword is not part of block-beta grammar
    const titleRegex = /^\s*title\s+["'][^"']*["']\s*$/gm;
    if (titleRegex.test(result)) {
        result = result.replace(titleRegex, '%% Title removed (not supported in block-beta)');
        fixes.push('Removed unsupported title statement from block diagram');
    }

    // Fix 2: Remove accTitle and accDescr (accessibility metadata not supported in block-beta)
    const accTitleRegex = /^\s*accTitle\s*:\s*.*$/gm;
    const accDescrRegex = /^\s*accDescr\s*(\{[^}]*\}|:\s*.*)$/gm;
    if (accTitleRegex.test(result)) {
        result = result.replace(accTitleRegex, '');
        fixes.push('Removed unsupported accTitle from block diagram');
    }
    if (accDescrRegex.test(result)) {
        result = result.replace(accDescrRegex, '');
        fixes.push('Removed unsupported accDescr from block diagram');
    }

    // Fix 3: Ensure proper block ID formatting (no spaces in IDs)
    // Block IDs should be alphanumeric or use quotes for labels
    const invalidBlockIdRegex = /^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/gm;
    // This catches lines like "block name" which should be "block[\"name\"]"
    // Skip this for now as it's complex to auto-fix without context

    // Fix 4: Clean up empty lines that might have been left by removals
    result = result.replace(/\n{3,}/g, '\n\n');

    return { code: result, fixes };
}

/**
 * General sanitization for all diagram types
 */
function sanitizeGeneral(code: string): { code: string; fixes: string[] } {
    const fixes: string[] = [];
    let result = code;

    // Remove BOM and weird characters
    result = result.replace(/^\uFEFF/, '');

    // Normalize line endings
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Remove multiple blank lines
    const multipleBlankLines = /\n{3,}/g;
    if (multipleBlankLines.test(result)) {
        result = result.replace(multipleBlankLines, '\n\n');
        fixes.push('Normalized blank lines');
    }

    // Trim trailing whitespace from each line
    result = result.split('\n').map(line => line.trimEnd()).join('\n');

    return { code: result.trim(), fixes };
}

/**
 * Main sanitization function - processes Mermaid code to fix known issues
 */
export function sanitizeDiagram(code: string): SanitizationResult {
    if (!code || typeof code !== 'string') {
        return {
            code: '',
            wasModified: false,
            fixes: [],
            warnings: ['No code provided'],
            diagramType: null,
        };
    }

    let result = code;
    const allFixes: string[] = [];
    const warnings: string[] = [];

    // Step 1: General sanitization
    const generalResult = sanitizeGeneral(result);
    result = generalResult.code;
    allFixes.push(...generalResult.fixes);

    // Step 2: Detect diagram type
    const diagramType = detectDiagramType(result);

    if (!diagramType) {
        warnings.push('Could not detect diagram type - proceeding with general sanitization');
    }

    // Step 3: Type-specific sanitization
    switch (diagramType) {
        case 'xychart': {
            const xyResult = sanitizeXYChart(result);
            result = xyResult.code;
            allFixes.push(...xyResult.fixes);
            break;
        }

        case 'flowchart': {
            const flowResult = sanitizeFlowchart(result);
            result = flowResult.code;
            allFixes.push(...flowResult.fixes);
            break;
        }

        case 'state': {
            const stateResult = sanitizeStateDiagram(result);
            result = stateResult.code;
            allFixes.push(...stateResult.fixes);
            break;
        }

        case 'block': {
            const blockResult = sanitizeBlockDiagram(result);
            result = blockResult.code;
            allFixes.push(...blockResult.fixes);
            break;
        }

        // Add more type-specific handlers as needed
    }

    return {
        code: result,
        wasModified: result !== code,
        fixes: allFixes,
        warnings,
        diagramType,
    };
}

/**
 * Validate diagram before rendering - returns issues that can't be auto-fixed
 */
export function validateDiagramSyntax(code: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const diagramType = detectDiagramType(code);

    if (!diagramType) {
        issues.push('Unknown or missing diagram type declaration');
        return { valid: false, issues };
    }

    // XY Chart specific validation
    if (diagramType === 'xychart') {
        // Check for object syntax that we can't auto-fix
        if (/\[\s*\{/.test(code)) {
            issues.push('XY charts do not support object syntax in data arrays. Use simple number arrays like [1, 2, 3]');
        }

        // Check for unsupported chart types
        if (/^\s*(scatter|area|bubble)\s*\[/m.test(code)) {
            issues.push('Only "line" and "bar" are supported in XY charts');
        }
    }

    // Flowchart validation
    if (diagramType === 'flowchart') {
        // Check for undefined nodes (basic check)
        const nodeDefinitions = code.match(/([A-Za-z_][A-Za-z0-9_]*)\s*[[({<]/g) || [];
        const definedNodes = new Set(nodeDefinitions.map(n => n.replace(/[[({<\s]/g, '')));

        const nodeReferences = code.match(/--[->|.]+\s*([A-Za-z_][A-Za-z0-9_]*)/g) || [];
        for (const ref of nodeReferences) {
            const nodeName = ref.replace(/--[->|.]+\s*/, '').trim();
            if (nodeName && !definedNodes.has(nodeName) && !/^[a-z]$/.test(nodeName)) {
                // Only warn if it looks like a real node name
                // Skip single lowercase letters as they might be valid
            }
        }
    }

    return { valid: issues.length === 0, issues };
}

/**
 * Get a human-readable description of the diagram type
 */
export function getDiagramTypeLabel(type: string | null): string {
    const labels: Record<string, string> = {
        flowchart: 'Flowchart',
        sequence: 'Sequence Diagram',
        class: 'Class Diagram',
        state: 'State Diagram',
        er: 'ER Diagram',
        gantt: 'Gantt Chart',
        pie: 'Pie Chart',
        gitGraph: 'Git Graph',
        mindmap: 'Mind Map',
        timeline: 'Timeline',
        quadrant: 'Quadrant Chart',
        requirement: 'Requirement Diagram',
        c4: 'C4 Diagram',
        journey: 'User Journey',
        xychart: 'XY Chart',
        sankey: 'Sankey Diagram',
        block: 'Block Diagram',
        packet: 'Packet Diagram',
        architecture: 'Architecture Diagram',
        kanban: 'Kanban Board',
        chartjs: 'Advanced Chart',
    };

    return type ? labels[type] || type : 'Unknown';
}
