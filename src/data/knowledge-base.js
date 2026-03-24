/**
 * CloudCoro Knowledge Base
 * FAQs and domain knowledge for RainierAI chat assistant.
 * Edit this file to add, update, or remove knowledge entries.
 */

export const KNOWLEDGE_BASE = `
# CloudCoro Knowledge Base

## Contracts

### What is a contract?
A contract is a formal agreement between our organization and a vendor or client. In CloudCoro, contracts track the full lifecycle from drafting through closure, including funding, task orders, amendments, invoices, and documents.

### What are the contract statuses and what do they mean?
- **Draft**: The contract is being written and has not been submitted for review yet.
- **Under Review**: The contract has been submitted and is being reviewed internally.
- **Approved for Procurement**: The contract has been approved and is ready for the procurement process.
- **Submitted to Procurement**: The contract has been formally submitted to the procurement department.
- **Awarded**: The contract has been awarded to the vendor.
- **Executed**: The contract is fully signed and active. Work can begin.
- **Closed**: The contract has been completed and officially closed. No further changes are allowed.

### How do I close a contract?
To close a contract it must meet all closure requirements:
- All task orders must be complete or cancelled.
- All invoices must be paid or voided.
- There must be no pending amendments.
- The contract must be in Executed status.
Once all conditions are met, use the "Close Contract" action on the contract detail page.

### What is the difference between Awarded and Executed?
"Awarded" means the contract has been selected and approved but not yet fully signed. "Executed" means all parties have signed and the contract is legally active.

### What are the Authorized, Obligated, and Expended amounts?
- **Authorized**: The total budget approved for this contract.
- **Obligated**: The amount formally committed through task orders or purchase orders.
- **Expended**: The amount actually spent, as tracked through paid invoices.

### What is a contract amendment?
An amendment is a formal change to an existing contract — such as extending the period of performance, increasing funding, changing the scope of work, or updating terms. Each amendment has its own approval workflow.

---

## Task Orders

### What is a task order?
A task order is a work assignment under a contract. It defines a specific scope of work, budget, and timeline within the broader contract. One contract can have multiple task orders.

### What are the task order statuses?
- **Draft**: Being prepared.
- **Under Review**: Submitted for internal review.
- **Approved**: Ready to execute.
- **Active**: Work is in progress.
- **Complete**: All work has been delivered and accepted.
- **Cancelled**: The task order was terminated before completion.

### Can I create an invoice without a task order?
Invoices are associated with task orders. If you need to submit an invoice, make sure a task order exists first. Contact your program manager if no task order has been created.

---

## Invoices

### What is an invoice?
An invoice is a request for payment submitted by a vendor for work completed under a task order. It includes the service period, amount, and supporting documentation.

### What are the invoice statuses?
- **Draft**: Being prepared by the vendor.
- **Submitted**: Sent for review.
- **Under Review**: Being reviewed by the program team.
- **Approved**: Approved for payment.
- **Paid**: Payment has been issued.
- **Rejected**: Returned to the vendor for correction.
- **Voided**: Cancelled and no longer valid.

### How do I submit an invoice?
Navigate to the relevant task order, click the Invoices tab, and click "Add Invoice." Fill in the service period, amount, and attach supporting documentation. Once submitted, the program manager will review it.

### Why was my invoice rejected?
Invoices are rejected when information is missing or incorrect — such as mismatched service periods, missing backup documentation, or amounts that exceed the task order budget. Check the rejection notes for specific reasons.

### How long does invoice approval take?
Typically 5–10 business days after submission, depending on the review queue. Contact your program manager if it has been more than 10 business days.

---

## Funding

### What is a funding source?
A funding source identifies where the money for a contract comes from — such as a federal grant, state appropriation, or local budget line. Each contract can have multiple funding sources with allocated amounts.

### What is a funding code?
A funding code is the internal identifier for a funding source (e.g., Federal STIP, State STIP Match, FHWA). It connects the contract to the budget authority.

### Can a contract have multiple funding sources?
Yes. A contract can be funded from multiple sources. The total of all allocated amounts should equal the contract's authorized amount.

---

## Documents

### What types of documents can be attached to a contract?
Common document types include: Contract Agreement, Statement of Work (SOW), Funding Approval, Amendment, Notice to Proceed, Certificate of Insurance, and Final Report.

### How do I upload a document?
Go to the contract or task order detail page, click the Documents tab, and click "Add Document." Select the file type and upload your file.

### What is an "official" document?
An official document is one that has been formally approved and represents the authoritative version of record. Only program managers can mark a document as official.

### What is a "final" document?
A final document indicates the last version of a deliverable — such as a final report or final invoice package. It signals that no further revisions are expected.

---

## General / Navigation

### Where do I find my tasks?
Your assigned tasks are in "My Day" (daily view) and "Work Queue" (full list). Both show tasks linked to your contracts and task orders.

### How do I find a specific contract?
Use the Contracts menu in the sidebar, or use the search bar at the top of the page. You can filter by contract number, vendor, status, or date.

### What does "Blocked" mean on a task?
A blocked task cannot be completed because something is preventing progress — such as missing information, a pending approval, or a dependency on another task. Check the task notes for the reason.

### Who do I contact if I have a problem?
For system issues, contact your system administrator. For contract or program questions, contact your assigned program manager.

### What is the Contract Map?
The Contract Map is a visual timeline (Gantt chart) showing the full picture of a contract — including funding periods, task orders, invoices, and amendments — all on a single timeline view. Access it via the "Contract Map" tab on any contract.
`;
