// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ModeController, Mode, getModeController } from './modes';
import { parse } from 'tap-parser';

let testController: vscode.TestController;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "tap-harness" is now active!');
	let configuration = vscode.workspace.getConfiguration('tap-harness');
	let mode: Mode = configuration.get("mode", "files") as Mode;
	let modeController: ModeController = getModeController(mode);
	context.subscriptions.push(modeController);
}

// This method is called when your extension is deactivated
export function deactivate() {}
