/**
 * Get OpenAI API key: prefer dialog key (localStorage / #openai_key_risky_but_cool),
 * then REACT_APP_OPENAI_API_KEY from env.
 */
export function getOpenAIApiKey(): string | undefined {
	if (typeof window === 'undefined') return process.env.REACT_APP_OPENAI_API_KEY;
	const stored = localStorage.getItem('openai_key_risky_but_cool');
	const input = (document.getElementById('openai_key_risky_but_cool') as HTMLInputElement | null)?.value;
	const key = (stored || input || '').trim();
	return key || process.env.REACT_APP_OPENAI_API_KEY || undefined;
}
