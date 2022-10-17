import * as vscode from 'vscode';
import { workspace, TestController } from 'vscode';
import { Mode } from './index';
import { ModeController } from './base';
import { TextDecoder } from 'util';

export class FilesModeController extends ModeController {
    type = Mode.files;
    private globs: string[];
    protected controllerMap = new Map<string, TestController>();
    constructor(id: string, globs: string[]) {
        super();
        this.globs = globs;
        if (this.globs.length === 0) {
            return;
        }

        this.globs.map(async glob => {
            await workspace.findFiles(glob).then((files) => {
                console.log("Found files", files);
                files.forEach(this.createFile.bind(this));
            });

            // Watch each glob
            const fsWatcher = workspace.createFileSystemWatcher(glob);
            this.subscriptions.push(fsWatcher);
            fsWatcher.onDidCreate(this.createFile.bind(this));
            fsWatcher.onDidChange((uri)=> {
                const label = workspace.asRelativePath(uri.fsPath);
                const controller = this.controllerMap.get(uri.toString());
                if (controller) {
                    this.runFile(controller, uri, label);
                }
            });
            fsWatcher.onDidDelete((uri) => {
                const controller = this.controllerMap.get(uri.toString());
                if (controller) {
                    controller.dispose();
                }
            });
        });
    }

    private async createFile(uri: vscode.Uri){
        const controllerId = uri.toString();
        const label = workspace.asRelativePath(uri.fsPath);
        let controller: TestController;
        if (this.controllerMap.has(controllerId)) {
            controller = this.controllerMap.get(controllerId)!;
        } else {
            controller = vscode.tests.createTestController(`tap-harness.${controllerId}`, label);
            this.controllerMap.set(controllerId, controller);
            this.subscriptions.push(controller);
        }

        controller.resolveHandler = () => {
            this.runFile(controller, uri, label);
        };
    }

    private async runFile(controller: TestController, uri: vscode.Uri, label: string) {
        return workspace.fs.readFile(uri).then((buffer) => {
            const tap = new TextDecoder().decode(buffer);
            const run = controller.createTestRun(new vscode.TestRunRequest(), label, true);
            return this.run(controller, tap, run).then(() => run.end());
        });
    }
}