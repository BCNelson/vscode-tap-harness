import * as vscode from 'vscode';
import { TestRunProfileKind, workspace } from 'vscode';
import { Mode } from './index';
import { ModeController } from './base';
import { spawn } from 'child_process';
import Parser, { parse } from 'tap-parser';

export class ProducerModeController extends ModeController {
    type = Mode.producer;
    protected controller: vscode.TestController;
    protected executable: string;
    protected args: string[];
    readonly id: string;
    constructor(id: string, executable: string, args: string[]) {
        super();
        const workspaceConfig = workspace.getConfiguration('tap-harness.tapProducer');
        this.executable = workspaceConfig.get<string>('executable', '');
        this.args = workspaceConfig.get<string[]>('arguments', []);
        this.id = id;
        this.executable = executable;
        this.args = args;
        
        this.controller = vscode.tests.createTestController(`tap-harness.producer`, this.executable);
        this.subscriptions.push(this.controller);
        this.controller.createRunProfile('Tap Producer', TestRunProfileKind.Run, this.runHandler.bind(this));
        this.controller.resolveHandler = () => {
            this.runHandler(new vscode.TestRunRequest(), new vscode.CancellationTokenSource().token);
        };
    }

    private runHandler(request: vscode.TestRunRequest, cancellationToken: vscode.CancellationToken) {
        const run = this.controller.createTestRun(request);
        const workspaceFolder = vscode.workspace.workspaceFolders;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            run.end();
            return;
        }
        const cwd = workspaceFolder[0].uri.fsPath;

        const abortController = new AbortController();
        const process = spawn(this.executable, this.args, { cwd, windowsHide: true, signal: abortController.signal });
        cancellationToken.onCancellationRequested(() => {
            abortController.abort();
        });
        const chunks: string[] = [];
        process.stdout.on('data', (chunk) => chunks.push(chunk));
        process.stdout.on('error', () => run.end());
        process.stdout.on('end', () => {
            const nodes = parse(chunks.join(''));
            this.run(this.controller, nodes, run).then(() => run.end());
        });
    }
}