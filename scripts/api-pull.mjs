import { readFile, writeFile } from 'node:fs/promises';

const DEFAULT_SOURCE =
  'https://raw.githubusercontent.com/ouvarov/nestSocialNetwork/main/openapi.json';
const OUTPUT_PATH = 'src/api/generated/openapi.json';

const source = process.env.OPENAPI_SOURCE ?? DEFAULT_SOURCE;

const readSpec = async () => {
  if (!/^https?:\/\//.test(source)) return readFile(source, 'utf8');

  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`${source} responded with ${response.status}`);
  }

  return response.text();
};

const spec = JSON.parse(await readSpec());

await writeFile(OUTPUT_PATH, `${JSON.stringify(spec, null, 2)}\n`);
process.stdout.write(`Pulled ${source} -> ${OUTPUT_PATH}\n`);
