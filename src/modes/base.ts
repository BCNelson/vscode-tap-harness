import { Mode } from './index';
import type { Disposable, TestController } from 'vscode';
import { workspace } from 'vscode';
import * as vscode from 'vscode';
import { TestCase } from '../tap/TestCase';
import { parse, Node as TapNode } from 'tap-parser';
import { nodeArrayToTestCaseArray } from '../tap';

export abstract class ModeController {
    public abstract type: Mode;

    protected subscriptions: Disposable[] = [];
    protected itemsMap = new WeakMap<TestController, Map<string,vscode.TestItem>>();

    dispose() {
        this.subscriptions.forEach(s => s.dispose());
    }

    async run(controller: TestController, tap: string | TapNode[], run: vscode.TestRun) {
        let items: Map<string, vscode.TestItem>;
        if (this.itemsMap.has(controller)) {
            items = this.itemsMap.get(controller)!;
        } else {
            items = new Map();
            this.itemsMap.set(controller, items);
        }

        let nodes: TapNode[];
        if (typeof tap === 'string') {
            nodes = parse(tap);
        } else {
            nodes = tap;
        }
        const testCases = nodeArrayToTestCaseArray(nodes);

        const getItem = (testCase: TestCase): vscode.TestItem => {
            if (items.has(testCase.id)) {
                const item = items.get(testCase.id)!;
                item.label = testCase.name || `Test ${testCase.id}`;
                return item;
            } else {
                const item = controller.createTestItem(testCase.id, testCase.name || `Test ${testCase.id}`);
                items.set(testCase.id, item);
                return item;
            }
        };

        const getTestCaseItemPairs = (testCases: TestCase[]): [TestCase, vscode.TestItem][] => {
            const ret: [TestCase, vscode.TestItem][] = [];
            for (const testCase of testCases) {
                const item = getItem(testCase);
                ret.push([testCase, item]);
                if (testCase.children.length > 0) {
                    const pairs = getTestCaseItemPairs(testCase.children);
                    const childItems = testCase.children.map(pair => getItem(pair));
                    item.children.replace(childItems);
                    ret.push(...pairs);
                }
            }
            return ret;
        };

        const pairs = getTestCaseItemPairs(testCases);

        const topLevelItems = testCases.map(testCase => getItem(testCase));
        controller.items.replace(topLevelItems);

        for (const [testCase, item] of pairs) {
            if (testCase.todo) {
                item.description = `TODO: ${testCase.todo}`;
            } else if (testCase.skip) {
                item.description = `SKIP: ${testCase.skip}`;
            } else {
                item.description = '';
            }

            if (testCase.skip){
                run.skipped(item);
            } else if (testCase.ok){
                run.passed(item);
            } else {
                run.failed(item, testCase.testMessage);
            }
        }
    }
}