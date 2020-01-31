'use strict';

import * as vscode from 'vscode';

import { imagePath } from './imagePath';
import { yaml2html } from './yaml2html';

const jsyaml = require('js-yaml');

export function packYamlUri(uri: vscode.Uri) {
	// Temporarily change the URI scheme
	// Pack the original URI in to the 'query' field
	if (uri.scheme === yamlContentProvider.yamlURI.scheme) {
		// Nothing to do
		return uri;
	}

	return uri.with({ scheme: yamlContentProvider.yamlURI.scheme, query: uri.toString() });
}

export function unpackYamlUri(uri: vscode.Uri) {
	// Restore original URI scheme from the 'query' field
	if ((uri.scheme !== yamlContentProvider.yamlURI.scheme) || (!uri.query)) {
		// Not a modified yaml URI, nothing to do
		return uri;
	}

	return vscode.Uri.parse(uri.query);
}

export class yamlContentProvider implements vscode.TextDocumentContentProvider {
	public static readonly yamlURI = vscode.Uri.parse('yaml:');

	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	private _waiting: boolean = false;

	constructor(private context: vscode.ExtensionContext) { }

	public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
		let document = await vscode.workspace.openTextDocument(unpackYamlUri(uri));
		let text = imagePath(document.getText(), unpackYamlUri(uri));
		let ymlObj = jsyaml.safeLoad(text);
		let body = yaml2html(ymlObj);

		return `<!DOCTYPE html>
			<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
			</head>
			<body class="vscode-body">
				${body}
			</body>
			</html>`;
	}

	get onDidChange(): vscode.Event<vscode.Uri> {
		return this._onDidChange.event;
	}

	public update(uri: vscode.Uri) {
		if (!this._waiting) {
			this._waiting = true;
			setTimeout(() => {
				this._waiting = false;
				this._onDidChange.fire(uri);
			}, 300);
		}
	}
}
