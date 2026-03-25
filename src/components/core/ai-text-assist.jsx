import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { TextAaIcon } from "@phosphor-icons/react/dist/ssr/TextAa";
import { TextAlignLeftIcon } from "@phosphor-icons/react/dist/ssr/TextAlignLeft";
import { TranslateIcon } from "@phosphor-icons/react/dist/ssr/Translate";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { AiIcon } from "@/components/core/rainier-ai-icon";

import { enhanceText, BASE_AI_ACTIONS } from "@/api/azure-openai";
import { useUserPreferences, AVAILABLE_LANGUAGES } from "@/components/core/user-preferences-context";

const iconMap = {
	PencilSimple: PencilSimpleIcon,
	SpellCheck: TextAaIcon,
	TextAlignLeft: TextAlignLeftIcon,
	Translate: TranslateIcon,
};

function useAiActions() {
	const { preferences } = useUserPreferences();
	const languages = preferences.translationLanguages || [];

	return React.useMemo(() => {
		const translateActions = languages.map((code) => {
			const lang = AVAILABLE_LANGUAGES.find((l) => l.code === code);
			return {
				key: `translate_${code}`,
				label: lang ? lang.label : code,
				icon: "Translate",
				languageLabel: lang?.label || code,
			};
		});
		return [...BASE_AI_ACTIONS, ...translateActions];
	}, [languages]);
}

export function AiTextAssist({ text, onAccept }) {
	const { preferences } = useUserPreferences();
	const actions = useAiActions();
	const [loading, setLoading] = React.useState(false);
	const [suggestion, setSuggestion] = React.useState(null);
	const [activeAction, setActiveAction] = React.useState(null);
	const [error, setError] = React.useState(null);

	async function handleAction(action) {
		if (!text?.trim()) return;

		setLoading(true);
		setError(null);
		setSuggestion(null);
		setActiveAction(action.key);

		try {
			const result = await enhanceText(text, action.key, {
				tone: preferences.aiTone || "formal",
				languageLabel: action.languageLabel,
			});
			setSuggestion(result);
		} catch (err) {
			setError(err.message || "Failed to process text");
		} finally {
			setLoading(false);
		}
	}

	function handleAccept() {
		if (suggestion && onAccept) {
			onAccept(suggestion);
		}
		setSuggestion(null);
		setActiveAction(null);
	}

	function handleDiscard() {
		setSuggestion(null);
		setActiveAction(null);
		setError(null);
	}

	const hasText = text?.trim()?.length > 0;

	return (
		<Box sx={{ mt: 1 }}>
			<Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
				<AiIcon sx={{ fontSize: "var(--icon-fontSize-sm)", color: "var(--mui-palette-primary-main)" }} />
				<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 0.5 }}>
					AI Assistant
				</Typography>
				{actions.map((action) => {
					const Icon = iconMap[action.icon];
					return (
						<Chip
							key={action.key}
							label={action.label}
							icon={Icon ? <Icon fontSize="var(--icon-fontSize-sm)" /> : undefined}
							size="small"
							variant={activeAction === action.key ? "filled" : "outlined"}
							color={activeAction === action.key ? "primary" : "default"}
							onClick={() => handleAction(action)}
							disabled={!hasText || loading}
							sx={{ cursor: "pointer" }}
						/>
					);
				})}
			</Stack>

			{loading ? (
				<Box sx={{ mt: 1.5 }}>
					<LinearProgress sx={{ borderRadius: 1 }} />
					<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
						AI Assistant is processing...
					</Typography>
				</Box>
			) : null}

			{error ? (
				<Box
					sx={{
						mt: 1.5,
						p: 1.5,
						borderRadius: 2,
						bgcolor: "var(--mui-palette-error-50, rgba(207, 76, 58, 0.08))",
						border: "1px solid var(--mui-palette-error-200, rgba(207, 76, 58, 0.2))",
					}}
				>
					<Typography variant="body2" color="error.main">
						{error}
					</Typography>
					<Button size="small" onClick={handleDiscard} sx={{ mt: 0.5 }}>
						Dismiss
					</Button>
				</Box>
			) : null}

			<Collapse in={Boolean(suggestion)} unmountOnExit>
				<Box
					sx={{
						mt: 1.5,
						p: 2,
						borderRadius: 2,
						bgcolor: "var(--mui-palette-primary-50, rgba(38, 105, 179, 0.06))",
						border: "1px solid var(--mui-palette-primary-200, rgba(38, 105, 179, 0.2))",
					}}
				>
					<Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
						<AiIcon sx={{ fontSize: "var(--icon-fontSize-sm)", color: "var(--mui-palette-primary-main)" }} />
						<Typography variant="subtitle2" color="primary.main">
							{actions.find((a) => a.key === activeAction)?.label || "Suggestion"}
						</Typography>
					</Stack>
					<Typography
						variant="body2"
						sx={{
							whiteSpace: "pre-wrap",
							bgcolor: "var(--mui-palette-background-paper)",
							p: 1.5,
							borderRadius: 1,
							border: "1px solid var(--mui-palette-divider)",
							maxHeight: 240,
							overflowY: "auto",
						}}
					>
						{suggestion}
					</Typography>
					<Stack direction="row" spacing={1} sx={{ mt: 1.5, justifyContent: "flex-end" }}>
						<Button
							size="small"
							color="secondary"
							startIcon={<XIcon fontSize="var(--icon-fontSize-sm)" />}
							onClick={handleDiscard}
						>
							Discard
						</Button>
						<Button
							size="small"
							variant="contained"
							startIcon={<CheckIcon fontSize="var(--icon-fontSize-sm)" />}
							onClick={handleAccept}
						>
							Accept
						</Button>
					</Stack>
				</Box>
			</Collapse>
		</Box>
	);
}
