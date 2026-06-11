import { useEffect, useRef, useState, useCallback } from 'react';
import { parseChartDSL, getChartTypeLabel, ChartDSLConfig } from '@/lib/chartDSL';
import { renderChart, destroyChart, AppTheme } from '@/lib/chartjs';
import { logger } from '@/lib/logger';
import { AlertCircle, RefreshCw, BarChart3, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChartRendererProps {
    code: string;
    theme?: 'light' | 'dark';
    zoom?: number;
}

export function ChartRenderer({ code, theme = 'dark', zoom = 1 }: ChartRendererProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [chartConfig, setChartConfig] = useState<ChartDSLConfig | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const canvasId = useRef(`chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    const render = useCallback(() => {
        if (!code || !canvasRef.current) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Parse the DSL
            const parseResult = parseChartDSL(code);

            if (!parseResult.success || !parseResult.config) {
                throw new Error(parseResult.error || 'Failed to parse chart configuration');
            }

            setChartConfig(parseResult.config);

            // Render the chart
            const canvas = canvasRef.current;
            canvas.id = canvasId.current;

            // Map app theme to chart theme
            const chartTheme: AppTheme = theme === 'dark' ? 'dark' : 'light';

            renderChart({
                canvas,
                config: parseResult.config,
                theme: chartTheme,
            });

            setRetryCount(0);
            logger.info('Chart rendered successfully', { type: parseResult.config.type });
        } catch (err) {
            logger.error('Chart render error', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to render chart';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [code, theme]);

    useEffect(() => {
        render();

        // Copy the current ref value for cleanup
        const currentCanvasId = canvasId.current;

        return () => {
            // Cleanup on unmount
            destroyChart(currentCanvasId);
        };
    }, [render]);

    const handleRetry = useCallback(() => {
        setRetryCount((prev) => prev + 1);
        render();
    }, [render]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center p-8 overflow-hidden relative"
        >
            {/* Chart type badge */}
            {chartConfig && !error && !isLoading && (
                <div className="absolute bottom-4 left-4 z-10">
                    <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 text-xs">
                        <BarChart3 className="w-3 h-3 text-primary" />
                        <span className="text-muted-foreground font-medium">
                            {getChartTypeLabel(chartConfig.type)}
                        </span>
                        {chartConfig.scales?.x?.type === 'logarithmic' ||
                            chartConfig.scales?.y?.type === 'logarithmic' ? (
                            <span className="text-xs text-violet-400 ml-1">(Log Scale)</span>
                        ) : null}
                    </div>
                </div>
            )}

            {/* Success indicator for first render */}
            {chartConfig && !error && !isLoading && retryCount === 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
                    <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-sm shadow-lg border border-green-500/20 animate-slide-in">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-medium">Chart rendered</span>
                    </div>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="glass-panel p-6 max-w-lg text-center space-y-4 rounded-2xl animate-scale-in">
                    <div className="w-14 h-14 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-7 h-7 text-destructive" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Chart Rendering Error</h3>
                        {chartConfig && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Type: {getChartTypeLabel(chartConfig.type)}
                            </p>
                        )}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-left">
                        <p className="text-sm text-muted-foreground break-words">{error}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRetry} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Retry {retryCount > 0 && `(${retryCount})`}
                    </Button>
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                            💡 <strong>Tips:</strong>
                        </p>
                        <ul className="text-left list-disc list-inside space-y-0.5">
                            <li>Ensure all data values are valid numbers</li>
                            <li>Check that dataset arrays are properly formatted</li>
                            <li>For log scales, values must be positive</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Loading state */}
            {isLoading && (
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                        <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-sm font-medium text-foreground">Rendering chart...</p>
                        <p className="text-xs text-muted-foreground animate-pulse">
                            Processing data and building visualization
                        </p>
                    </div>
                </div>
            )}

            {/* Chart canvas */}
            <div
                className="w-full h-full flex items-center justify-center"
                style={{
                    display: error || isLoading ? 'none' : 'flex',
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center',
                }}
            >
                <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-full"
                    style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '100%',
                    }}
                />
            </div>
        </div>
    );
}
