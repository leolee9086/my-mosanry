/** 一帧只执行一次，保留最近参数；取消同时释放排队参数。 */
export type ScheduledFn<Args extends unknown[] = []> = ((...args: Args) => number) & {
    cancel(): void;
};

export function createRafScheduler<Args extends unknown[]>(fn: (...args: Args) => void): ScheduledFn<Args> {
    let lastArgs: Args | undefined;
    let frameId: number | undefined;
    const schedule = (...args: Args): number => {
        lastArgs = args;
        if (frameId !== undefined) return frameId;
        frameId = requestAnimationFrame(() => {
            frameId = undefined;
            const current = lastArgs;
            lastArgs = undefined;
            if (current) fn(...current);
        });
        return frameId;
    };
    schedule.cancel = () => {
        if (frameId !== undefined) cancelAnimationFrame(frameId);
        frameId = undefined;
        lastArgs = undefined;
    };
    return schedule;
}
