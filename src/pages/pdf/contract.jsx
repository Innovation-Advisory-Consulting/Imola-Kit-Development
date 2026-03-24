"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useParams } from "react-router-dom";

import { PDFViewer } from "@/components/core/pdf-viewer";
import { ContractPDFDocument } from "@/components/dashboard/contract/contract-pdf-document";
import { useSalesforceQuery } from "@/hooks/use-salesforce";

export function Page() {
	const { contractId } = useParams();
	const { data: contract, loading } = useSalesforceQuery((c) => c.getContract(contractId), [contractId]);
	const { data: funding } = useSalesforceQuery((c) => c.getContractFunding(contractId), [contractId]);

	if (loading || !contract) {
		return (
			<Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<PDFViewer style={{ border: "none", height: "100vh", width: "100vw" }}>
			<ContractPDFDocument contract={contract} funding={funding || []} />
		</PDFViewer>
	);
}
