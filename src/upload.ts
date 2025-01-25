import fs from "node:fs/promises";
import path from "node:path";

type UploadedFile = {
	fieldName: string;
	fileName: string;
	size: number;
	filePath: string;
};

type UploadOptions = {
	allowedTypes?: string[];
	maxSize?: number;
	allowedExtensions?: string[];
};

export class Upload {
	private fieldName: string;
	private isMultiple: boolean;
	private folderPath: string;
	private options: UploadOptions;

	constructor(folderPath?: string, options?: UploadOptions) {
		this.fieldName = "file";
		this.isMultiple = false;
		this.folderPath = folderPath || "uploads";
		this.options = options || {};
	}

	public single(fieldName: string) {
		this.fieldName = fieldName;
		this.isMultiple = false;
		return this.handleUpload.bind(this);
	}

	public array(fieldName: string) {
		this.fieldName = fieldName;
		this.isMultiple = true;
		return this.handleUpload.bind(this);
	}

	private async handleUpload(req: Request): Promise<UploadedFile | UploadedFile[]> {
		if (!req.headers.get("content-type")?.includes("multipart/form-data")) {
			throw new Error("Invalid content type. Expected multipart/form-data.");
		}

		const formData = await req.formData();
		const uploadFolder = path.join(process.cwd(), this.folderPath);
		await fs.mkdir(uploadFolder, { recursive: true });

		if (this.isMultiple) {
			return this.handleMultipleUpload(formData, uploadFolder);
		}

		return this.handleSingleUpload(formData, uploadFolder);
	}

	private async handleSingleUpload(formData: FormData, uploadFolder: string): Promise<UploadedFile> {
		const file = formData.get(this.fieldName);

		if (!(file instanceof File)) {
			throw new Error("No file found in the form data.");
		}

		this.validateFile(file);

		const fileName = `${Date.now()}-${file.name}`;
		const filePath = path.join(uploadFolder, fileName);

		await Bun.write(filePath, file);

		return {
			fieldName: this.fieldName,
			fileName,
			size: file.size,
			filePath,
		};
	}

	private async handleMultipleUpload(formData: FormData, uploadFolder: string): Promise<UploadedFile[]> {
		const files = formData.getAll(this.fieldName);
		const uploadedFiles: UploadedFile[] = [];

		for (const file of files) {
			if (file instanceof File) {
				this.validateFile(file);

				const fileName = `${Date.now()}-${file.name}`;
				const filePath = path.join(uploadFolder, fileName);

				await Bun.write(filePath, file);

				uploadedFiles.push({
					fieldName: this.fieldName,
					fileName,
					size: file.size,
					filePath,
				});
			}
		}

		if (uploadedFiles.length === 0) {
			throw new Error("No valid files found in the form data.");
		}

		return uploadedFiles;
	}

	private validateFile(file: File): void {
		if (this.options.allowedTypes && !this.options.allowedTypes.includes(file.type)) {
			throw new Error(`File type "${file.type}" is not allowed.`);
		}

		if (this.options.maxSize && file.size > this.options.maxSize) {
			throw new Error(`File size exceeds the maximum allowed size of ${this.options.maxSize} bytes.`);
		}

		if (this.options.allowedExtensions) {
			const fileExtension = path.extname(file.name).toLowerCase();
			if (!this.options.allowedExtensions.includes(fileExtension)) {
				throw new Error(`File extension "${fileExtension}" is not allowed.`);
			}
		}
	}
}
