import { readFileSync } from 'node:fs';
const auth = JSON.parse(readFileSync('C:/Users/HP/.config/configstore/firebase-tools.json', 'utf8'));
const token = auth.access_token;
const projectNumber = '873535945217';
const response = await fetch(`https://apikeys.googleapis.com/v2/projects/${projectNumber}/locations/global/keys`, {
  headers: { Authorization: `Bearer ${token}` }
});
console.log(response.status, await response.text());
