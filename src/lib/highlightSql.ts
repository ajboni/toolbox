import { highlightCode } from './highlight';
import 'prismjs/components/prism-sql';

export function highlightSql(code: string): string {
  return highlightCode(code, 'sql');
}
