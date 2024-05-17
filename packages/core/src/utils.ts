export const spreadArgs = (compactedArgs: [number, any][]) => {
    if (compactedArgs.length > 1) {
        const sorted = compactedArgs.slice().sort((a, b) => a[0] - b[0]);
        const lastIndex = sorted.at(-1)?.[0] ?? -1;
        const args = new Array(lastIndex + 1)
            .fill(0)
            .map((_, idx) => sorted.find((arg) => arg[0] === idx))
            // FIXME: is this filter really required?
            .filter(Boolean)
            .map((value) => value![1]);

        return args;
    }

    if (compactedArgs.length === 0) {
        return [];
    }

    const [, arg] = compactedArgs.at(0)!;

    return [arg];
};

export const applyArgs = (fn: Function) => (args: any[]) => fn(...args);

export const argsToArray = <T extends any[]>(...args: T) => args;
