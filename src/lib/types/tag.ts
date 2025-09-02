export type TagData = Omit<Tag, 'isRoot' | 'getDisplayName'>;

export class Tag {
	readonly id: string;
	readonly parentId: string | null;
	readonly name: string;
	readonly order: number;

	constructor(data: TagData) {
		this.id = data.id;
		this.parentId = data.parentId;
		this.name = data.name;
		this.order = data.order;
	}

	isRoot(): boolean {
		return this.parentId === null;
	}

	getDisplayName(): string {
		return this.name;
	}
}
