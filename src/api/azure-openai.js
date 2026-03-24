import axios from "axios";

const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
const deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
const apiVersion = "2024-06-01";

const TONE_INSTRUCTIONS = {
	formal: "Use formal tone appropriate for government contract documents.",
	neutral: "Use a clear, straightforward professional tone.",
	simplified: "Use plain language that is easy to understand. Avoid jargon.",
};

function getSystemPrompts(tone = "formal") {
	const toneText = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.formal;

	return {
		improve: `You are a professional writing assistant for government contract documents.
Improve the provided text to be more clear, professional, and well-structured.
Maintain the same meaning and key details. ${toneText}
Return ONLY the improved text as plain text. Do NOT use markdown formatting (no headers, bold, bullets, or other markup).`,

		grammar: `You are a proofreading assistant.
Fix all spelling, grammar, and punctuation errors in the provided text.
Do not change the meaning, tone, or structure — only correct errors.
Return ONLY the corrected text as plain text. Do NOT use markdown formatting.`,

		concise: `You are an editing assistant for government contracts.
Make the provided text more concise and to the point while preserving all essential information.
Remove redundancy, filler words, and unnecessary elaboration.
Return ONLY the concise version as plain text. Do NOT use markdown formatting.`,
	};
}

function getTranslatePrompt(languageLabel) {
	return `You are a professional translator.
Translate the provided text into ${languageLabel}. Maintain the formal tone appropriate for contract documents.
Return ONLY the translated text, no explanations.`;
}

export async function enhanceText(text, action = "improve", options = {}) {
	if (!endpoint || !apiKey) {
		throw new Error("Azure OpenAI is not configured. Set VITE_AZURE_OPENAI_ENDPOINT and VITE_AZURE_OPENAI_API_KEY.");
	}

	const tone = options.tone || "formal";
	const prompts = getSystemPrompts(tone);
	let systemPrompt;

	if (options._systemPrompt) {
		systemPrompt = options._systemPrompt;
	} else if (action.startsWith("translate_")) {
		const langLabel = options.languageLabel || action.replace("translate_", "");
		systemPrompt = getTranslatePrompt(langLabel);
	} else {
		systemPrompt = prompts[action];
	}

	if (!systemPrompt) {
		throw new Error(`Unknown action: ${action}`);
	}

	const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

	const response = await axios.post(
		url,
		{
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: text },
			],
			max_tokens: 2000,
			temperature: action.startsWith("translate") ? 0.3 : 0.7,
		},
		{
			headers: {
				"api-key": apiKey,
				"Content-Type": "application/json",
			},
		}
	);

	return response.data.choices[0].message.content.trim();
}

export const BASE_AI_ACTIONS = [
	{ key: "improve", label: "Improve Writing", icon: "PencilSimple" },
	{ key: "grammar", label: "Fix Grammar", icon: "SpellCheck" },
	{ key: "concise", label: "Make Concise", icon: "TextAlignLeft" },
];
