"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FileTextIcon } from "@phosphor-icons/react/dist/ssr/FileText";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";

const ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
const KEY = import.meta.env.VITE_AZURE_OPENAI_KEY;
const DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
const API_VERSION = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || "2024-12-01-preview";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Error reading file"));
  });
}

function fileToText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Error reading file"));
  });
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function AiAnalysisPanel() {
  const [file, setFile] = React.useState(null);
  const [prompt, setPrompt] = React.useState("Analyze this document and provide a detailed summary. Identify the main topics, key information, dates, names, and any action items.");
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

  const handleAnalyze = async () => {
    if (!file || !prompt.trim()) return;
    if (!ENDPOINT || !KEY) {
      setError("Configure VITE_AZURE_OPENAI_ENDPOINT and VITE_AZURE_OPENAI_KEY in your .env file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const url = `${ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;
      let messages;

      if (IMAGE_TYPES.includes(file.type)) {
        // Vision: send image as base64
        const b64 = await fileToBase64(file);
        messages = [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${file.type};base64,${b64}` } },
            ],
          },
        ];
      } else {
        // Text/PDF: read as text and include in prompt
        let content;
        try {
          content = await fileToText(file);
        } catch {
          content = "[Binary file — content cannot be extracted directly]";
        }
        messages = [
          {
            role: "system",
            content: "You are a document analysis assistant. Analyze documents thoroughly and provide clear, structured responses.",
          },
          {
            role: "user",
            content: `${prompt}\n\n--- DOCUMENT CONTENT ---\n${content.slice(0, 60000)}`,
          },
        ];
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "api-key": KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages, max_tokens: 4096, temperature: 0.3 }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Error ${res.status}`);
      }

      const data = await res.json();
      setResult(data.choices?.[0]?.message?.content || "No response received.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader
          avatar={<SparkleIcon size={20} />}
          title="AI Document Analysis"
          subheader="Analyze documents with Azure OpenAI GPT-4o"
        />
        <Divider />
        <CardContent>
          <Stack spacing={3}>
            {/* Drop zone */}
            <Box
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              sx={{
                border: "2px dashed",
                borderColor: file ? "secondary.main" : "divider",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                bgcolor: file ? "secondary.50" : "background.paper",
                transition: "all 0.2s",
                "&:hover": { borderColor: "secondary.main", bgcolor: "secondary.50" },
              }}
            >
              <input hidden ref={inputRef} type="file" accept=".pdf,.txt,.csv,.md,.json,.jpg,.jpeg,.png,.webp" onChange={handleFile} />
              <FileTextIcon size={32} style={{ marginBottom: 8, opacity: 0.6 }} />
              {file ? (
                <Typography variant="body2" color="secondary.main" fontWeight={600}>{file.name}</Typography>
              ) : (
                <>
                  <Typography variant="body2" fontWeight={600}>Drop a document here or click to browse</Typography>
                  <Typography variant="caption" color="text.secondary">PDF, TXT, CSV, JSON, images supported</Typography>
                </>
              )}
            </Box>

            {/* Prompt */}
            <FormControl fullWidth>
              <InputLabel>Analysis prompt</InputLabel>
              <OutlinedInput
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                multiline
                rows={3}
                label="Analysis prompt"
                placeholder="What would you like to know about this document?"
              />
            </FormControl>

            <Box>
              <Button
                variant="contained"
                color="secondary"
                disabled={!file || !prompt.trim() || loading}
                onClick={handleAnalyze}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SparkleIcon size={16} />}
              >
                {loading ? "Analyzing..." : "Analyze"}
              </Button>
            </Box>

            {error && (
              <Typography color="error" variant="body2">{error}</Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card>
          <CardHeader title="Analysis Result" subheader={`Powered by ${DEPLOYMENT}`} />
          <Divider />
          <CardContent>
            <Box
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 14,
                lineHeight: 1.7,
                maxHeight: 600,
                overflowY: "auto",
              }}
            >
              {result}
            </Box>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
