import { Mode } from './index';
import type { Disposable, TestController } from 'vscode';

export abstract class ModeController {
    public abstract type: Mode;

    protected subscriptions: Disposable[] = [];
    constructor() {
    }

    dispose() {
        this.subscriptions.forEach(s => s.dispose());
    }
}