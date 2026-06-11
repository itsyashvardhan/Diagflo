/**
 * Chart DSL Parser
 * 
 * Parses a custom JSON-based DSL for advanced charts that Mermaid cannot handle.
 * This enables log-log graphs, annotations, reference lines, and more.
 */

export interface ChartDataPoint {
    x: number | string;
    y: number;
    label?: string;
}

export interface ChartDataset {
    label: string;
    data: ChartDataPoint[] | number[];
    color?: string;
    borderColor?: string;
    backgroundColor?: string;
    borderDash?: number[];
    pointRadius?: number;
    pointStyle?: 'circle' | 'triangle' | 'rect' | 'star' | 'cross';
    fill?: boolean;
    tension?: number; // 0 for straight lines, 0.4 for smooth curves
}

export interface ChartScaleConfig {
    type?: 'linear' | 'logarithmic' | 'category' | 'time';
    title?: string;
    min?: number;
    max?: number;
    grid?: boolean;
}

export interface ChartAnnotation {
    type: 'line' | 'box' | 'point' | 'label';
    // For line annotations
    value?: number;
    orientation?: 'horizontal' | 'vertical';
    // For point/label annotations
    x?: number | string;
    y?: number;
    // Common properties
    label?: string;
    color?: string;
    style?: 'solid' | 'dashed' | 'dotted';
    // For box annotations
    xMin?: number | string;
    xMax?: number | string;
    yMin?: number;
    yMax?: number;
}

export interface ChartDSLConfig {
    type: 'line' | 'bar' | 'scatter' | 'bubble' | 'area';
    title?: string;
    subtitle?: string;
    scales?: {
        x?: ChartScaleConfig;
        y?: ChartScaleConfig;
    };
    datasets: ChartDataset[];
    annotations?: ChartAnnotation[];
    legend?: {
        position?: 'top' | 'bottom' | 'left' | 'right';
        display?: boolean;
    };
    responsive?: boolean;
    aspectRatio?: number;
}

export interface ParseResult {
    success: boolean;
    config?: ChartDSLConfig;
    error?: string;
}

/**
 * Detects if a code block is a Chart.js DSL definition
 */
export function isChartJSDSL(code: string): boolean {
    const trimmed = code.trim();

    // Check for explicit chartjs marker
    if (trimmed.startsWith('```chartjs') || trimmed.startsWith('chartjs')) {
        return true;
    }

    // Check for JSON-like structure with chart-specific fields
    try {
        // Remove markdown code fence if present
        const jsonContent = extractJSONContent(code);
        if (!jsonContent) return false;

        const parsed = JSON.parse(jsonContent);

        // Must have type and datasets to be a chart DSL
        return (
            typeof parsed === 'object' &&
            parsed !== null &&
            'type' in parsed &&
            'datasets' in parsed &&
            Array.isArray(parsed.datasets) &&
            ['line', 'bar', 'scatter', 'bubble', 'area'].includes(parsed.type)
        );
    } catch {
        return false;
    }
}

/**
 * Extracts JSON content from a code block
 */
function extractJSONContent(code: string): string | null {
    let content = code.trim();

    // Remove markdown code fence with chartjs marker
    const chartjsFenceMatch = content.match(/^```chartjs\s*\n?([\s\S]*?)\n?```$/);
    if (chartjsFenceMatch) {
        return chartjsFenceMatch[1].trim();
    }

    // Remove generic markdown code fence
    const genericFenceMatch = content.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
    if (genericFenceMatch) {
        return genericFenceMatch[1].trim();
    }

    // Remove chartjs prefix if present
    if (content.startsWith('chartjs')) {
        content = content.replace(/^chartjs\s*/, '');
    }

    // Check if it's already valid JSON
    if (content.startsWith('{')) {
        return content;
    }

    return null;
}

/**
 * Validates a dataset configuration
 */
function validateDataset(dataset: unknown, index: number): string | null {
    if (typeof dataset !== 'object' || dataset === null) {
        return `Dataset ${index} must be an object`;
    }

    const ds = dataset as Record<string, unknown>;

    if (typeof ds.label !== 'string') {
        return `Dataset ${index} must have a string 'label' property`;
    }

    if (!Array.isArray(ds.data)) {
        return `Dataset ${index} must have a 'data' array`;
    }

    return null;
}

/**
 * Validates an annotation configuration
 */
function validateAnnotation(annotation: unknown, index: number): string | null {
    if (typeof annotation !== 'object' || annotation === null) {
        return `Annotation ${index} must be an object`;
    }

    const ann = annotation as Record<string, unknown>;

    if (!['line', 'box', 'point', 'label'].includes(ann.type as string)) {
        return `Annotation ${index} must have a valid 'type' (line, box, point, or label)`;
    }

    return null;
}

/**
 * Parses and validates the Chart DSL
 */
export function parseChartDSL(code: string): ParseResult {
    try {
        const jsonContent = extractJSONContent(code);

        if (!jsonContent) {
            return {
                success: false,
                error: 'Could not extract JSON content from chart definition'
            };
        }

        const parsed = JSON.parse(jsonContent);

        // Validate required fields
        if (!parsed.type) {
            return {
                success: false,
                error: 'Chart must have a "type" property (line, bar, scatter, bubble, or area)'
            };
        }

        if (!['line', 'bar', 'scatter', 'bubble', 'area'].includes(parsed.type)) {
            return {
                success: false,
                error: `Invalid chart type "${parsed.type}". Supported types: line, bar, scatter, bubble, area`
            };
        }

        if (!parsed.datasets || !Array.isArray(parsed.datasets)) {
            return {
                success: false,
                error: 'Chart must have a "datasets" array'
            };
        }

        if (parsed.datasets.length === 0) {
            return {
                success: false,
                error: 'Chart must have at least one dataset'
            };
        }

        // Validate each dataset
        for (let i = 0; i < parsed.datasets.length; i++) {
            const error = validateDataset(parsed.datasets[i], i);
            if (error) {
                return { success: false, error };
            }
        }

        // Validate annotations if present
        if (parsed.annotations && Array.isArray(parsed.annotations)) {
            for (let i = 0; i < parsed.annotations.length; i++) {
                const error = validateAnnotation(parsed.annotations[i], i);
                if (error) {
                    return { success: false, error };
                }
            }
        }

        // Apply defaults
        const config: ChartDSLConfig = {
            type: parsed.type,
            title: parsed.title,
            subtitle: parsed.subtitle,
            scales: {
                x: {
                    type: parsed.scales?.x?.type || 'linear',
                    title: parsed.scales?.x?.title,
                    min: parsed.scales?.x?.min,
                    max: parsed.scales?.x?.max,
                    grid: parsed.scales?.x?.grid !== false
                },
                y: {
                    type: parsed.scales?.y?.type || 'linear',
                    title: parsed.scales?.y?.title,
                    min: parsed.scales?.y?.min,
                    max: parsed.scales?.y?.max,
                    grid: parsed.scales?.y?.grid !== false
                }
            },
            datasets: parsed.datasets.map((ds: ChartDataset) => ({
                label: ds.label,
                data: ds.data,
                color: ds.color || ds.borderColor,
                borderColor: ds.borderColor || ds.color,
                backgroundColor: ds.backgroundColor || (ds.color ? `${ds.color}20` : undefined),
                borderDash: ds.borderDash,
                pointRadius: ds.pointRadius ?? 4,
                pointStyle: ds.pointStyle || 'circle',
                fill: ds.fill ?? false,
                tension: ds.tension ?? 0.1
            })),
            annotations: parsed.annotations || [],
            legend: {
                position: parsed.legend?.position || 'top',
                display: parsed.legend?.display !== false
            },
            responsive: parsed.responsive !== false,
            aspectRatio: parsed.aspectRatio || 2
        };

        return { success: true, config };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            success: false,
            error: `Failed to parse chart configuration: ${message}`
        };
    }
}

/**
 * Gets a human-readable description of the chart type
 */
export function getChartTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        line: 'Line Chart',
        bar: 'Bar Chart',
        scatter: 'Scatter Plot',
        bubble: 'Bubble Chart',
        area: 'Area Chart'
    };

    return labels[type] || 'Chart';
}
