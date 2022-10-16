import type { TestController } from 'vscode';
import { FilesModeController } from './files';
import { ModeController } from './base';


export * from './base';

export enum Mode {
    files = 'files',
    producer = 'producer',
    advanced = 'advanced',
}

export function getModeController(mode: Mode): ModeController {
    switch (mode) {
        case Mode.files:
            return new FilesModeController();
        default:
            throw new Error(`Invalid mode: "${mode}"`);
    }
}