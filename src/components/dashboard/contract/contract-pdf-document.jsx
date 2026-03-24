"use client";

import * as React from "react";
import { Document, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";

import { dayjs } from "@/lib/dayjs";

function fmt(value) {
	if (value == null) return "$0.00";
	return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);
}

function fmtDate(value) {
	if (!value) return "_______________";
	return dayjs(value).format("MMMM D, YYYY");
}

const s = StyleSheet.create({
	page: {
		backgroundColor: "#FFFFFF",
		paddingTop: 50,
		paddingBottom: 60,
		paddingHorizontal: 60,
		fontFamily: "Helvetica",
		fontSize: 10,
		lineHeight: 1.6,
		color: "#1a1a1a",
	},

	// ── Header / Letterhead ──
	letterhead: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 8,
	},
	orgBlock: { maxWidth: "60%" },
	orgName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1a3a5c", marginBottom: 2 },
	orgTagline: { fontSize: 8, color: "#666666", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 },
	logo: { width: 80, height: 72 },

	// ── Title Block ──
	titleBlock: {
		borderTopWidth: 2,
		borderTopColor: "#1a3a5c",
		borderBottomWidth: 1,
		borderBottomColor: "#cccccc",
		paddingVertical: 12,
		marginBottom: 20,
		alignItems: "center",
	},
	titleMain: { fontSize: 14, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 2, color: "#1a3a5c" },
	titleSub: { fontSize: 10, color: "#444444", marginTop: 2 },

	// ── Section headers ──
	sectionHeader: {
		fontSize: 10,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		letterSpacing: 1,
		color: "#1a3a5c",
		borderBottomWidth: 1,
		borderBottomColor: "#1a3a5c",
		paddingBottom: 3,
		marginTop: 18,
		marginBottom: 8,
	},

	// ── Key-value rows ──
	row: { flexDirection: "row", marginBottom: 2 },
	label: { width: 160, fontFamily: "Helvetica-Bold", fontSize: 9, color: "#444444" },
	value: { flex: 1, fontSize: 10 },

	// ── Parties ──
	partiesRow: { flexDirection: "row", gap: 20, marginBottom: 4 },
	partyCol: { flex: 1 },
	partyRole: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, color: "#1a3a5c", marginBottom: 4 },
	partyName: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 1 },
	partyDetail: { fontSize: 9, color: "#333333" },

	// ── Table ──
	table: { marginTop: 4 },
	tableHeaderRow: {
		flexDirection: "row",
		borderBottomWidth: 1.5,
		borderBottomColor: "#1a3a5c",
		paddingBottom: 3,
		marginBottom: 2,
	},
	tableRow: {
		flexDirection: "row",
		borderBottomWidth: 0.5,
		borderBottomColor: "#dddddd",
		paddingVertical: 3,
	},
	colFund: { width: "28%" },
	colCode: { width: "14%" },
	colType: { width: "14%" },
	colAmt: { width: "14.66%", textAlign: "right" },
	tableHeaderText: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, color: "#444444" },
	tableCellText: { fontSize: 9 },

	// ── Narrative ──
	narrative: { fontSize: 10, lineHeight: 1.7, textAlign: "justify" },

	// ── Signature block ──
	sigSection: { marginTop: 30 },
	sigRow: { flexDirection: "row", gap: 40 },
	sigBlock: { flex: 1, marginTop: 16 },
	sigLine: { borderBottomWidth: 1, borderBottomColor: "#333333", marginBottom: 4, height: 40 },
	sigLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#333333" },
	sigSublabel: { fontSize: 8, color: "#666666", marginTop: 1 },
	sigDateRow: { flexDirection: "row", marginTop: 12 },
	sigDateLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", width: 40, color: "#333333" },
	sigDateLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: "#333333" },

	// ── Footer ──
	footer: {
		position: "absolute",
		bottom: 24,
		left: 60,
		right: 60,
		flexDirection: "row",
		justifyContent: "space-between",
		borderTopWidth: 0.5,
		borderTopColor: "#cccccc",
		paddingTop: 6,
	},
	footerText: { fontSize: 7, color: "#999999" },

	// ── Utilities ──
	bold: { fontFamily: "Helvetica-Bold" },
	italic: { fontFamily: "Helvetica-Oblique" },
	center: { textAlign: "center" },
	mb4: { marginBottom: 4 },
	mb8: { marginBottom: 8 },
	mb12: { marginBottom: 12 },
});

export function ContractPDFDocument({ contract, funding = [] }) {
	if (!contract) return null;

	const vendorName = contract.cux_Account__r?.Name || "___________________________";
	const contactName = contract.cux_Vendor_Contact__r?.Name || "___________________________";
	const contactTitle = contract.cux_Vendor_Contact__r?.Title || "";
	const contactEmail = contract.cux_Vendor_Contact__r?.Email || "";
	const managerName = contract.cux_Contract_Manager__r?.Name || "___________________________";
	const managerEmail = contract.cux_Contract_Manager__r?.Email || "";

	return (
		<Document>
			<Page size="LETTER" style={s.page}>
				{/* ═══ LETTERHEAD ═══ */}
				<View style={s.letterhead}>
					<View style={s.orgBlock}>
						<Text style={s.orgName}>CloudCoro</Text>
						<Text style={s.orgTagline}>Contract Management System</Text>
					</View>
					<Svg viewBox="0 0 10.5 9" style={s.logo}>
						<Path fill="#2669b3" d="M 2.5613 0.0058 C 2.5292 0.0058 2.4853 0.0221 2.4597 0.0448 L 0.7253 1.5800 C 0.6924 1.6092 0.6745 1.6512 0.6745 1.6952 L 0.6745 5.9433 L 0.2312 5.6913 C 0.1034 5.6478 0.0260 5.6934 0.0007 5.8261 L 0.0007 6.8749 C -0.0003 6.9473 0.0500 7.0120 0.1218 7.0273 L 0.9968 7.2148 C 1.0516 7.2265 1.1093 7.2062 1.1452 7.1640 L 1.7195 6.5195 C 1.7384 6.4983 1.7515 6.4731 1.7566 6.4452 L 2.2312 3.8046 L 3.4499 4.3905 L 3.4499 8.8007 C 3.4499 8.8852 3.5181 8.9530 3.6023 8.9530 L 4.7019 8.9530 C 4.7624 8.9530 4.8157 8.9184 4.8405 8.8632 L 5.4284 7.5605 L 7.1120 6.2343 L 8.8679 8.8827 C 8.8957 8.9260 8.9442 8.9530 8.9968 8.9530 L 10.3445 8.9530 C 10.4294 8.9530 10.4988 8.8857 10.4988 8.8007 L 10.4988 7.9042 C 10.4988 7.7054 10.1902 7.7054 10.1902 7.9042 L 10.1902 8.6464 L 9.2077 8.6464 L 10.1902 5.5898 L 10.1902 7.1054 C 10.1902 7.1903 10.2596 7.2577 10.3445 7.2577 C 10.4294 7.2577 10.4988 7.1904 10.4988 7.1054 L 10.4988 4.6093 C 10.4988 4.5859 10.4941 4.5621 10.4831 4.5409 L 9.4773 2.4335 C 9.4607 2.3987 9.4311 2.3716 9.3952 2.3573 L 7.0202 1.4042 L 6.5456 0.1073 C 6.5234 0.0467 6.4656 0.0058 6.4011 0.0058 L 2.5613 0.0058 z M 2.7917 0.3144 L 6.2937 0.3144 L 6.9538 2.1132 L 4.4948 4.4296 L 3.3405 1.6386 C 3.2645 1.4549 2.9793 1.5721 3.0554 1.7558 L 4.1433 4.3827 L 0.9812 2.8612 L 0.9812 1.7655 L 2.5027 0.4179 L 2.7429 1.0019 C 2.8189 1.1856 3.1041 1.0684 3.0280 0.8847 L 2.7917 0.3144 z M 7.1628 1.7909 L 9.2253 2.6191 L 10.1804 4.6210 L 8.9499 8.4491 L 6.1120 4.1679 L 6.1120 3.3300 L 7.2370 2.2675 C 7.2817 2.2253 7.2972 2.1592 7.2761 2.1015 L 7.1628 1.7909 z M 0.9812 3.2030 L 1.4890 3.4472 L 0.9812 5.1698 L 0.9812 3.2030 z M 1.7683 3.5820 L 1.9421 3.6659 L 1.4597 6.3476 L 1.1081 6.7421 L 0.9870 6.2441 L 1.7683 3.5820 z M 5.8034 3.6191 L 5.8034 4.1015 L 5.0339 4.3456 L 5.8034 3.6191 z M 5.8933 4.3964 L 6.9421 5.9784 L 3.7566 8.4843 L 3.7566 4.5370 L 4.3698 4.8320 C 4.4065 4.8505 4.4500 4.8533 4.4890 4.8398 L 5.8933 4.3964 z M 0.3093 6.0898 L 0.5769 6.2421 L 0.3093 6.5077 L 0.3093 6.0898 z M 0.7370 6.5155 L 0.8210 6.8612 L 0.4636 6.7851 L 0.7370 6.5155 z M 4.9070 7.9706 L 4.6023 8.6464 L 4.0476 8.6464 L 4.9070 7.9706 z" />
					</Svg>
				</View>

				{/* ═══ TITLE ═══ */}
				<View style={s.titleBlock}>
					<Text style={s.titleMain}>
						{contract.cux_Contract_Type__c || "Service"} Agreement
					</Text>
					<Text style={s.titleSub}>
						Contract No. {contract.Name}
					</Text>
				</View>

				{/* ═══ PREAMBLE ═══ */}
				<Text style={[s.narrative, s.mb12]}>
					This {contract.cux_Contract_Type__c || "Service"} Agreement (the "Agreement"), effective as of{" "}
					<Text style={s.bold}>{fmtDate(contract.cux_Start_Date__c)}</Text>, is entered into by and between{" "}
					<Text style={s.bold}>{vendorName}</Text> (the "Contractor") and the procuring entity represented herein
					(the "Agency"), collectively referred to as the "Parties."
				</Text>

				{/* ═══ CONTRACT DETAILS ═══ */}
				<Text style={s.sectionHeader}>Article I — Contract Details</Text>
				<View style={s.row}>
					<Text style={s.label}>Contract Number:</Text>
					<Text style={s.value}>{contract.Name}</Text>
				</View>
				<View style={s.row}>
					<Text style={s.label}>Contract Type:</Text>
					<Text style={s.value}>{contract.cux_Contract_Type__c || "—"}</Text>
				</View>
				{contract.cux_Contract_Classification__c ? (
					<View style={s.row}>
						<Text style={s.label}>Classification:</Text>
						<Text style={s.value}>{contract.cux_Contract_Classification__c}</Text>
					</View>
				) : null}
				{contract.cux_Procurement_Method__c ? (
					<View style={s.row}>
						<Text style={s.label}>Procurement Method:</Text>
						<Text style={s.value}>{contract.cux_Procurement_Method__c}</Text>
					</View>
				) : null}
				{contract.cux_Procurement_Reference__c ? (
					<View style={s.row}>
						<Text style={s.label}>Procurement Reference:</Text>
						<Text style={s.value}>{contract.cux_Procurement_Reference__c}</Text>
					</View>
				) : null}
				{contract.cux_Business_Unit__r?.cux_Unit_Name__c ? (
					<View style={s.row}>
						<Text style={s.label}>Business Unit:</Text>
						<Text style={s.value}>{contract.cux_Business_Unit__r.cux_Unit_Name__c}</Text>
					</View>
				) : null}
				{contract.cux_Risk_Level__c ? (
					<View style={s.row}>
						<Text style={s.label}>Risk Level:</Text>
						<Text style={s.value}>{contract.cux_Risk_Level__c}</Text>
					</View>
				) : null}
				{contract.cux_DBE_Goal_Percent__c != null ? (
					<View style={s.row}>
						<Text style={s.label}>DBE Goal:</Text>
						<Text style={s.value}>{contract.cux_DBE_Goal_Percent__c}%</Text>
					</View>
				) : null}

				{/* ═══ TERM ═══ */}
				<Text style={s.sectionHeader}>Article II — Term of Agreement</Text>
				<Text style={[s.narrative, s.mb4]}>
					The term of this Agreement shall commence on{" "}
					<Text style={s.bold}>{fmtDate(contract.cux_Start_Date__c)}</Text>{" "}
					and shall expire on{" "}
					<Text style={s.bold}>{fmtDate(contract.cux_End_Date__c)}</Text>,{" "}
					unless earlier terminated in accordance with the provisions set forth herein.
				</Text>

				{/* ═══ PARTIES ═══ */}
				<Text style={s.sectionHeader}>Article III — Parties</Text>
				<View style={s.partiesRow}>
					<View style={s.partyCol}>
						<Text style={s.partyRole}>Contractor</Text>
						<Text style={s.partyName}>{vendorName}</Text>
						{contract.cux_Account__r?.Phone ? <Text style={s.partyDetail}>Tel: {contract.cux_Account__r.Phone}</Text> : null}
						{contract.cux_Account__r?.Website ? <Text style={s.partyDetail}>{contract.cux_Account__r.Website}</Text> : null}
					</View>
					<View style={s.partyCol}>
						<Text style={s.partyRole}>Contractor Representative</Text>
						<Text style={s.partyName}>{contactName}</Text>
						{contactTitle ? <Text style={s.partyDetail}>{contactTitle}</Text> : null}
						{contactEmail ? <Text style={s.partyDetail}>{contactEmail}</Text> : null}
						{contract.cux_Vendor_Contact__r?.Phone ? <Text style={s.partyDetail}>Tel: {contract.cux_Vendor_Contact__r.Phone}</Text> : null}
					</View>
					<View style={s.partyCol}>
						<Text style={s.partyRole}>Contract Manager</Text>
						<Text style={s.partyName}>{managerName}</Text>
						{managerEmail ? <Text style={s.partyDetail}>{managerEmail}</Text> : null}
					</View>
				</View>

				{/* ═══ COMPENSATION ═══ */}
				<Text style={s.sectionHeader}>Article IV — Compensation</Text>
				<Text style={[s.narrative, s.mb8]}>
					The total authorized amount for services rendered under this Agreement shall not exceed{" "}
					<Text style={s.bold}>{fmt(contract.cux_Total_Authorized_Amount__c)}</Text>{" "}
					(the "Not-to-Exceed Amount"). Payments shall be made in accordance with the terms and conditions
					set forth in any applicable task orders or invoices issued under this Agreement.
				</Text>
				<View style={s.row}>
					<Text style={s.label}>Total Authorized:</Text>
					<Text style={[s.value, s.bold]}>{fmt(contract.cux_Total_Authorized_Amount__c)}</Text>
				</View>
				<View style={s.row}>
					<Text style={s.label}>Total Obligated:</Text>
					<Text style={s.value}>{fmt(contract.cux_Total_Obligated_Amount__c)}</Text>
				</View>
				<View style={s.row}>
					<Text style={s.label}>Total Expended:</Text>
					<Text style={s.value}>{fmt(contract.cux_Total_Expended_Amount__c)}</Text>
				</View>

				{/* ═══ FUNDING ═══ */}
				{funding.length > 0 ? (
					<View>
						<Text style={s.sectionHeader}>Article V — Funding Sources</Text>
						<Text style={[s.narrative, s.mb8]}>
							The following funding sources have been identified and allocated to support the
							obligations under this Agreement:
						</Text>
						<View style={s.table}>
							<View style={s.tableHeaderRow}>
								<View style={s.colFund}><Text style={s.tableHeaderText}>Fund</Text></View>
								<View style={s.colCode}><Text style={s.tableHeaderText}>Code</Text></View>
								<View style={s.colType}><Text style={s.tableHeaderText}>Type</Text></View>
								<View style={s.colAmt}><Text style={[s.tableHeaderText, { textAlign: "right" }]}>Allocated</Text></View>
								<View style={s.colAmt}><Text style={[s.tableHeaderText, { textAlign: "right" }]}>Obligated</Text></View>
								<View style={s.colAmt}><Text style={[s.tableHeaderText, { textAlign: "right" }]}>Expended</Text></View>
							</View>
							{funding.map((f) => (
								<View key={f.Id} style={s.tableRow}>
									<View style={s.colFund}><Text style={s.tableCellText}>{f.cux_Funding_Code__r?.cux_Fund_Name__c || f.cux_Funding_Code__r?.Name || "—"}</Text></View>
									<View style={s.colCode}><Text style={s.tableCellText}>{f.cux_Funding_Code__r?.cux_Code__c || "—"}</Text></View>
									<View style={s.colType}><Text style={s.tableCellText}>{f.cux_Funding_Code__r?.cux_Fund_Type__c || "—"}</Text></View>
									<View style={s.colAmt}><Text style={[s.tableCellText, { textAlign: "right" }]}>{fmt(f.cux_Allocated_Amount__c)}</Text></View>
									<View style={s.colAmt}><Text style={[s.tableCellText, { textAlign: "right" }]}>{fmt(f.cux_Obligated_Amount__c)}</Text></View>
									<View style={s.colAmt}><Text style={[s.tableCellText, { textAlign: "right" }]}>{fmt(f.cux_Expended_Amount__c)}</Text></View>
								</View>
							))}
						</View>
					</View>
				) : null}

				{/* ═══ SCOPE / NARRATIVE ═══ */}
				{contract.cux_Narrative__c ? (
					<View>
						<Text style={s.sectionHeader}>
							{funding.length > 0 ? "Article VI" : "Article V"} — Scope of Work
						</Text>
						<Text style={s.narrative}>{contract.cux_Narrative__c}</Text>
					</View>
				) : null}

				{/* ═══ SIGNATURES ═══ */}
				<View style={s.sigSection}>
					<Text style={s.sectionHeader}>Signatures</Text>
					<Text style={[s.narrative, s.mb12]}>
						IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date(s) set forth below.
					</Text>

					<View style={s.sigRow}>
						{/* Contractor signature */}
						<View style={s.sigBlock}>
							<Text style={[s.partyRole, s.mb4]}>Contractor Representative</Text>
							<View style={s.sigLine} />
							<Text style={s.sigLabel}>{contactName}</Text>
							{contactTitle ? <Text style={s.sigSublabel}>{contactTitle}</Text> : null}
							<Text style={s.sigSublabel}>{vendorName}</Text>
							<View style={s.sigDateRow}>
								<Text style={s.sigDateLabel}>Date:</Text>
								<View style={s.sigDateLine} />
							</View>
						</View>

						{/* Contract Manager signature */}
						<View style={s.sigBlock}>
							<Text style={[s.partyRole, s.mb4]}>Contract Manager</Text>
							<View style={s.sigLine} />
							<Text style={s.sigLabel}>{managerName}</Text>
							<Text style={s.sigSublabel}>Contract Manager</Text>
							<View style={s.sigDateRow}>
								<Text style={s.sigDateLabel}>Date:</Text>
								<View style={s.sigDateLine} />
							</View>
						</View>
					</View>
				</View>

				{/* ═══ FOOTER ═══ */}
				<View style={s.footer} fixed>
					<Text style={s.footerText}>Contract No. {contract.Name}</Text>
					<Text style={s.footerText}>CloudCoro CRM — Confidential</Text>
					<Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
				</View>
			</Page>
		</Document>
	);
}
