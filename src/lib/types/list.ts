export type ListData = Omit<List, ''>;

export class List {
	id: string;
	created: string;
	modified: string | null;
	name: string;

	constructor(data: ListData) {
		this.id = data.id;
		this.created = data.created;
		this.modified = data.modified;
		this.name = data.name;
	}
}
