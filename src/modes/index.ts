import { TestController, workspace } from 'vscode';
import { FilesModeController } from './files';
import { ModeController } from './base';
import { ProducerModeController } from './producer';


export * from './base';

export enum Mode {
    files = 'files',
    producer = 'producer',
    advanced = 'advanced',
}

export function getModeController(mode: Mode): ModeController {
    let workspaceConfig = workspace.getConfiguration('tap-harness');
    switch (mode) {
        case Mode.files:
            const globs = workspaceConfig.get<string[]>('testFiles.globs', []);
            return new FilesModeController("files", globs);
        case Mode.producer:
            const executable = workspaceConfig.get<string>('tapProducer.executable', 'tap');
            const args = workspaceConfig.get<string[]>('tapProducer.arguments', []);
            return new ProducerModeController("producer", executable, args);
        default:
            throw new Error(`Invalid mode: "${mode}"`);
    }
}