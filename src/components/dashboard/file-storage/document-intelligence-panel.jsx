"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FileTextIcon } from "@phosphor-icons/react/dist/ssr/FileText";
import { ScanIcon } from "@phosphor-icons/react/dist/ssr/Scan";

const ENDPOINT = import.meta.env.VITE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const KEY = import.meta.env.VITE_DOCUMENT_INTELLIGENCE_KEY;

const MODELS = [
  { value: "prebuilt-layout", label: "Layout — text, tables & structure" },
  { value: "prebuilt-document", label: "Document — key-value pairs" },
  { value: "prebuilt-invoice", label: "Invoice — invoice fields" },
  { value: "prebuilt-receipt", label: "Receipt — receipt fields" },
];

export function DocumentIntelligencePanel() {
  const [file, setFile] = React.useState(null);
  const [model, setModel] = React.useState("prebuilt-document");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);
  const inputRef = React.useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); setError(null); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) { setFile(f); setResult(null); setError(null); }
  };

  const handleExtract = async () => {
    if (!file) return;
    if (!ENDPOINT || !KEY) {
      setError("Configure VITE_DOCUMENT_INTELLIGENCE_ENDPOINT and VITE_DOCUMENT_INTELLIGENCE_KEY in your .env file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiVersion = "2023-07-31";
      const analyzeUrl = `${ENDPOINT}/formrecognizer/documentModels/${model}:analyze?api-version=${apiVersion}`;

      // Submit document
      const submitRes = await fetch(analyzeUrl, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": KEY,
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Error ${submitRes.status}`);
      }

      // Poll for result via Operation-Location header
      const operationUrl = submitRes.headers.get("Operation-Location");
      if (!operationUrl) throw new Error("No Operation-Location header returned.");

      let data;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const pollRes = await fetch(operationUrl, {
          headers: { "Ocp-Apim-Subscription-Key": KEY },
        });
        data = await pollRes.json();
        if (data.status === "succeeded") break;
        if (data.status === "failed") throw new Error(data.error?.message || "Analysis failed.");
      }

      if (data?.status !== "succeeded") throw new Error("Analysis timed out.");
      setResult(data.analyzeResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      {/* Upload area */}
      <Card>
        <CardHeader
          avatar={<ScanIcon size={20} />}
          title="Document Intelligence"
          subheader="Extract structured data from documents using Azure AI"
        />
        <Divider />
        <CardContent>
          <Stack spacing={3}>
            <Box
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              sx={{
                border: "2px dashed",
                borderColor: file ? "primary.main" : "divider",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                bgcolor: file ? "primary.50" : "background.paper",
                transition: "all 0.2s",
                "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" },
              }}
            >
              <input hidden ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp,.heif" onChange={handleFile} />
              <FileTextIcon size={32} style={{ marginBottom: 8, opacity: 0.6 }} />
              {file ? (
                <Typography variant="body2" color="primary.main" fontWeight={600}>{file.name}</Typography>
              ) : (
                <>
                  <Typography variant="body2" fontWeight={600}>Drop a document here or click to browse</Typography>
                  <Typography variant="caption" color="text.secondary">PDF, JPG, PNG, TIFF supported</Typography>
                </>
              )}
            </Box>

            <FormControl size="small" sx={{ maxWidth: 320 }}>
              <InputLabel>Model</InputLabel>
              <Select value={model} label="Model" onChange={(e) => setModel(e.target.value)}>
                {MODELS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
              </Select>
            </FormControl>

            <Box>
              <Button
                variant="contained"
                disabled={!file || loading}
                onClick={handleExtract}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ScanIcon size={16} />}
              >
                {loading ? "Extracting..." : "Extract"}
              </Button>
            </Box>

            {error && (
              <Typography color="error" variant="body2">{error}</Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Stack spacing={2}>
          {/* Key-value pairs */}
          {result.keyValuePairs?.length > 0 && (
            <Card>
              <CardHeader title="Key-Value Pairs" subheader={`${result.keyValuePairs.length} fields extracted`} />
              <Divider />
              <CardContent>
                <Stack spacing={1}>
                  {result.keyValuePairs.map((kv, i) => (
                    <Stack key={i} direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
                      <Chip label={kv.key?.content || "—"} size="small" variant="soft" color="primary" sx={{ minWidth: 140, justifyContent: "flex-start" }} />
                      <Typography variant="body2" color="text.secondary" sx={{ pt: 0.25 }}>
                        {kv.value?.content || "—"}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Tables */}
          {result.tables?.length > 0 && (
            <Card>
              <CardHeader title="Tables" subheader={`${result.tables.length} table(s) found`} />
              <Divider />
              <CardContent>
                {result.tables.map((table, ti) => (
                  <Box key={ti} sx={{ overflowX: "auto", mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                      Table {ti + 1} — {table.rowCount} rows × {table.columnCount} cols
                    </Typography>
                    <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
                      <tbody>
                        {Array.from({ length: table.rowCount }, (_, r) => (
                          <tr key={r}>
                            {table.cells
                              .filter((c) => c.rowIndex === r)
                              .sort((a, b) => a.columnIndex - b.columnIndex)
                              .map((cell, ci) => {
                                const Tag = cell.kind === "columnHeader" ? "th" : "td";
                                return (
                                  <Tag key={ci} style={{ border: "1px solid #e0e0e0", padding: "4px 8px", background: cell.kind === "columnHeader" ? "#f5f5f5" : "transparent" }}>
                                    {cell.content}
                                  </Tag>
                                );
                              })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Raw content */}
          <Card>
            <CardHeader title="Extracted Text" subheader={`${result.pages?.length || 0} page(s)`} />
            <Divider />
            <CardContent>
              <Box
                component="pre"
                sx={{
                  fontSize: 12,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 400,
                  overflowY: "auto",
                  bgcolor: "background.level1",
                  p: 2,
                  borderRadius: 1,
                  fontFamily: "monospace",
                }}
              >
                {result.content}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Stack>
  );
}
