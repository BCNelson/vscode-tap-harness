import { TestMessage } from 'vscode';
import { AssertData, Node } from "tap-parser";
import { nodeArrayToTestCaseArray } from "./index";



export class TestCase {
    ok: boolean;
    id: string;
    name?: string;
    fullname: string;
    time?: number;
    skip?: string;
    todo?: string;
    diag?: any;
    children: TestCase[] = [];

    constructor({ ok, id, name, fullname, time, skip, todo, diag }: AssertData, parentId?: string) {
        this.ok = ok;
        if (parentId) {
            this.id = `${parentId}.${id}`;
        } else {
            this.id = `${id}`;
        }
        this.name = name;
        this.fullname = fullname;
        this.time = time;
        this.skip = skip;
        this.todo = todo;
        this.diag = diag;
    }

    addChildren(child: Node[]) {
        this.children = this.children.concat(nodeArrayToTestCaseArray(child, this.id));
    }

    get testMessage(): TestMessage {
        let message: string = this.ok ? "ok" : "not ok";
        const testMessage = new TestMessage(message);
        return testMessage;
    }
}