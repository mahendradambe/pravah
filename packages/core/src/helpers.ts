import { upperFirst, createId } from "@pravah/utils";
import { NodeMeta, ProcedureMeta, Typed, Vec2 } from "./types";

export const withType = <T extends new (...params: any[]) => any>(
    ctor: T,
    type: string
) => {
    (ctor as any).type = type;

    return ctor as Typed<T>;
};

export const getDefaultLabel = (type: string) =>
    type
        .split(":")
        .map((i) => upperFirst(i))
        .join(":");

export const getDefaultPosition = (): Vec2 => ({ x: 0, y: 0 });

export const getDefaultNodeMeta = (name: string): NodeMeta => {
    return {
        label: `${getDefaultLabel(name)}-${createId()}`,
        position: getDefaultPosition(),
        selected: false,
    };
};

export const getDefaultProcedureMeta = (): ProcedureMeta => {
    return {
        label: `procedure-${createId()}`,
    };
};
