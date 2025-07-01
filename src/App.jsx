import React, { useState } from "react";
import "./App.css";

const PRODUCT_URLS = {
  print: "https://aiacm.netlify.app",
  paper: "https://aipaper.netlify.app",
  framed: "https://aiframing.netlify.app"
};

function App() {
  const [prompt, setPrompt] = useState("");
  const [shape, setShape] = useState("horizontal");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ---- Lightbox/modal state ----
  const [modalUrl, setModalUrl] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const sizeOptions = {
    square: "1024x1024",
    horizontal: "1792x1024",
    vertical: "1024x1792",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setImages([]);
    setError("");
    setLoading(true);

    try {
      const results = [];
      for (let i = 0; i < 2; i++) {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            size: sizeOptions[shape],
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.imageUrl) {
          throw new Error(data.error || "Error generating image.");
        }
        results.push(data.imageUrl);
      }
      setImages(results);
    } catch (err) {
      setError(err.message || "Network or server error.");
    }
    setLoading(false);
  };

  // Product Order
  const handleOrderConfirm = async (idx, product) => {
    const imgUrl = images[idx];
    setLoading(true);

    try {
      // Upload to S3 via API route
      const uploadRes = await fetch("/api/upload-s3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imgUrl }),
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.s3Url) throw new Error(uploadData.error || "Upload failed");

      // Use a 6-digit timestamp for filename (seconds)
      const shortTimestamp = Math.floor(Date.now() / 1000) % 1000000;
      const filename = `${shortTimestamp}.jpg`;

      const orderUrl = `${PRODUCT_URLS[product]}?img=${encodeURIComponent(uploadData.s3Url)}&filename=${encodeURIComponent(filename)}`;

      setModalUrl(orderUrl);
      setModalOpen(true);
    } catch (e) {
      alert("Error uploading image: " + e.message);
    }
    setLoading(false);
  };

  // ---- Modal/lightbox JSX ----
const Modal = () =>
  modalOpen && (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.88)",
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
      onClick={() => setModalOpen(false)}
    >
      <div
        style={{
          width: "90vw",    // Make this smaller
          height: "95vh",   // And this
          background: "#181c22",
          borderRadius: 20,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 10px 64px #000c"
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setModalOpen(false)}
          style={{
            position: "absolute", top: 8, right: 18, zIndex: 2,
            fontSize: "2em", color: "#fff", background: "none", border: "none",
            cursor: "pointer", lineHeight: "1em"
          }}
          title="Close"
        >
          &times;
        </button>
        <iframe
          src={modalUrl}
          title="Order"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            background: "#222",
            overflow: "hidden"
          }}
          scrolling="no"
        />
      </div>
    </div>
  );

  return (
    <div className="ai-app-bg" style={{ minHeight: "100vh", background: "#181c22" }}>
      {/* EXIT button: only when modal is not open */}
      {!modalOpen && (
        <button
          style={{
            position: "fixed",
            top: 16,
            right: 24,
            zIndex: 9999,
            background: "#23272f",
            color: "#fff",
            border: "none",
            borderRadius: "7px",
            padding: "11px 23px",
            fontSize: "1.12em",
            fontWeight: 700,
            letterSpacing: "0.04em",
            boxShadow: "0 1px 8px #0004",
            cursor: "pointer"
          }}
          onClick={() => window.top.location.href = "https://pixximaging.com"}
        >
          EXIT
        </button>
      )}

      <div className="ai-app-container" style={{ display: "flex", alignItems: "flex-start", maxWidth: "100vw", width: "100vw", margin: "0 auto", gap: "60px" }}>
        <div style={{ flex: "0 0 340px", minWidth: 320, margin: "40px 0 0 40px" }}>
          <h1 style={{
            color: "#93d0ff",
            fontWeight: 800,
            fontSize: "1.75em",
            margin: "0 0 25px 0",
            letterSpacing: "0.01em",
            textShadow: "0 1px 18px #0022"
          }}>Pixx Prompt-to-Image</h1>
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
                fontSize: "1.1em",
                minWidth: "185px"
              }}
            >
              <option value="square">Square</option>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
            <input
              className="ai-prompt-input"
              type="text"
              placeholder="Describe your image..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={loading}
              autoFocus
              required
              style={{ marginBottom: "18px" }}
            />
            <button className="ai-generate-btn" type="submit" disabled={loading || !prompt.trim()}>
              {loading ? "Generating..." : "Generate 2 Images"}
            </button>
          </form>
          {error && <div className="ai-error-box">{error}</div>}
          {!images.length && !error && !loading && (
            <div className="ai-instructions" style={{ marginTop: "18px" }}>
              Enter a prompt and click <b>Generate</b>!
            </div>
          )}
        </div>
        {/* Image Grid */}
        <div style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "38px",
          justifyItems: "center",
          alignItems: "start",
          marginTop: "34px",
          marginRight: "60px",
        }}>
          {images.map((img, idx) => (
            <div
              key={img}
              className="ai-image-card"
              style={{
                background: "#23272f",
                borderRadius: "20px",
                padding: "18px 18px 24px",
                width: "97%",
                maxWidth: "670px",
                boxShadow: "0 4px 32px #0004",
                minHeight: "max(450px,34vw)"
              }}
            >
              <img
                src={img}
                alt="AI Option"
                style={{
                  width: "100%",
                  height: "min(34vw,650px)",
                  objectFit: "contain",
                  borderRadius: "2px",
                  background: "#000"
                }}
              />
              <div style={{ margin: "24px 0 0 0", textAlign: "center" }}>
                <div style={{
                  fontWeight: 600,
                  color: "#d3ecff",
                  marginBottom: "10px",
                  letterSpacing: "0.02em",
                  fontSize: "1.15em"
                }}>Order:</div>
                <div style={{
                  display: "flex",
                  gap: "11px",
                  justifyContent: "center",
                  marginTop: "3px"
                }}>
                  <button
                    style={{
                      padding: "7px 10px",
                      borderRadius: "6px",
                      background: "#2188d7",
                      color: "#fff",
                      border: "none",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.95em",
                      minWidth: "80px"
                    }}
                    onClick={() => handleOrderConfirm(idx, "print")}
                    disabled={loading}
                  >Acrylic/Metal/Canvas</button>
                  <button
                    style={{
                      padding: "7px 10px",
                      borderRadius: "6px",
                      background: "#5ba150",
                      color: "#fff",
                      border: "none",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.95em",
                      minWidth: "80px"
                    }}
                    onClick={() => handleOrderConfirm(idx, "paper")}
                    disabled={loading}
                  >Paper</button>
                  <button
                    style={{
                      padding: "7px 10px",
                      borderRadius: "6px",
                      background: "#bc6f3e",
                      color: "#fff",
                      border: "none",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.95em",
                      minWidth: "80px"
                    }}
                    onClick={() => handleOrderConfirm(idx, "framed")}
                    disabled={loading}
                  >Framed</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal />
    </div>
  );
}

export default App;
