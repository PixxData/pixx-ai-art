import React, { useState, useRef } from "react";
import "./App.css";

function App() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shape, setShape] = useState("landscape");

  // Edit mode states
  const [editing, setEditing] = useState(false);
  const [userText, setUserText] = useState("");
  const [showBg, setShowBg] = useState(true);
  const [fontSize, setFontSize] = useState(2);
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [showTextControls, setShowTextControls] = useState(false);
  // For dragging text
  const [textPos, setTextPos] = useState({ x: 0.5, y: 0.85 });
  const dragInfo = useRef({ dragging: false, offsetX: 0, offsetY: 0 });

  const sizeOptions = {
    square: "1024x1024",
    landscape: "1792x1024",
    portrait: "1024x1792",
  };

  const fontOptions = [
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Impact", value: "Impact, Charcoal, sans-serif" },
    { label: "Comic Sans MS", value: "'Comic Sans MS', cursive, sans-serif" },
    { label: "Courier New", value: "'Courier New', Courier, monospace" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setImageUrl("");
    setError("");
    setLoading(true);
    setEditing(false);
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
      setUserText("");
      setShowTextControls(false);
      setTextPos({ x: 0.5, y: 0.85 });
      setFontFamily("Arial, sans-serif");
    } catch (err) {
      setError("Network or server error.");
    }
    setLoading(false);
  };

  // --- Drag to move the text overlay ---
  const handleMouseDown = (e) => {
    if (!editing || !showTextControls) return;
    dragInfo.current.dragging = true;
    const rect = e.target.parentElement.getBoundingClientRect();
    dragInfo.current.offsetX = e.clientX - (rect.left + rect.width * textPos.x);
    dragInfo.current.offsetY = e.clientY - (rect.top + rect.height * textPos.y);
    document.body.style.userSelect = "none";
  };
  const handleMouseMove = (e) => {
    if (!dragInfo.current.dragging) return;
    const container = document.getElementById("edit-img-wrap");
    if (!container) return;
    const rect = container.getBoundingClientRect();
    let x = (e.clientX - rect.left - dragInfo.current.offsetX) / rect.width;
    let y = (e.clientY - rect.top - dragInfo.current.offsetY) / rect.height;
    x = Math.min(Math.max(x, 0), 1);
    y = Math.min(Math.max(y, 0), 1);
    setTextPos({ x, y });
  };
  const handleMouseUp = () => {
    dragInfo.current.dragging = false;
    document.body.style.userSelect = "";
  };
  React.useEffect(() => {
    if (!editing || !showTextControls) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line
  }, [editing, showTextControls, textPos]);

  const handleEditOpen = () => {
    setEditing(true);
    setShowTextControls(false);
    setTextPos({ x: 0.5, y: 0.85 });
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
              {/* No text below image */}
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
              onClick={handleEditOpen}
            >
              Edit image / Add text
            </button>
          </div>
        )}

        {/* EDIT MODE MODAL */}
        {imageUrl && editing && (
          <div className="ai-edit-modal" style={{
            position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
            background: "rgba(16,20,26,0.98)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{
              background: "#232838",
              padding: "20px 10px 16px",
              borderRadius: "20px",
              boxShadow: "0 10px 60px #0009",
              textAlign: "center",
              maxWidth: "96vw",
              width: "100%",
              margin: "0",
              color: "#eaf1fa",
              minHeight: "auto",
              maxHeight: "95vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {/* Edit Image Display, with draggable text */}
              <div
                id="edit-img-wrap"
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "min(92vw, 1000px)",
                  height: "auto",
                  maxHeight: "70vh",
                  aspectRatio: shape === "portrait" ? "9/16"
                    : shape === "landscape" ? "16/9" : "1/1",
                  background: "#1a1c26",
                  overflow: "hidden",
                  margin: "0 auto"
                }}
              >
                <img
                  src={imageUrl}
                  alt="Editable AI result"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    borderRadius: "14px",
                    border: "2px solid #282f4a",
                    background: "#232838",
                    display: "block",
                  }}
                />
                {/* Draggable text overlay */}
                {showTextControls && userText && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${textPos.x * 100}%`,
                      top: `${textPos.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                      cursor: "move",
                      zIndex: 20,
                      userSelect: "none",
                    }}
                    onMouseDown={handleMouseDown}
                  >
<span
  style={{
    display: "inline-block",
    padding: "13px 30px",
    background: showBg ? "rgba(0,0,0,0.62)" : "transparent",
    color: "#fff",
    fontWeight: 700,
    fontSize: `${fontSize}em`,
    fontFamily: fontFamily,
    borderRadius: "14px",
    boxShadow: showBg ? "0 2px 12px #0005" : "none",
    textShadow: "1px 2px 12px #0009",
    whiteSpace: "nowrap",            // <--- prevent wrapping
    maxWidth: "100vw",               // <--- allow more room
    overflow: "hidden",              // <--- hide overflow
    pointerEvents: "none"
  }}
>
  {userText}
</span>
                  </div>
                )}
              </div>
              {/* Add Text button / controls */}
              {!showTextControls && (
                <button
                  style={{
                    margin: "14px 0 8px",
                    padding: "8px 22px",
                    background: "#444d66",
                    color: "#fff",
                    border: "none",
                    borderRadius: "9px",
                    fontSize: "1em",
                    cursor: "pointer"
                  }}
                  onClick={() => setShowTextControls(true)}
                  type="button"
                >
                  Add Text
                </button>
              )}
              {showTextControls && (
                <>
                  <input
                    type="text"
                    value={userText}
                    placeholder="Type text to add to your image"
                    onChange={e => setUserText(e.target.value)}
                    style={{
                      margin: "14px auto 6px", fontSize: "1.2em", width: "80%",
                      display: "block", padding: "10px", borderRadius: "10px", border: "1.3px solid #bbb"
                    }}
                  />
                  <div style={{ margin: "6px 0 8px", display: "flex", gap: "24px", justifyContent: "center" }}>
                    <label style={{ color: "#eaf1fa", fontSize: "1em" }}>
                      <input
                        type="checkbox"
                        checked={showBg}
                        onChange={() => setShowBg(v => !v)}
                        style={{ marginRight: "7px" }}
                      />
                      Text background
                    </label>
                    <label style={{ color: "#eaf1fa", fontSize: "1em" }}>
                      Font:&nbsp;
                      <select
                        value={fontFamily}
                        onChange={e => setFontFamily(e.target.value)}
                        style={{
                          fontSize: "1em",
                          borderRadius: "7px",
                          padding: "2px 10px",
                        }}
                      >
                        {fontOptions.map(opt => (
                          <option value={opt.value} key={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div style={{ margin: "10px 0 8px", width: "92%" }}>
                    <label>
                      Text size:&nbsp;
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="0.05"
                        value={fontSize}
                        onChange={e => setFontSize(Number(e.target.value))}
                        style={{ width: "140px", verticalAlign: "middle" }}
                      />
                      &nbsp;<b>{fontSize}em</b>
                    </label>
                  </div>
                  <button
                    style={{
                      margin: "8px 0 0 0",
                      padding: "6px 20px",
                      background: "#888ea5",
                      color: "#fff",
                      border: "none",
                      borderRadius: "7px",
                      fontSize: "1em",
                      cursor: "pointer"
                    }}
                    onClick={() => { setUserText(""); setShowTextControls(false); }}
                    type="button"
                  >
                    Remove Text
                  </button>
                </>
              )}
              <button
                style={{
                  marginTop: "18px",
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
