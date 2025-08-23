// ABOUTME: This plugin adds UUID primary key support to Dexie using crypto.randomUUID()
// ABOUTME: Allows using $$ prefix in schema to auto-generate UUID primary keys
// SOURCE: [Using UUID primary keys in Dexie](https://www.sabatino.dev/using-uuid-primary-keys-in-dexie/)

/* eslint-disable @typescript-eslint/no-unsafe-function-type, @typescript-eslint/no-explicit-any */

import Dexie from 'dexie';

/**
 * DexieUUIDPrimaryKey plugin
 * Enables UUID primary keys in Dexie by using the $$ prefix in schema definition
 * Uses crypto.randomUUID() for secure UUID generation
 */
function DexieUUIDPrimaryKey(db: Dexie) {
	// Override the _parseStoresSpec method with our own implementation
	db.Version.prototype._parseStoresSpec = Dexie.override(
		db.Version.prototype._parseStoresSpec,
		overrideParseStoresSpec
	);
	// Override the open method with our own implementation
	db.open = Dexie.override(db.open, prepareOverrideOpen(db));
}

/**
 * This function overrides the parseStoresSpec method of Dexie to allow for UUID primary keys.
 */
function overrideParseStoresSpec(origFunc: Function) {
	return function (this: any, stores: any, dbSchema: any) {
		origFunc.call(this, stores, dbSchema);
		Object.keys(dbSchema).forEach((tableName) => {
			const schema = dbSchema[tableName];
			if (schema.primKey.name.indexOf('$$') === 0) {
				schema.primKey.uuid = true;
				schema.primKey.name = schema.primKey.name.substr(2);
				schema.primKey.keyPath = schema.primKey.keyPath.substr(2);
			}
		});
	};
}

/**
 * This function prepares the hook that will trigger on creation of a new record
 */
function initCreatingHook(table: any) {
	return function creatingHook(primKey: any, obj: any) {
		let rv;
		if (primKey === undefined && table.schema.primKey.uuid) {
			primKey = rv = crypto.randomUUID();
			if (table.schema.primKey.keyPath) {
				Dexie.setByKeyPath(obj, table.schema.primKey.keyPath, primKey);
			}
		}
		return rv;
	};
}

/**
 * This function prepares the hook that will trigger on opening the database
 * and will loop through all tables to add the creating hook.
 */
function prepareOverrideOpen(db: Dexie) {
	return function overrideOpen(origOpen: Function) {
		return function (this: any, ...args: any[]) {
			Object.keys(db._allTables).forEach((tableName) => {
				const table = db._allTables[tableName];
				table.hook('creating').subscribe(initCreatingHook(table));
			});
			return origOpen.apply(this, args);
		};
	};
}

// Register addon
Dexie.addons.push(DexieUUIDPrimaryKey);

export default DexieUUIDPrimaryKey;
