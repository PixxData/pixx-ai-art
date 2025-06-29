import React, { useState } from "react";
import "./App.css";

function App() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shape, setShape] = useState("landscape"); // Landscape default

  // Edit modal states
  const [editing, setEditing] = useState(false);
  const [saturation, setSaturation] = useState(1);
  const [userText, setUserText] = useState("");
  const [showOnImage, setShowOnImage] = useState(true);
  const [showBg, setShowBg] = useState(true);

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
      setSaturation(1);
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
              <div className="ai-img-footer" style={{ fontSize: "0.95em", color: "#999" }}>
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
            background: "rgba(16,20,26,0.98)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{
              background: "#232838",
              padding: "20px 12px 16px",
              borderRadius: "22px",
              boxShadow: "0 10px 60px #000a",
              textAlign: "center",
              maxWidth: "96vw",
              width: "100%",
              margin: "0",
              color: "#eaf1fa",
              maxHeight: "95vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <img
                  src={imageUrl}
                  alt="Editable AI result"
                  style={{
                    width: "100%",
                    maxWidth: "calc(95vw - 48px)",
                    maxHeight: "70vh",
                    borderRadius: "14px",
                    filter: `saturate(${saturation})`,
                    border: "2px solid #282f4a",
                    background: "#232838",
                    objectFit: "contain",
                    display: "block"
                  }}
                />
                {/* Show text OVER image */}
                {showOnImage && userText && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "90%",
                      pointerEvents: "none",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: showBg ? "13px 30px" : "0px",
                        background: showBg ? "rgba(0,0,0,0.62)" : "none",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "2.1em",
                        borderRadius: "14px",
                        boxShadow: showBg ? "0 2px 12px #0005" : "none",
                        textShadow: "1px 2px 12px #0009",
                        wordBreak: "break-word",
                        maxWidth: "95%",
                        overflowWrap: "break-word",
                      }}
                    >
                      {userText}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ margin: "18px 0 10px", width: "96%" }}>
                <label>Saturation:&nbsp;</label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.01"
                  value={saturation}
                  onChange={e => setSaturation(e.target.value)}
                  style={{ width: "190px" }}
                />&nbsp;
                <b>{saturation}</b>
              </div>

              {/* Text input */}
              <input
                type="text"
                value={userText}
                placeholder="Type text to add to your image"
                onChange={e => setUserText(e.target.value)}
                style={{
                  margin: "14px auto 6px", fontSize: "1.2em", width: "92%",
                  display: "block", padding: "10px", borderRadius: "10px", border: "1.3px solid #bbb"
                }}
              />

              {/* Toggle: Over image or below, and background */}
              <div style={{ marginTop: "2px", marginBottom: "12px", display: "flex", gap: "24px", justifyContent: "center" }}>
                <label style={{ color: "#eaf1fa", fontSize: "1em" }}>
                  <input
                    type="radio"
                    checked={showOnImage}
                    onChange={() => setShowOnImage(true)}
                    style={{ marginRight: "6px" }}
                  />
                  Show ON image
                </label>
                <label style={{ color: "#eaf1fa", fontSize: "1em" }}>
                  <input
                    type="radio"
                    checked={!showOnImage}
                    onChange={() => setShowOnImage(false)}
                    style={{ marginRight: "6px" }}
                  />
                  Show BELOW image
                </label>
                <label style={{ color: "#eaf1fa", fontSize: "1em" }}>
                  <input
                    type="checkbox"
                    checked={showBg}
                    onChange={() => setShowBg(v => !v)}
                    style={{ marginRight: "7px" }}
                  />
                  Text background
                </label>
              </div>

              {/* If showing below image */}
              {!showOnImage && userText && (
                <div style={{
                  margin: "12px auto 0",
                  color: "#fff",
                  background: showBg ? "#222d43" : "none",
                  padding: showBg ? "12px 22px" : "0px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "1.45em",
                  letterSpacing: "0.03em",
                  boxShadow: showBg ? "0 2px 10px #0002" : "none",
                  textShadow: "1px 2px 10px #0008",
                  width: "90%",
                  textAlign: "center"
                }}>
                  {userText}
                </div>
              )}

              <button
                style={{
                  marginTop: "17px",
                  padding: "12px 38px",
                  background: "#0094dd",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "1.15em",
                  cursor: "pointer",
                  fontWeight: 600,
                  boxShadow: "0 1px 14px #0002"
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
