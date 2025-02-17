import { readFile } from "node:fs/promises";
import path, { join } from "node:path";
import { Glob } from "bun";
import type { Blocks, Data, Options, PluginFunction } from "./types/template-engine";

export class TemplateEngine {
	private plugins: Record<string, PluginFunction> = {};
	private defaultViewName?: string;
	private viewsPath: string;
	private layoutsPath: string;
	private partialsPath: string;

	constructor(options: Options) {
		this.viewsPath = options.path.viewsPath;
		this.layoutsPath = options.path.layoutsPath;
		this.partialsPath = options.path.partialsPath;
		this.defaultViewName = options.viewName;
	}

	public async render(templateName: string, data: Data = {}): Promise<string> {
		const viewFilePath = await this.resolveViewPath(templateName);
		const viewContent = await this.readFile(viewFilePath);
		const layoutName = this.extractLayout(viewContent);
		const { blocks, content: remainingView } = this.extractBlocks(viewContent);

		if (remainingView.trim() && !blocks.body) {
			blocks.body = remainingView;
		}

		let finalContent = layoutName ? await this.applyLayout(layoutName, blocks) : remainingView;

		finalContent = await this.processPartials(finalContent, data);
		finalContent = await this.processInclude(finalContent, path.dirname(viewFilePath), data);
		finalContent = this.processOperations(finalContent, data);
		finalContent = this.interpolateVariables(finalContent, data);
		finalContent = this.removeComments(finalContent);

		return finalContent;
	}

	public registerPlugin(name: string, fn: PluginFunction): void {
		this.plugins[name] = fn;
	}

	private async resolveViewPath(templateName: string): Promise<string> {
		if (this.viewsPath.includes("**")) {
			const globPattern = this.defaultViewName
				? path.join(this.viewsPath, templateName, `${this.defaultViewName}.html`)
				: path.join(this.viewsPath, `${templateName}.html`);

			const glob = new Glob(globPattern);
			const files = Array.from(glob.scanSync());

			if (files.length === 0) {
				throw new Error(`No files found for pattern: ${globPattern}`);
			}

			return files[0];
		}

		return this.defaultViewName
			? path.join(this.viewsPath, templateName, `${this.defaultViewName}.html`)
			: path.join(this.viewsPath, `${templateName}.html`);
	}

	private async readFile(filePath: string): Promise<string> {
		try {
			return await readFile(filePath, "utf-8");
		} catch (error) {
			throw new Error("Error reading file.");
		}
	}

	private extractLayout(content: string): string | null {
		const match = content.match(/{{=\s*layout\(["'](.+?)["']\)\s*}}/);

		return match ? match[1] : null;
	}

	private extractBlocks(content: string): { blocks: Blocks; content: string } {
		const blocks: Blocks = {};
		const blockRegex = /{{=\s*block\(["'](.+?)["']\)\s*}}([\s\S]*?){{=\s*endblock\s*}}/g;

		const remainingContent = content.replace(blockRegex, (_, blockName, blockContent) => {
			// if (blockContent.length > 10000) {
			// 	throw new Error("Conteúdo do bloco muito grande");
			// }

			blocks[blockName] = blockContent;
			return "";
		});

		return { blocks, content: remainingContent };
	}

	private async applyLayout(layoutName: string, blocks: Blocks): Promise<string> {
		const layoutContent = await this.readFile(join(this.layoutsPath, `${layoutName}.html`));

		return layoutContent.replace(
			/{{=\s*define\s+block\(["'](.+?)["']\)\s*}}/g,
			(_, blockName) => blocks[blockName] || "",
		);
	}

	private async processPartials(content: string, data: Data): Promise<string> {
		const partialRegex = /{{=\s*partials?\(["'](.+?)["'](?:,\s*(.+?))?\)\s*}}/g;
		const matches = [...content.matchAll(partialRegex)];

		for (const match of matches) {
			const partialName = match[1];
			const partialParams = match[2] ? this.evaluateExpression(match[2], data) : {};

			const partialContent = await this.readFile(join(this.partialsPath, `${partialName}.html`));
			const renderedPartial = this.interpolateVariables(partialContent, { ...data, ...partialParams });

			content = content.replace(match[0], renderedPartial);
		}

		return content;
	}

	private async processInclude(content: string, currentDir: string, data: Data): Promise<string> {
		const includeRegex = /{{=\s*include\(["'](.+?)["'](?:,\s*(.+?))?\)\s*}}/g;
		const matches = [...content.matchAll(includeRegex)];

		for (const match of matches) {
			const includePath = match[1];
			const includeParams = match[2] ? this.evaluateExpression(match[2], data) : {};

			const fullPath = join(currentDir, `${includePath}.html`);
			const includeContent = await this.readFile(fullPath);
			const renderedInclude = this.interpolateVariables(includeContent, { ...data, ...includeParams });

			content = content.replace(match[0], renderedInclude);
		}

		return content;
	}

	private processOperations(content: string, data: Data): string {
		content = this.extractVariables(content, data);
		content = this.processConditionals(content, data);
		content = this.processLoops(content, data);

		return content;
	}

	private extractVariables(content: string, data: Data): string {
		return content.replace(/{{~\s*var\s+(\w+)\s*=\s*(.+?)\s*}}/g, (_, varName, value) => {
			data[varName] = this.evaluateExpression(value, data);
			return "";
		});
	}

	private processConditionals(content: string, data: Data): string {
		return content.replace(
			/{{~\s*if\((.+?)\)\s*}}([\s\S]*?)({{~\s*else\s*}}([\s\S]*?))?{{~\s*endif\s*}}/g,
			(_, condition, ifBlock, elseBlock, elseContent) => {
				return this.evaluateExpression(condition, data) ? ifBlock : elseContent || "";
			},
		);
	}

	private processLoops(content: string, data: Data): string {
		return content.replace(
			/{{~\s*for\s+(?:\[(\w+),\s*(\w+)\]|(\w+))\s+in\s+(.+?)\s*}}([\s\S]*?){{~\s*endfor\s*}}/g,
			(_, keyName, valueName, itemName, listName, blockContent) => {
				const list = this.resolveVariable(listName, data) || [];

				if (keyName && valueName) {
					return Object.entries(list)
						.map(([key, value]) =>
							this.interpolateVariables(blockContent, { ...data, [keyName]: key, [valueName]: value }),
						)
						.join("");
				}

				return list.map((item: any) => this.interpolateVariables(blockContent, { ...data, [itemName]: item })).join("");
			},
		);
	}

	private interpolateVariables(content: string, data: Data): string {
		content = content.replace(/{{{\s*(.+?)\s*}}}/gs, (_, expression) => {
			return this.processExpression(expression, data, false);
		});

		content = content.replace(/{{\s*(.+?)\s*}}/gs, (_, expression) => {
			return this.processExpression(expression, data, true);
		});

		return content;
	}

	private processExpression(expression: string, data: Data, shouldEscape: boolean): string {
		expression = expression.trim();

		// 1. Check variable
		const variableValue = this.resolveVariable(expression, data);
		if (variableValue !== undefined && variableValue !== null) {
			return shouldEscape ? this.escapeHtml(variableValue) : variableValue;
		}

		// 2. Check plugin
		const pluginResult = this.callPlugin(expression, data);
		if (pluginResult !== undefined && pluginResult !== null) {
			return shouldEscape ? this.escapeHtml(pluginResult) : pluginResult;
		}

		// 3. Evaluates JS expression
		try {
			const evaluated = this.evaluateExpression(expression, data);
			if (evaluated !== undefined && evaluated !== null) {
				return shouldEscape ? this.escapeHtml(evaluated) : evaluated;
			}
		} catch {
			// If the expression fails, it returns an empty string.
		}

		return "";
	}

	private resolveVariable(varName: string, data: Data): any {
		return varName.split(".").reduce((acc, key) => acc?.[key], data);
	}

	private evaluateExpression(expression: string, data: Data): any {
		try {
			return new Function(...Object.keys(data), `return ${expression};`)(...Object.values(data));
		} catch {
			return null;
		}
	}

	private callPlugin(expression: string, data: Data): string | null {
		const match = expression.match(/^(\w+)\((.*?)\)$/);
		if (!match) return null;

		const [_, pluginName, argsString] = match;
		const args = argsString.split(",").map((arg) => this.resolveVariable(arg.trim(), data) ?? arg.trim());

		if (this.plugins[pluginName]) {
			return this.plugins[pluginName](...args);
		}

		return null;
	}

	private removeComments(content: string): string {
		return content.replace(/##.*$/gm, "");
	}

	private escapeHtml(unsafe: any): string {
		if (unsafe == null) return "";

		return String(unsafe)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;")
			.replace(/`/g, "&#96;")
			.replace(/=/g, "&#61;")
			.replace(/\//g, "&#47;");
	}
}
