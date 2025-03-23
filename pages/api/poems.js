import fs from 'fs';
import path from 'path';
import { parsePoems } from '../../lib/parsePoems';

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'poems.txt');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const poems = parsePoems(fileContents);
    
    res.status(200).json(poems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load poems' });
  }
}