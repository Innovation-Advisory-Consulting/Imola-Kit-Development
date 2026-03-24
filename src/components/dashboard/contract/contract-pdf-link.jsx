"use client";

import * as React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";

import { ContractPDFDocument } from "@/components/dashboard/contract/contract-pdf-document";

export function ContractPDFLink({ contract, funding, children }) {
	return (
		<PDFDownloadLink
			document={<ContractPDFDocument contract={contract} funding={funding} />}
			fileName={`${contract?.Name || "contract"}.pdf`}
		>
			{children}
		</PDFDownloadLink>
	);
}
