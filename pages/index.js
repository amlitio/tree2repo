import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import JSZip from 'jszip';

const TEMPLATES = {
  python: `weather-pro-repo/\n├── .gitignore\n├── LICENSE\n├── README.md\n├── pyproject.toml\n├── src/\n│   └── weather_pro/\n│       ├── __init__.py\n│       └── converter.py\n└── tests/\n    └── test_converter.py`,
  react: `my-react-app/\n├── public/\n│   ├── index.html\n│   └── favicon.ico\n├── src/\n│   ├── components/\n│   │   └── Header.jsx\n│   ├── App.js\n│   └── index.js\n├── .gitignore\n├── package.json\n└── README.md`,
  node: `node-api-server/\n├── src/\n│   ├── controllers/\n│   ├── models/\n│   ├── routes/\n│   └── app.js\n├── .env\n├── package.json\n└── README.md`
};

export default function TreeToRepo() {
  const [treeText, setTreeText] = useState(TEMPLATES.python);
  const [preview, setPreview] = useState([]);
  const [status, setStatus] = useState('idle');

  // Helper to parse text into an object for the preview
  useEffect(() => {
    const lines = treeText.split('\n');
    let structure = [];
    let pathStack = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      const cleanLine = line.split('<--')[0];
      const indentMatch = cleanLine.match(/^[\s|]*[└├─\-` ]+/);
      const indent = indentMatch ? indentMatch[0].length : 0;
      const name = cleanLine.replace(/^[\s|└├─\-` ]+/, '').trim();
      if (!name) return;

      while (pathStack.length > 0 && pathStack[pathStack.length - 1].indent >= indent && indent !== 0) {
        pathStack.pop();
      }

      const isFolder = name.endsWith('/') || !name.includes('.');
      const item = { name, isFolder, indent };
      
      structure.push(item);
      if (isFolder) pathStack.push(item);
    });
    setPreview(structure);
  }, [treeText]);

  const generateZip = async () => {
    setStatus('processing');
    try {
      const zip = new JSZip();
      let pathStack = [];

      treeText.split('\n').forEach(line => {
        if (!line.trim()) return;
        const cleanLine = line.split('<--')[0];
        const indentMatch = cleanLine.match(/^[\s|]*[└├─\-` ]+/);
        const indent = indentMatch ? indentMatch[0].length : 0;
        const name = cleanLine.replace(/^[\s|└├─\-` ]+/, '').trim();
        
        while (pathStack.length > 0 && pathStack[pathStack.length - 1].indent >= indent && indent !== 0) {
          pathStack.pop();
        }

        const parentPath = pathStack.length > 0 ? pathStack[pathStack.length - 1].path : "";
        const fullPath = parentPath ? `${parentPath}/${name}` : name;

        if (name.endsWith('/') || !name.includes('.')) {
          zip.folder(fullPath.replace(/\/$/, ""));
          pathStack.push({ indent, path: fullPath.replace(/\/$/, "") });
        } else {
          zip.file(fullPath, ""); 
        }
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = "project-structure.zip";
      link.click();
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) { setStatus('error'); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans p-4 md:p-10">
      <Head><title>Tree2Repo | Live Builder</title></Head>

      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <header className="flex justify-between items-end border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Tree2Repo <span className="text-green-500 text-sm font-mono bg-green-500/10 px-2 py-1 rounded">v2.0</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Convert text diagrams to physical repositories.</p>
          </div>
          <select 
            onChange={(e) => setTreeText(TEMPLATES[e.target.value] || '')}
            className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm outline-none focus:border-green-500"
          >
            <option value="python">Python Template</option>
            <option value="react">React Template</option>
            <option value="node">Node Template</option>
          </select>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Section */}
          <div className="flex flex-col gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-800/50 px-4 py-2 border-b border-zinc-800 text-xs font-mono uppercase tracking-widest text-zinc-500">Input ASCII Tree</div>
              <textarea
                className="w-full h-[500px] bg-transparent p-4 font-mono text-sm text-green-400 outline-none resize-none"
                value={treeText}
                onChange={(e) => setTreeText(e.target.value)}
              />
            </div>
            <button
              onClick={generateZip}
              className={`w-full py-4 rounded-xl font-bold transition-all ${
                status === 'success' ? 'bg-green-600 text-white' : 'bg-green-500 hover:bg-green-400 text-black'
              }`}
            >
              {status === 'processing' ? 'Generating...' : status === 'success' ? '✓ Downloaded ZIP' : 'Download Project'}
            </button>
          </div>

          {/* Preview Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
            <div className="bg-zinc-800/50 px-4 py-2 border-b border-zinc-800 text-xs font-mono uppercase tracking-widest text-zinc-500">Live Preview</div>
            <div className="p-6 overflow-y-auto h-[500px] font-mono text-sm space-y-1">
              {preview.map((item, i) => (
                <div key={i} style={{ paddingLeft: `${item.indent * 4}px` }} className="flex items-center gap-2 group">
                  <span className="text-zinc-600">
                    {item.isFolder ? '📁' : '📄'}
                  </span>
                  <span className={item.isFolder ? 'text-blue-400 font-semibold' : 'text-zinc-300'}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
