import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Helmet } from "react-helmet-async";
import { DotsSixVerticalIcon } from "@phosphor-icons/react/dist/ssr/DotsSixVertical";
import { GearIcon } from "@phosphor-icons/react/dist/ssr/Gear";
import { LayoutIcon } from "@phosphor-icons/react/dist/ssr/Layout";
import { TextAaIcon } from "@phosphor-icons/react/dist/ssr/TextAa";
import { TranslateIcon } from "@phosphor-icons/react/dist/ssr/Translate";
import { SquaresFourIcon } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { RainierAiIcon } from "@/components/core/rainier-ai-icon";

import { appConfig } from "@/config/app";
import { AnimatedPage } from "@/components/core/animations";
import { useUserPreferences, AVAILABLE_LANGUAGES, DASHBOARD_WIDGETS } from "@/components/core/user-preferences-context";

const metadata = { title: `Preferences | Settings | Dashboard | ${appConfig.name}` };

const fontSizeOptions = [
	{ value: "small", label: "Small", description: "Compact text for more content on screen" },
	{ value: "medium", label: "Medium", description: "Default balanced size" },
	{ value: "large", label: "Large", description: "Easier to read" },
	{ value: "extra-large", label: "Extra Large", description: "Maximum readability" },
];

const densityOptions = [
	{ value: "compact", label: "Compact", description: "Less spacing, more content visible" },
	{ value: "standard", label: "Standard", description: "Default balanced layout" },
	{ value: "comfortable", label: "Comfortable", description: "More breathing room" },
];

const aiToneOptions = [
	{ value: "formal", label: "Formal", description: "Professional government contract language" },
	{ value: "neutral", label: "Neutral", description: "Clear and straightforward" },
	{ value: "simplified", label: "Simplified", description: "Plain language, easy to understand" },
];

function FontSizePreview({ fontSize }) {
	const scales = { small: "0.875rem", medium: "1rem", large: "1.125rem", "extra-large": "1.25rem" };
	return (
		<Box
			sx={{
				mt: 2,
				p: 2,
				borderRadius: 2,
				border: "1px solid var(--mui-palette-divider)",
				bgcolor: "var(--mui-palette-background-level1)",
			}}
		>
			<Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
				Preview
			</Typography>
			<Typography sx={{ fontSize: scales[fontSize], transition: "font-size 0.3s ease" }}>
				The quick brown fox jumps over the lazy dog. This is how your text will appear across the application.
			</Typography>
		</Box>
	);
}

function DashboardWidgetsSettings({ preferences, setPreference }) {
	const hiddenWidgets = preferences.dashboardHiddenWidgets || [];
	const widgetOrder = preferences.dashboardWidgetOrder || DASHBOARD_WIDGETS.map((w) => w.id);
	const [dragIdx, setDragIdx] = React.useState(null);
	const [dragOverIdx, setDragOverIdx] = React.useState(null);

	// Build ordered widget list
	const orderedWidgets = React.useMemo(() => {
		const ordered = [];
		widgetOrder.forEach((id) => {
			const w = DASHBOARD_WIDGETS.find((dw) => dw.id === id);
			if (w) ordered.push(w);
		});
		// Add any missing widgets at the end
		DASHBOARD_WIDGETS.forEach((w) => {
			if (!ordered.find((o) => o.id === w.id)) ordered.push(w);
		});
		return ordered;
	}, [widgetOrder]);

	function handleToggle(widgetId) {
		const updated = hiddenWidgets.includes(widgetId)
			? hiddenWidgets.filter((id) => id !== widgetId)
			: [...hiddenWidgets, widgetId];
		setPreference("dashboardHiddenWidgets", updated);
	}

	function handleDragStart(e, idx) {
		setDragIdx(idx);
		e.dataTransfer.effectAllowed = "move";
	}

	function handleDragOver(e, idx) {
		e.preventDefault();
		setDragOverIdx(idx);
	}

	function handleDrop(e, dropIdx) {
		e.preventDefault();
		if (dragIdx == null || dragIdx === dropIdx) {
			setDragIdx(null);
			setDragOverIdx(null);
			return;
		}
		const newOrder = orderedWidgets.map((w) => w.id);
		const [moved] = newOrder.splice(dragIdx, 1);
		newOrder.splice(dropIdx, 0, moved);
		setPreference("dashboardWidgetOrder", newOrder);
		setDragIdx(null);
		setDragOverIdx(null);
	}

	return (
		<Card>
			<CardHeader
				avatar={
					<Avatar>
						<LayoutIcon fontSize="var(--Icon-fontSize)" />
					</Avatar>
				}
				title="Dashboard Widgets"
				subheader="Toggle visibility and drag to reorder overview dashboard cards"
			/>
			<CardContent>
				<Card variant="outlined" sx={{ p: 0 }}>
					<Stack divider={<Divider />}>
						{orderedWidgets.map((widget, idx) => {
							const isHidden = hiddenWidgets.includes(widget.id);
							const isDragOver = dragOverIdx === idx && dragIdx !== idx;
							return (
								<Box
									key={widget.id}
									draggable
									onDragStart={(e) => handleDragStart(e, idx)}
									onDragOver={(e) => handleDragOver(e, idx)}
									onDrop={(e) => handleDrop(e, idx)}
									onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										px: 2,
										py: 1.5,
										transition: "background-color 0.15s, opacity 0.15s",
										"&:hover": { bgcolor: "var(--mui-palette-action-hover)" },
										...(dragIdx === idx && { opacity: 0.4 }),
										...(isDragOver && {
											borderTop: "2px solid",
											borderTopColor: "primary.main",
										}),
									}}
								>
									<Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: 1 }}>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												cursor: "grab",
												color: "text.disabled",
												"&:hover": { color: "text.secondary" },
											}}
										>
											<DotsSixVerticalIcon size={18} />
										</Box>
										<Box sx={{ flex: 1 }}>
											<Typography variant="body2" sx={{ ...(isHidden && { color: "text.disabled" }) }}>
												{widget.label}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{widget.description}
											</Typography>
										</Box>
									</Stack>
									<Switch
										checked={!isHidden}
										onChange={() => handleToggle(widget.id)}
										size="small"
									/>
								</Box>
							);
						})}
					</Stack>
				</Card>
			</CardContent>
		</Card>
	);
}

export function Page() {
	const { preferences, setPreference } = useUserPreferences();

	function handleLanguageToggle(code) {
		const current = preferences.translationLanguages || [];
		const updated = current.includes(code) ? current.filter((c) => c !== code) : [...current, code];
		setPreference("translationLanguages", updated);
	}

	return (
		<React.Fragment>
			<Helmet>
				<title>{metadata.title}</title>
			</Helmet>
			<AnimatedPage>
				<Stack spacing={4}>
					<div>
						<Typography variant="h4">Preferences</Typography>
					</div>
					<Stack spacing={4}>
						{/* Font Size */}
						<Card>
							<CardHeader
								avatar={
									<Avatar>
										<TextAaIcon fontSize="var(--Icon-fontSize)" />
									</Avatar>
								}
								title="Font Size"
								subheader="Adjust the text size across the entire application"
							/>
							<CardContent>
								<Card variant="outlined">
									<RadioGroup
										value={preferences.fontSize}
										onChange={(e) => setPreference("fontSize", e.target.value)}
										sx={{
											gap: 0,
											"& .MuiFormControlLabel-root": {
												justifyContent: "space-between",
												p: "8px 12px",
												"&:not(:last-of-type)": {
													borderBottom: "1px solid var(--mui-palette-divider)",
												},
											},
										}}
									>
										{fontSizeOptions.map((option) => (
											<FormControlLabel
												control={<Radio />}
												key={option.value}
												label={
													<div>
														<Typography variant="inherit">{option.label}</Typography>
														<Typography color="text.secondary" variant="caption">
															{option.description}
														</Typography>
													</div>
												}
												labelPlacement="start"
												value={option.value}
											/>
										))}
									</RadioGroup>
								</Card>
								<FontSizePreview fontSize={preferences.fontSize} />
							</CardContent>
						</Card>

						{/* Translation Languages */}
						<Card>
							<CardHeader
								avatar={
									<Avatar>
										<TranslateIcon fontSize="var(--Icon-fontSize)" />
									</Avatar>
								}
								title="Translation Languages"
								subheader="Select which languages appear in the RainierAI translation options"
							/>
							<CardContent>
								<Card variant="outlined" sx={{ p: 0 }}>
									<Stack divider={<Divider />}>
										{AVAILABLE_LANGUAGES.map((lang) => {
											const checked = (preferences.translationLanguages || []).includes(lang.code);
											return (
												<Box
													key={lang.code}
													sx={{
														display: "flex",
														alignItems: "center",
														justifyContent: "space-between",
														px: 2,
														py: 1,
														cursor: "pointer",
														"&:hover": { bgcolor: "var(--mui-palette-action-hover)" },
														transition: "background-color var(--cc-transition-fast)",
													}}
													onClick={() => handleLanguageToggle(lang.code)}
												>
													<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
														<Typography sx={{ fontSize: "1.25rem", lineHeight: 1 }}>
															{lang.flag}
														</Typography>
														<Typography variant="body2">{lang.label}</Typography>
													</Stack>
													<Checkbox checked={checked} tabIndex={-1} />
												</Box>
											);
										})}
									</Stack>
								</Card>
								{(preferences.translationLanguages || []).length > 0 && (
									<Box sx={{ mt: 2 }}>
										<Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
											Active languages
										</Typography>
										<Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
											{(preferences.translationLanguages || []).map((code) => {
												const lang = AVAILABLE_LANGUAGES.find((l) => l.code === code);
												return lang ? (
													<Chip
														key={code}
														label={`${lang.flag} ${lang.label}`}
														onDelete={() => handleLanguageToggle(code)}
														size="small"
													/>
												) : null;
											})}
										</Stack>
									</Box>
								)}
							</CardContent>
						</Card>

						{/* Display Density */}
						<Card>
							<CardHeader
								avatar={
									<Avatar>
										<SquaresFourIcon fontSize="var(--Icon-fontSize)" />
									</Avatar>
								}
								title="Display Density"
								subheader="Control the spacing and padding across the interface"
							/>
							<CardContent>
								<Card variant="outlined">
									<RadioGroup
										value={preferences.density}
										onChange={(e) => setPreference("density", e.target.value)}
										sx={{
											gap: 0,
											"& .MuiFormControlLabel-root": {
												justifyContent: "space-between",
												p: "8px 12px",
												"&:not(:last-of-type)": {
													borderBottom: "1px solid var(--mui-palette-divider)",
												},
											},
										}}
									>
										{densityOptions.map((option) => (
											<FormControlLabel
												control={<Radio />}
												key={option.value}
												label={
													<div>
														<Typography variant="inherit">{option.label}</Typography>
														<Typography color="text.secondary" variant="caption">
															{option.description}
														</Typography>
													</div>
												}
												labelPlacement="start"
												value={option.value}
											/>
										))}
									</RadioGroup>
								</Card>
							</CardContent>
						</Card>

						{/* Dashboard Widgets */}
						<DashboardWidgetsSettings preferences={preferences} setPreference={setPreference} />

						{/* RainierAI Assistant */}
						<Card>
							<CardHeader
								avatar={
									<Avatar>
										<RainierAiIcon sx={{ fontSize: "var(--Icon-fontSize)" }} />
									</Avatar>
								}
								title="RainierAI Assistant"
								subheader="Customize how the RainierAI assistant behaves"
							/>
							<CardContent>
								<Stack spacing={3}>
									<div>
										<Typography variant="subtitle2" sx={{ mb: 1 }}>
											Writing Tone
										</Typography>
										<Card variant="outlined">
											<RadioGroup
												value={preferences.aiTone}
												onChange={(e) => setPreference("aiTone", e.target.value)}
												sx={{
													gap: 0,
													"& .MuiFormControlLabel-root": {
														justifyContent: "space-between",
														p: "8px 12px",
														"&:not(:last-of-type)": {
															borderBottom: "1px solid var(--mui-palette-divider)",
														},
													},
												}}
											>
												{aiToneOptions.map((option) => (
													<FormControlLabel
														control={<Radio />}
														key={option.value}
														label={
															<div>
																<Typography variant="inherit">{option.label}</Typography>
																<Typography color="text.secondary" variant="caption">
																	{option.description}
																</Typography>
															</div>
														}
														labelPlacement="start"
														value={option.value}
													/>
												))}
											</RadioGroup>
										</Card>
									</div>
									<FormControlLabel
										control={
											<Switch
												checked={preferences.animationsEnabled}
												onChange={(e) => setPreference("animationsEnabled", e.target.checked)}
											/>
										}
										label={
											<div>
												<Typography variant="body2">Page Animations</Typography>
												<Typography color="text.secondary" variant="caption">
													Enable smooth page transitions and micro-interactions
												</Typography>
											</div>
										}
									/>
								</Stack>
							</CardContent>
						</Card>
					</Stack>
				</Stack>
			</AnimatedPage>
		</React.Fragment>
	);
}
