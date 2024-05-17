export const noop = () => void 0;

export const identity = (value: any) => value;

export const createId = () => Math.random().toString(36).slice(3, 7);

export const upperFirst = (text: string) => {
    if (text.length > 1) {
        return `${text[0] ?? ''.toUpperCase()}${text.slice(1)}`;
    } else {
        return text;
    }
};
