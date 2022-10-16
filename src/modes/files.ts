import * as vscode from 'vscode';
import { TestController, workspace } from 'vscode';
import { Mode } from './index';
import { ModeController } from './base';
import { TestCase } from '../tap/TestCase';
import { parse } from 'tap-parser';
import { TextDecoder } from 'util';
import { nodeArrayToTestCaseArray } from '../tap';

export class FilesModeController extends ModeController {
    type = Mode.files;
    private globs: string[];
    private itemsMap = new WeakMap<TestController, Map<string,vscode.TestItem>>();
    private controllerMap = new Map<string, TestController>();
    constructor() {
        super();
        const workspaceConfig = workspace.getConfiguration('tap-harness.testFiles');
        this.globs = workspaceConfig.get<string[]>('globs', []);
        if (this.globs.length === 0) {
            return;
        }

        this.globs.map(async glob => {
            console.log("Globbing", glob);
            await workspace.findFiles(glob).then((files) => {
                console.log("Found files", files);
                files.forEach((uri) => this.runFile(uri));
            });

            // Watch each glob
            const fsWatcher = workspace.createFileSystemWatcher(glob);
            this.subscriptions.push(fsWatcher);
            fsWatcher.onDidCreate((uri) => this.runFile(uri));
            fsWatcher.onDidChange((uri) => this.runFile(uri));
            fsWatcher.onDidDelete((uri) => {
                const controller = this.controllerMap.get(uri.toString());
                if (controller) {
                    controller.dispose();
                }
            });
        });
    }

    async runFile(uri: vscode.Uri) {
        console.log("Running file", uri);
        let controller: TestController;
        let items: Map<string, vscode.TestItem>;
        if (this.controllerMap.has(uri.fsPath)) {
            controller = this.controllerMap.get(uri.fsPath)!;
        } else {
            controller = vscode.tests.createTestController(`tap-harness.${uri.fsPath}`, workspace.asRelativePath(uri));
            this.controllerMap.set(uri.fsPath, controller);
        }
        if (this.itemsMap.has(controller)) {
            items = this.itemsMap.get(controller)!;
        } else {
            items = new Map();
            this.itemsMap.set(controller, items);
        }
        const run = controller.createTestRun(new vscode.TestRunRequest(), workspace.asRelativePath(uri), true);
        const testCases = await this.parseFile(uri);
        console.log("Parsed file", uri, testCases);

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
        console.log("Got pairs", pairs);

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

        const topLevelItems = testCases.map(testCase => getItem(testCase));
        controller.items.replace(topLevelItems);
        run.end();
    }

    async parseFile(uri: vscode.Uri): Promise<TestCase[]> {
        console.log("Getting and Parsing file", uri);
        return workspace.fs.readFile(uri).then(result => {
            const contentsString = new TextDecoder().decode(result);
            const nodes = parse(contentsString);
            console.log("Parsed file", uri);
            return nodeArrayToTestCaseArray(nodes);
        });
    }
}