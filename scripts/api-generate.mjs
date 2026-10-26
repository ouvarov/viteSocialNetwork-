import { readFile, writeFile } from 'node:fs/promises';

import openapiTS, { COMMENT_HEADER, astToString } from 'openapi-typescript';
import ts from 'typescript';

const SPEC_PATH = 'src/api/generated/openapi.json';
const OUTPUT_PATH = 'src/api/generated/schema.ts';

const BLOB = ts.factory.createTypeReferenceNode('Blob');

const spec = JSON.parse(await readFile(SPEC_PATH, 'utf8'));

const ast = await openapiTS(spec, {
  transform: (schemaObject) =>
    schemaObject.format === 'binary' ? BLOB : undefined,
});

await writeFile(OUTPUT_PATH, COMMENT_HEADER + astToString(ast));
process.stdout.write(`Generated ${OUTPUT_PATH}\n`);
