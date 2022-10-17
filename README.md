# VS Code Test Anything Protocol (TAP) Consumer

This adds Test Anything Protocol (TAP) support to VS Code

## Features

- Read/Watch TAP files and display the results in the Test Explorer
- Run TAP tests in the Test Explorer

## Requirements

Your tests must output [TAP](https://testanything.org/) (Test Anything Protocol) to be parsed by this extension.

## Extension Settings

This extension contributes the following settings:

- `tap-harness.mode`: Set the mode that should be used for getting tests. Options are `files`, `producer`. Default is `files`.
- `tap-harness.testFiles.globs`: When in `files` mode. An array of globs to be used to find tap files. Default is `["**/*.tap"]`.

- `tap-harness.tapProducer.executable`: When in `producer` mode. The executable to run to get the tap output. Default is `tap`.

- `tap-harness.tapProducer.arguments`: When in `producer` mode. The arguments to pass to the executable. Default is `[]`.

## Known Issues

None at the moment.

## Release Notes

Users appreciate release notes as you update your extension.

### 0.1.0 - Initial release

---
