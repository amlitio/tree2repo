import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import JSZip from 'jszip';

const TEMPLATES = {
  python: `weather-pro-repo/
├──.gitignore
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
├──.gitignore
├── package.json
└── README.md`,
  node: `node-api-server/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── app.js
├──.env
├── package.json
└── README.md`
};

/**
 * Parses a tree-style text input into a flat structure with depth info.
 * Folders must end with "/" to avoid ambiguity with files like LICENSE, Dockerfile, etc.
 */
function parseTree(treeText) {
  const lines = treeText.split('\n');
  const structure =;
  const pathStack =;

  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;

    const cleanLine = rawLine.split('<--').replace(/\t/g, '    ');
    if (!cleanLine.trim()) continue;

    // Root line: no tree connector
    const hasConnector = /[├└│]/.test(cleanLine);
    let depth = 0;
    let name = cleanLine.trim();

    if (hasConnector) {
      const connectorMatch = cleanLine.match(/^((?:│ | )*)(?:├── |└── )(.*)$/);
      if (!connectorMatch) continue;

      const prefix = connectorMatch[1] |

| '';
      name = (connectorMatch[2] |

| '').trim();
      depth = prefix.length / 4 + 1;
    }

    if (!name) continue;

    const isFolder = name.endsWith('/');
    const normalizedName = isFolder? name.slice(0, -1) : name;

    while (pathStack.length > depth) {
      pathStack.pop();
    }

    const parentPath = pathStack.length? pathStack : '';
    const fullPath = parentPath? `${parentPath}/${normalizedName}` : normalizedName;

    structure.push({
      name,
      normalizedName,
      isFolder,
      depth,
      fullPath
    });

    if (isFolder) {
      pathStack[depth] = fullPath;
      pathStack.length = depth + 1;
    }
  }

  return structure;
}

export default function TreeToRepo() {
  const = useState(false);
  const = useState(TEMPLATES.python);
  const [preview, setPreview] = useState();
  const = useState('idle');

  useEffect(() => {
    setPreview(parseTree(treeText));
  },);

  const generateZip = async () => {
    setStatus('processing');

    try {
      const zip = new JSZip();
      const structure = parseTree(treeText);

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
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('ZIP generation failed:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans p-4 md:p-10">
      <Head>
        <title>Tree2Repo | Live Builder</title>
      </Head>

      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <header className="flex justify-between items-end border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Tree2Repo{' '}
              <span className="text-green-500 text-sm font-mono bg-green-500/10 px-2 py-1 rounded">
                v2.0
              </span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Convert text diagrams to physical repositories.
            </p>
          </div>

          <select
            onChange={(e) => setTreeText(TEMPLATES[e.target.value] |

| '')}
            className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm outline-none focus:border-green-500"
            defaultValue="python"
          >
            <option value="python">Python Template</option>
            <option value="react">React Template</option>
            <option value="node">Node Template</option>
          </select>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-800/50 px-4 py-2 border-b border-zinc-800 text-xs font-mono uppercase tracking-widest text-zinc-500">
                Input ASCII Tree
              </div>
              <textarea
                className="w-full h-[500px] bg-transparent p-4 font-mono text-sm text-green-400 outline-none resize-none"
                value={treeText}
                onChange={(e) => setTreeText(e.target.value)}
                spellCheck={false}
              />
            </div>

            <button
              onClick={generateZip}
              disabled={status === 'processing'}
              className={`w-full py-4 rounded-xl font-bold transition-all ${
                status === 'processing'
                 ? 'bg-zinc-700 text-zinc-300 cursor-not-allowed'
                  : status === 'success'
                 ? 'bg-green-600 text-white'
                  : status === 'error'
                 ? 'bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-400 text-black'
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
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Your project structure is ready. Check your <b>Downloads</b> folder
                  for the ZIP file.
                </p>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 bg-green-500 hover:bg-green-400 text-black rounded-lg text-sm font-bold transition-all transform active:scale-95"
                >
                  Got it!
                </button>
              </div>
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
            <div className="bg-zinc-800/50 px-4 py-2 border-b border-zinc-800 text-xs font-mono uppercase tracking-widest text-zinc-500">
              Live Preview
            </div>

            <div className="p-6 overflow-y-auto h-[500px] font-mono text-sm space-y-1">
              {preview.length === 0? (
                <div className="text-zinc-500">No valid structure detected.</div>
              ) : (
                preview.map((item, i) => (
                  <div
                    key={`${item.fullPath}-${i}`}
                    style={{ paddingLeft: `${item.depth * 20}px` }}
                    className="flex items-center gap-2 group"
                  >
                    <span className="text-zinc-600">
                      {item.isFolder? '📁' : '📄'}
                    </span>
                    <span
                      className={
                        item.isFolder
                         ? 'text-blue-400 font-semibold'
                          : 'text-zinc-300'
                      }
                    >
                      {item.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
