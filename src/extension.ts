'use strict';

import * as vscode from 'vscode';

import { packYamlUri, unpackYamlUri, yamlContentProvider } from './contentProvider';

const path = require('path');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	//console.log('Congratulations, your extension "yaml-preview" is now active!');
	
	const contentProvider = new yamlContentProvider(context);
	const contentProviderRegistration = vscode.workspace.registerTextDocumentContentProvider(yamlContentProvider.yamlURI.scheme, contentProvider);

	// Show yaml
	let previewDisposable = vscode.commands.registerCommand('yaml.showPreview', async () => {
		yamlPanel(vscode.ViewColumn.One);
		return;
	});

	// Show yaml to the side
	let sidePreviewDisposable = vscode.commands.registerCommand('yaml.showPreviewToSide', async () => {
		yamlPanel(vscode.ViewColumn.Two);
		return;
	});
	
	// Record of uris & panels
	let panelUri = {};

	// Create/reveal yaml preview webpanel
	const yamlPanel = async (viewColumn: vscode.ViewColumn) => {
		let editor = vscode.window.activeTextEditor;

		if (typeof editor === 'undefined') {
			vscode.window.showErrorMessage('Please open a yaml file');
			return;
		}

		let yamlDocUri = packYamlUri(editor.document.uri);

		if (typeof (panelUri[yamlDocUri.toString()]) === 'undefined') {
			// Panel has not yet been created for this document, create one
			let title = path.basename(editor.document.uri.fsPath) + ' - Preview';

			// Allow panel to load local resources
			let resourceUri: vscode.Uri;
			let workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
			if (workspaceFolder) {
				// Resources within the currently opened workspace/folder
				resourceUri = workspaceFolder.uri;
			}
			else {
				// Resources within the same folder or sub folder to the open yaml file
				resourceUri = vscode.Uri.file(path.dirname(editor.document.uri.fsPath));
			}

			const panel = vscode.window.createWebviewPanel(
				'yamlPreview',
				title,
				{
					preserveFocus: true,
					viewColumn: viewColumn,
				},
				{
					localResourceRoots: [resourceUri]
				}
			);

			panelUri[yamlDocUri.toString()] = panel;
		}
		else {
			// Use existing panel
			panelUri[yamlDocUri.toString()].reveal(viewColumn, true);
		}

		// Initial update
		vscode.workspace.openTextDocument(yamlDocUri).then(doc => {
			panelUri[yamlDocUri.toString()].webview.html = doc.getText();
		});

		// Update upon change
		let contentChangeDisposable = contentProvider.onDidChange(uri => {
			contentProvider.provideTextDocumentContent(uri).then(doc => {
				panelUri[uri.toString()].webview.html = doc;
			})
		});

		panelUri[yamlDocUri.toString()].onDidDispose(() => {
			// Remove panel from uri records
			delete panelUri[yamlDocUri.toString()];

			// Dispose change event listener
			contentChangeDisposable.dispose();
		})

		return;
	}

	vscode.workspace.onDidChangeTextDocument(e => {
		if (e.document === vscode.window.activeTextEditor.document) {
			contentProvider.update(packYamlUri(e.document.uri));
		}
	});

	context.subscriptions.push(contentProviderRegistration,
								previewDisposable,
								sidePreviewDisposable);
}

export function deactivate() {
}
