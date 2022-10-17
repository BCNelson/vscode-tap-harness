declare module 'tap-parser' {
    import Minipass from 'minipass';
    export default class Parser extends Minipass {
        constructor();
        constructor(options: ParserOptions);
        constructor(callback: (result: CompleteData) => void)
        constructor(options: ParserOptions, callback: (result: CompleteData) => void)
        static parse(tapInput: string): Array<Node>;
        static stringify(nodes: Array<Node>): string
    }
    export function parse(tapInput: string): Array<Node>;
    export function stringify(nodes: Array<Node>): string;

    export interface ParserOptions {
        name?: string;
        passes?: boolean;
        strict?: boolean;
    }

    export type VersionNodeId = 'version';
    export type PlanNodeId = 'plan';
    export type PragmaNodeId = 'pragma';
    export type BailoutNodeId = 'bailout';
    export type AssertNodeId = 'assert';
    export type ExtraNodeId = 'extra';
    export type CommentNodeId = 'comment';
    export type CompleteNodeId = 'complete';
    export type ChildNodeId = 'child';

    export type Node = VersionNode | PlanNode | PragmaNode | BailoutNode | AssertNode | ExtraNode | CommentNode | CompleteNode | ChildNode;
    export type VersionNode = [ VersionNodeId, number ];
    export type PlanNode = [ PlanNodeId, PlanData ];
    export interface PlanData {
        start: number,
        end: number,
    }
    export type PragmaNode = [ PragmaNodeId, string, boolean ];
    export type BailoutNode = [ BailoutNodeId, string ];
    export type AssertNode = [ AssertNodeId, AssertData ];
    export interface AssertData {
        ok: boolean,
        id?: number,
        name?: string,
        fullname: string,
        time?: number,
        skip?: string,
        todo?: string,
        diag?: any,
    }
    export type ExtraNode = [ ExtraNodeId, string ];
    export type CommentNode = [ CommentNodeId, string ];
    export type CompleteNode = [ CommentNodeId, CompleteData ];
    export interface CompleteData {
        ok: boolean,
        count: number,
        pass: number,
        fail: number,
        bailout: boolean,
        todo: number,
        skip: number,
        plan: {
            start: number,
            end: number,
            skipAll: boolean,
            skipReason: string,
            comment: string
        },
        failures: Array<AssertData>,
        time: number | null,
        passes?: Array<AssertData>
    }
    export type ChildNode = [ ChildNodeId, Array<Node> ];
}