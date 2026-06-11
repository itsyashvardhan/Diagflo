/**
 * Chart.js Utilities
 * 
 * Handles initialization and rendering of Chart.js charts for advanced
 * visualizations that Mermaid cannot support (log scales, annotations, etc.)
 */

import {
    Chart,
    CategoryScale,
    LinearScale,
    LogarithmicScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    LineController,
    BarController,
    ScatterController,
    ChartConfiguration,
    ChartData,
    ChartOptions,
    ScaleOptionsByType,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { ChartDSLConfig, ChartAnnotation } from './chartDSL';

// Register Chart.js components including controllers
Chart.register(
    // Controllers (required for chart types)
    LineController,
    BarController,
    ScatterController,
    // Scales
    CategoryScale,
    LinearScale,
    LogarithmicScale,
    // Elements
    PointElement,
    LineElement,
    BarElement,
    // Plugins
    Title,
    Tooltip,
    Legend,
    Filler,
    annotationPlugin
);

// Theme colors that match the app's design system
const THEME_COLORS = {
    light: {
        text: '#1f2937',
        textMuted: '#6b7280',
        grid: '#e5e7eb',
        border: '#d1d5db',
        background: '#ffffff',
    },
    dark: {
        text: '#f3f4f6',
        textMuted: '#9ca3af',
        grid: '#374151',
        border: '#4b5563',
        background: '#1f2937',
    },
};

// Default color palette for datasets
const DEFAULT_COLORS = [
    '#8b5cf6', // Violet
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
];

export type AppTheme = 'light' | 'dark';

export interface RenderChartOptions {
    canvas: HTMLCanvasElement;
    config: ChartDSLConfig;
    theme?: AppTheme;
}

/**
 * Converts a style string to Chart.js border dash array
 */
function getBorderDash(style?: 'solid' | 'dashed' | 'dotted'): number[] {
    switch (style) {
        case 'dashed':
            return [6, 4];
        case 'dotted':
            return [2, 2];
        default:
            return [];
    }
}

/**
 * Converts DSL annotation to Chart.js annotation plugin format
 */
function convertAnnotation(
    annotation: ChartAnnotation,
    themeColors: typeof THEME_COLORS.dark
): Record<string, unknown> {
    const baseStyle = {
        borderColor: annotation.color || themeColors.text,
        borderDash: getBorderDash(annotation.style),
        borderWidth: 2,
    };

    switch (annotation.type) {
        case 'line':
            if (annotation.orientation === 'horizontal') {
                return {
                    type: 'line',
                    yMin: annotation.value,
                    yMax: annotation.value,
                    ...baseStyle,
                    label: annotation.label
                        ? {
                            display: true,
                            content: annotation.label,
                            position: 'end',
                            backgroundColor: annotation.color || themeColors.text,
                            color: '#ffffff',
                            font: { size: 11, weight: 'bold' },
                            padding: { x: 6, y: 3 },
                        }
                        : undefined,
                };
            } else {
                return {
                    type: 'line',
                    xMin: annotation.value,
                    xMax: annotation.value,
                    ...baseStyle,
                    label: annotation.label
                        ? {
                            display: true,
                            content: annotation.label,
                            position: 'start',
                            backgroundColor: annotation.color || themeColors.text,
                            color: '#ffffff',
                            font: { size: 11, weight: 'bold' },
                            padding: { x: 6, y: 3 },
                        }
                        : undefined,
                };
            }

        case 'box':
            return {
                type: 'box',
                xMin: annotation.xMin,
                xMax: annotation.xMax,
                yMin: annotation.yMin,
                yMax: annotation.yMax,
                backgroundColor: annotation.color ? `${annotation.color}20` : `${themeColors.text}10`,
                ...baseStyle,
                borderWidth: 1,
            };

        case 'point':
        case 'label':
            return {
                type: 'label',
                xValue: annotation.x,
                yValue: annotation.y,
                content: annotation.label || '',
                backgroundColor: annotation.color || themeColors.text,
                color: '#ffffff',
                font: { size: 11, weight: 'bold' },
                padding: { x: 6, y: 3 },
                callout: {
                    display: annotation.type === 'point',
                    side: 10,
                },
            };

        default:
            return {};
    }
}

/**
 * Converts DSL config to Chart.js configuration
 */
export function buildChartConfig(
    dslConfig: ChartDSLConfig,
    theme: AppTheme = 'dark'
): ChartConfiguration {
    const themeColors = THEME_COLORS[theme];

    // Determine chart type
    let chartType: 'line' | 'bar' | 'scatter' = 'line';
    if (dslConfig.type === 'bar') chartType = 'bar';
    if (dslConfig.type === 'scatter') chartType = 'scatter';

    // Build datasets
    const datasets = dslConfig.datasets.map((ds, index) => {
        const color = ds.color || ds.borderColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

        return {
            label: ds.label,
            data: ds.data,
            borderColor: color,
            backgroundColor: ds.fill ? `${color}40` : ds.backgroundColor || `${color}20`,
            borderWidth: 2,
            borderDash: ds.borderDash || [],
            pointRadius: ds.pointRadius ?? 4,
            pointBackgroundColor: color,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1,
            pointHoverRadius: 6,
            pointStyle: ds.pointStyle || 'circle',
            fill: ds.fill ?? (dslConfig.type === 'area'),
            tension: ds.tension ?? (dslConfig.type === 'area' ? 0.3 : 0.1),
        };
    });

    // Build scales configuration
    const xScaleType = dslConfig.scales?.x?.type || 'linear';
    const yScaleType = dslConfig.scales?.y?.type || 'linear';

    const scales: Partial<Record<string, ScaleOptionsByType<'linear' | 'logarithmic' | 'category'>>> = {
        x: {
            type: xScaleType as 'linear' | 'logarithmic' | 'category',
            title: {
                display: !!dslConfig.scales?.x?.title,
                text: dslConfig.scales?.x?.title || '',
                color: themeColors.text,
                font: { size: 12, weight: 'bold' },
            },
            min: dslConfig.scales?.x?.min,
            max: dslConfig.scales?.x?.max,
            grid: {
                display: dslConfig.scales?.x?.grid !== false,
                color: themeColors.grid,
            },
            ticks: {
                color: themeColors.textMuted,
            },
        },
        y: {
            type: yScaleType as 'linear' | 'logarithmic' | 'category',
            title: {
                display: !!dslConfig.scales?.y?.title,
                text: dslConfig.scales?.y?.title || '',
                color: themeColors.text,
                font: { size: 12, weight: 'bold' },
            },
            min: dslConfig.scales?.y?.min,
            max: dslConfig.scales?.y?.max,
            grid: {
                display: dslConfig.scales?.y?.grid !== false,
                color: themeColors.grid,
            },
            ticks: {
                color: themeColors.textMuted,
            },
        },
    };

    // Build annotations
    const annotations: Record<string, Record<string, unknown>> = {};
    if (dslConfig.annotations) {
        dslConfig.annotations.forEach((ann, index) => {
            annotations[`annotation${index}`] = convertAnnotation(ann, themeColors);
        });
    }

    // Build chart options
    const options: ChartOptions = {
        responsive: dslConfig.responsive !== false,
        maintainAspectRatio: true,
        aspectRatio: dslConfig.aspectRatio || 2,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            title: {
                display: !!dslConfig.title,
                text: dslConfig.title || '',
                color: themeColors.text,
                font: { size: 16, weight: 'bold' },
                padding: { bottom: dslConfig.subtitle ? 0 : 16 },
            },
            subtitle: {
                display: !!dslConfig.subtitle,
                text: dslConfig.subtitle || '',
                color: themeColors.textMuted,
                font: { size: 12 },
                padding: { bottom: 16 },
            },
            legend: {
                display: dslConfig.legend?.display !== false,
                position: dslConfig.legend?.position || 'top',
                labels: {
                    color: themeColors.text,
                    usePointStyle: true,
                    padding: 16,
                },
            },
            tooltip: {
                backgroundColor: themeColors.background,
                titleColor: themeColors.text,
                bodyColor: themeColors.textMuted,
                borderColor: themeColors.border,
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                boxPadding: 4,
            },
            annotation: {
                annotations,
            },
        },
        scales: scales as ChartOptions['scales'],
    };

    const data: ChartData = {
        datasets: datasets as ChartData['datasets'],
    };

    return {
        type: chartType,
        data,
        options,
    };
}

// Store active chart instances for cleanup
const chartInstances = new Map<string, Chart>();

/**
 * Renders a chart to a canvas element
 */
export function renderChart({ canvas, config, theme = 'dark' }: RenderChartOptions): Chart {
    const canvasId = canvas.id || `chart-${Date.now()}`;

    // Destroy existing chart on the same canvas
    const existingChart = chartInstances.get(canvasId);
    if (existingChart) {
        existingChart.destroy();
        chartInstances.delete(canvasId);
    }

    // Build and create the chart
    const chartConfig = buildChartConfig(config, theme);
    const chart = new Chart(canvas, chartConfig);

    // Store reference for cleanup
    chartInstances.set(canvasId, chart);

    return chart;
}

/**
 * Destroys a chart instance
 */
export function destroyChart(canvasId: string): void {
    const chart = chartInstances.get(canvasId);
    if (chart) {
        chart.destroy();
        chartInstances.delete(canvasId);
    }
}

/**
 * Updates an existing chart with new configuration
 */
export function updateChart(
    canvasId: string,
    config: ChartDSLConfig,
    theme: AppTheme = 'dark'
): void {
    const chart = chartInstances.get(canvasId);
    if (!chart) return;

    const newConfig = buildChartConfig(config, theme);

    // Update data and options
    chart.data = newConfig.data!;
    chart.options = newConfig.options!;
    chart.update('none'); // Skip animation for immediate update
}

/**
 * Exports chart as PNG data URL
 */
export function exportChartAsPNG(canvasId: string): string | null {
    const chart = chartInstances.get(canvasId);
    if (!chart) return null;

    return chart.toBase64Image('image/png', 1.0);
}
