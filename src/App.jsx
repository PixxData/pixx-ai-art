import React, { useState } from "react";
import "./App.css";

function App() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shape, setShape] = useState("square");

  // New edit mode states
  const [editing, setEditing] = useState(false);
  const [saturation, setSaturation] = useState(1);
  const [userText, setUserText] = useState("");

  const sizeOptions = {
    square: "1024x1024",
    landscape: "1792x1024",
    portrait: "1024x1792",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setImageUrl("");
    setError("");
    setLoading(true);
    setEditing(false); // reset editing mode

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          size: sizeOptions[shape],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error generating image.");
        setLoading(false);
        return;
      }

      setImageUrl(data.imageUrl);
      setSaturation(1); // reset edits
      setUserText("");
    } catch (err) {
      setError("Network or server error.");
    }
    setLoading(false);
  };

  return (
    <div className="ai-app-bg">
      <div className="ai-app-container">
        <h1>Pixx Prompt-to-Image</h1>
        <form className="ai-form" onSubmit={handleSubmit}>
          <select
            className="ai-shape-select"
            value={shape}
            onChange={e => setShape(e.target.value)}
            disabled={loading}
            style={{
              marginBottom: "14px",
              padding: "8px",
              borderRadius: "8px",
              fontSize: "1em",
              minWidth: "180px"
            }}
          >
            <option value="square">Square</option>
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>

          <input
            className="ai-prompt-input"
            type="text"
            placeholder="Enter your creative prompt (eg. 'Surreal sunset over Calgary skyline')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            autoFocus
            required
          />
          <button className="ai-generate-btn" type="submit" disabled={loading || !prompt.trim()}>
            {loading ? (
              <span className="ai-spinner"></span>
            ) : (
              "Generate Image"
            )}
          </button>
        </form>

        {error && <div className="ai-error-box">{error}</div>}

        {/* IMAGE DISPLAY & EDIT BUTTON */}
        {imageUrl && !editing && (
          <div>
            <div className="ai-image-card">
              <img className="ai-result-img" src={imageUrl} alt="AI Result" />
              <div className="ai-img-footer">{prompt}</div>
              <div className="ai-img-footer" style={{fontSize: "0.95em", color: "#999"}}>
                Shape: {shape.charAt(0).toUpperCase() + shape.slice(1)}
              </div>
            </div>
            <button
              className="ai-edit-btn"
              style={{
                margin: "18px auto 0",
                display: "block",
                fontSize: "1.1em",
                padding: "10px 26px",
                borderRadius: "9px",
                background: "#5db6e5",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 10px #0001"
              }}
              onClick={() => setEditing(true)}
            >
              Edit image / Add text
            </button>
          </div>
        )}

        {/* EDIT MODE MODAL */}
        {imageUrl && editing && (
          <div className="ai-edit-modal" style={{
            position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
            background: "rgba(24,32,44,0.96)", zIndex: 9999, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{
              margin: "auto",
              background: "#fff",
              padding: "30px 18px 18px",
              borderRadius: "24px",
              boxShadow: "0 10px 60px #0007",
              textAlign: "center",
              maxWidth: "95vw"
            }}>
              <h2 style={{color:"#0066a0",marginBottom:"18px"}}>Edit Your Image</h2>
              <img
                src={imageUrl}
                alt="Editable AI result"
                style={{
                  width: "70vw", maxWidth: "1024px", borderRadius: "20px",
                  filter: `saturate(${saturation})`,
                  marginBottom: "20px",
                  border: "2px solid #eee",
                  background: "#fff"
                }}
              />
              <div style={{margin:"18px 0"}}>
                <label>Saturation:&nbsp;</label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.01"
                  value={saturation}
                  onChange={e => setSaturation(e.target.value)}
                  style={{ width: "250px" }}
                />&nbsp;
                <b>{saturation}</b>
              </div>
              <input
                type="text"
                value={userText}
                placeholder="Type text to add..."
                onChange={e => setUserText(e.target.value)}
                style={{
                  margin: "10px auto 0", fontSize: "1.15em", width: "80%",
                  display: "block", padding: "10px", borderRadius: "8px", border: "1.2px solid #ddd"
                }}
              />
              <div
                style={{
                  color: "#333",
                  background: "#eef2fa",
                  margin: "24px auto 0",
                  maxWidth: "80vw",
                  minHeight: "30px",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  fontSize: "1.25em",
                  boxShadow: "0 2px 10px #0001"
                }}
              >
                {userText}
              </div>
              <button
                style={{
                  marginTop: "30px",
                  padding: "10px 32px",
                  background: "#0094dd",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1.08em",
                  cursor: "pointer",
                  fontWeight: 500,
                  boxShadow: "0 1px 10px #0001"
                }}
                onClick={() => setEditing(false)}
              >
                Done Editing
              </button>
            </div>
          </div>
        )}

        {/* Initial instructions */}
        {!imageUrl && !error && !loading && (
          <div className="ai-instructions">
            Enter a prompt above and hit <b>Generate Image</b>!
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
