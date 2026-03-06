import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import JSZip from 'jszip';

const TEMPLATES = {
  python: `weather-pro-repo/
├── .gitignore
├── LICENSE
├── README.md
├── pyproject.toml
├── src/
│   └── weather_pro/
│       ├── __init__.py
│       └── converter.py
└── tests/
    └── test_converter.py`,
  react: `my-react-app/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   └── Header.jsx
│   ├── App.js
│   └── index.js
├── .gitignore
├── package.json
└── README.md`,
  node: `node-api-server/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── app.js
├── .env
├── package.json
└── README.md`,
};

function parseTree(treeText) {
  const lines = treeText.split('\n');
  const items = [];
  const stack = [];

  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;

    const line = rawLine.split('<--')[0].replace(/\t/g, '    ');
    if (!line.trim()) continue;

    const hasConnector = /[├└│]/.test(line);
    let depth = 0;
    let name = line.trim();

    if (hasConnector) {
      const match = line.match(/^((?:│   |    )*)(?:├── |└── )(.*)$/);
      if (!match) continue;

      const prefix = match[1] || '';
      name = (match[2] || '').trim();
      depth = prefix.length / 4 + 1;
    }

    if (!name) continue;

    const isFolder = name.endsWith('/');
    const normalizedName = isFolder ? name.slice(0, -1) : name;

    while (stack.length > depth) {
      stack.pop();
    }

    const parentPath = stack.length > 0 ? stack[stack.length - 1] : '';
    const fullPath = parentPath
      ? `${parentPath}/${normalizedName}`
      : normalizedName;

    items.push({
      name,
      normalizedName,
      isFolder,
      depth,
      fullPath,
    });

    if (isFolder) {
      stack[depth] = fullPath;
      stack.length = depth + 1;
    }
  }

  return items;
}

export default function TreeToRepo() {
  const [showModal, setShowModal] = useState(false);
  const [treeText, setTreeText] = useState(TEMPLATES.python);
  const [status, setStatus] = useState('idle');

  const preview = useMemo(() => parseTree(treeText), [treeText]);

  useEffect(() => {
    if (!showModal) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowModal(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showModal]);

  const generateZip = async () => {
    setStatus('processing');

    try {
      const zip = new JSZip();
      const structure = parseTree(treeText);

      if (structure.length === 0) {
        throw new Error('No valid structure detected.');
      }

      for (const item of structure) {
        if (item.isFolder) {
          zip.folder(item.fullPath);
        } else {
          zip.file(item.fullPath, '');
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'project-structure.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowModal(true);
      setStatus('success');

      window.setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('ZIP generation failed:', error);
      setStatus('error');
    }
  };

  return (
    <>
      <Head>
        <title>Tree2Repo | Live Builder</title>
        <meta
          name="description"
          content="Convert text-based project trees into downloadable ZIP repository structures."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0a] p-4 font-sans text-zinc-300 md:p-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                Tree2Repo
                <span className="rounded bg-green-500/10 px-2 py-1 font-mono text-sm text-green-500">
                  v2.0
                </span>
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Convert text diagrams to physical repositories.
              </p>
            </div>

            <select
              value={Object.keys(TEMPLATES).find((key) => TEMPLATES[key] === treeText) || ''}
              onChange={(e) => setTreeText(TEMPLATES[e.target.value] || '')}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-green-500"
              aria-label="Choose a template"
            >
              <option value="python">Python Template</option>
              <option value="react">React Template</option>
              <option value="node">Node Template</option>
            </select>
          </header>

          <main className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                <div className="border-b border-zinc-800 bg-zinc-800/50 px-4 py-2 font-mono text-xs uppercase tracking-widest text-zinc-500">
                  Input ASCII Tree
                </div>

                <textarea
                  className="h-[500px] w-full resize-none bg-transparent p-4 font-mono text-sm text-green-400 outline-none"
                  value={treeText}
                  onChange={(e) => setTreeText(e.target.value)}
                  spellCheck={false}
                  aria-label="Project tree input"
                />
              </div>

              <button
                type="button"
                onClick={generateZip}
                disabled={status === 'processing'}
                className={`w-full rounded-xl py-4 font-bold transition-all ${
                  status === 'processing'
                    ? 'cursor-not-allowed bg-zinc-700 text-zinc-300'
                    : status === 'success'
                    ? 'bg-green-600 text-white'
                    : status === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-green-500 text-black hover:bg-green-400'
                }`}
              >
                {status === 'processing'
                  ? 'Generating...'
                  : status === 'success'
                  ? '✓ Downloaded ZIP'
                  : status === 'error'
                  ? 'Failed — Try Again'
                  : 'Download Project'}
              </button>
            </section>

            <section className="flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
              <div className="border-b border-zinc-800 bg-zinc-800/50 px-4 py-2 font-mono text-xs uppercase tracking-widest text-zinc-500">
                Live Preview
              </div>

              <div className="h-[500px] overflow-y-auto p-6 font-mono text-sm">
                {preview.length === 0 ? (
                  <div className="text-zinc-500">No valid structure detected.</div>
                ) : (
                  <div className="space-y-1">
                    {preview.map((item, index) => (
                      <div
                        key={`${item.fullPath}-${index}`}
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${item.depth * 20}px` }}
                      >
                        <span className="text-zinc-600">
                          {item.isFolder ? '📁' : '📄'}
                        </span>
                        <span
                          className={
                            item.isFolder
                              ? 'font-semibold text-blue-400'
                              : 'text-zinc-300'
                          }
                        >
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>

        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-title"
          >
            <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-green-500/30 bg-green-500/20 text-green-400">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h2 id="success-title" className="mb-2 text-xl font-bold text-white">
                Success!
              </h2>

              <p className="mb-6 text-sm leading-relaxed text-zinc-400">
                Your project structure is ready. Check your <b>Downloads</b> folder
                for the ZIP file.
              </p>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full rounded-lg bg-green-500 py-3 text-sm font-bold text-black transition-all hover:bg-green-400 active:scale-95"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
