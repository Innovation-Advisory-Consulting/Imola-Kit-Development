"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { FileTextIcon } from "@phosphor-icons/react/dist/ssr/FileText";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/ssr/ClipboardText";
import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr/Buildings";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { useNavigate } from "react-router-dom";

import { paths } from "@/paths";
import { useSalesforceClient } from "@/hooks/use-salesforce";
import { Tip } from "@/components/core/tip";

function categorize(data) {
	return {
		Contracts: data.contracts || [],
		"Task Orders": data.taskOrders || [],
		Vendors: data.accounts || [],
		Contacts: data.contacts || [],
	};
}

const groupIcons = {
	Contracts: FileTextIcon,
	"Task Orders": ClipboardTextIcon,
	Vendors: BuildingsIcon,
	Contacts: UserIcon,
};

const groupColors = {
	Contracts: "primary",
	"Task Orders": "info",
	Vendors: "warning",
	Contacts: "success",
};

function getHref(type, record) {
	if (type === "Contracts") return paths.dashboard.contracts.details(record.Id);
	if (type === "Task Orders") return paths.dashboard.taskOrders.details(record.Id);
	if (type === "Vendors") return paths.dashboard.customers.details(record.Id);
	if (type === "Contacts") return paths.dashboard.customers.details(record.AccountId || record.Id);
	return "#";
}

function getTitle(type, record) {
	if (type === "Contracts") return `${record.Name} — ${record.cux_Title__c || "Untitled"}`;
	if (type === "Task Orders") return `${record.Name} — ${record.cux_Scope_Summary__c || "Untitled"}`;
	if (type === "Vendors") return record.Name;
	if (type === "Contacts") return `${record.FirstName || ""} ${record.LastName || ""}`.trim();
	return record.Name || record.Id;
}

function getSubtitle(type, record) {
	if (type === "Contracts") return [record.cux_Contract_Type__c, record.cux_Status__c || "Draft"].filter(Boolean).join(" · ");
	if (type === "Task Orders") return [record.cux_Task_Order_Type__c, record.cux_Status__c || "Draft"].filter(Boolean).join(" · ");
	if (type === "Vendors") {
		const parts = [record.BillingCity, record.BillingState].filter(Boolean);
		return parts.length ? parts.join(", ") : record.Phone || "";
	}
	if (type === "Contacts") {
		return [record.Title, record.Account?.Name].filter(Boolean).join(" · ") || record.Email || "";
	}
	return "";
}

export function SearchDialog({ onClose, open = false }) {
	const [value, setValue] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [results, setResults] = React.useState(null);
	const [error, setError] = React.useState(null);
	const client = useSalesforceClient();
	const navigate = useNavigate();

	React.useEffect(() => {
		if (!open) {
			setValue("");
			setResults(null);
			setError(null);
		}
	}, [open]);

	const handleSubmit = React.useCallback(
		async (event) => {
			event.preventDefault();
			const term = value.trim();
			if (!term || term.length < 2 || !client) return;

			setResults(null);
			setError(null);
			setIsLoading(true);
			try {
				const records = await client.search(term);
				setResults(categorize(records));
			} catch (err) {
				setError(err.response?.data?.[0]?.message || err.message);
			} finally {
				setIsLoading(false);
			}
		},
		[value, client]
	);

	function handleNavigate(type, record) {
		onClose();
		navigate(getHref(type, record));
	}

	const totalResults = results ? Object.values(results).reduce((sum, arr) => sum + arr.length, 0) : 0;

	return (
		<Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
			<Stack direction="row" spacing={3} sx={{ alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
				<Typography variant="h6">Search</Typography>
				<IconButton onClick={onClose}>
					<XIcon />
				</IconButton>
			</Stack>
			<DialogContent sx={{ pt: 0 }}>
				<Stack spacing={2}>
					<form onSubmit={handleSubmit}>
						<OutlinedInput
							autoFocus
							fullWidth
							onChange={(event) => setValue(event.target.value)}
							placeholder="Search contracts, task orders, vendors, contacts..."
							startAdornment={
								<InputAdornment position="start">
									<MagnifyingGlassIcon />
								</InputAdornment>
							}
							value={value}
						/>
					</form>

					{isLoading ? (
						<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
							<CircularProgress />
						</Box>
					) : null}

					{error ? (
						<Typography color="error" variant="body2">{error}</Typography>
					) : null}

					{results && !isLoading ? (
						totalResults === 0 ? (
							<Box sx={{ py: 3, textAlign: "center" }}>
								<Typography color="text.secondary" variant="body2">
									No results found for &ldquo;{value}&rdquo;
								</Typography>
							</Box>
						) : (
							<Stack spacing={2}>
								{Object.entries(results).map(([group, records]) => {
									if (!records.length) return null;
									const Icon = groupIcons[group];
									const color = groupColors[group];
									return (
										<Stack key={group} spacing={0.5}>
											<Stack direction="row" spacing={1} sx={{ alignItems: "center", px: 1 }}>
												<Typography variant="overline" color="text.secondary">{group}</Typography>
												<Chip label={records.length} size="small" variant="soft" color={color} />
											</Stack>
											<List disablePadding sx={{ border: "1px solid var(--mui-palette-divider)", borderRadius: 1 }}>
												{records.map((record, idx) => (
													<React.Fragment key={record.Id}>
														{idx > 0 ? <Divider /> : null}
														<ListItemButton onClick={() => handleNavigate(group, record)} sx={{ py: 1 }}>
															<ListItemAvatar sx={{ minWidth: 40 }}>
																<Avatar
																	sx={{
																		bgcolor: `var(--mui-palette-${color}-50)`,
																		color: `var(--mui-palette-${color}-main)`,
																		width: 32,
																		height: 32,
																	}}
																>
																	<Icon fontSize="var(--icon-fontSize-sm)" />
																</Avatar>
															</ListItemAvatar>
															<ListItemText
																primary={getTitle(group, record)}
																secondary={getSubtitle(group, record)}
																primaryTypographyProps={{ variant: "subtitle2", noWrap: true }}
																secondaryTypographyProps={{ variant: "caption", noWrap: true }}
															/>
														</ListItemButton>
													</React.Fragment>
												))}
											</List>
										</Stack>
									);
								})}
								<Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
									{totalResults} result{totalResults !== 1 ? "s" : ""} found
								</Typography>
							</Stack>
						)
					) : null}

					{!results && !isLoading && !error ? (
						<Tip message="Search by entering a keyword and pressing Enter" />
					) : null}
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
