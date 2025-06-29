import React, { useState } from "react";
import "./App.css";

const PRODUCT_OPTIONS = [
  { label: "Acrylic, Metal, Stretched Canvas", value: "print" },
  { label: "Paper print", value: "paper" },
  { label: "Framed print", value: "framed" },
];

function App() {
  const [prompt, setPrompt] = useState("");
  const [shape, setShape] = useState("landscape");
  const [images, setImages] = useState([]);   // Array of 4 image URLs
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderProduct, setOrderProduct] = useState({}); // { idx: product }

  const sizeOptions = {
    square: "1024x1024",
    landscape: "1792x1024",
    portrait: "1024x1792",
  };

  // 1. Generate 4 images at once
  const handleSubmit = async (e) => {
    e.preventDefault();
    setImages([]);
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          size: sizeOptions[shape],
          n: 4, // <---- This makes OpenAI generate 4 images
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error generating images.");
        setLoading(false);
        return;
      }

      setImages(data.images || []);
    } catch (err) {
      setError("Network or server error.");
    }
    setLoading(false);
  };

  // 2. Order (upload to S3, then redirect to print app)
  const handleOrder = async (imgUrl, idx) => {
    const product = orderProduct[idx];
    if (!product) {
      alert("Please select a product type.");
      return;
    }
    setLoading(true);

    try {
      // Upload image to S3 via your backend endpoint
      const uploadRes = await fetch("/api/upload-s3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imgUrl }),
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.s3Url) {
        throw new Error(uploadData.error || "Upload failed");
      }

      // Redirect to correct order app with s3Url as parameter
      let orderUrl = "";
      if (product === "print") {
        orderUrl = `https://YOUR-APP-PRINT.com?img=${encodeURIComponent(uploadData.s3Url)}`;
      } else if (product === "paper") {
        orderUrl = `https://YOUR-APP-PAPER.com?img=${encodeURIComponent(uploadData.s3Url)}`;
      } else if (product === "framed") {
        orderUrl = `https://YOUR-APP-FRAMED.com?img=${encodeURIComponent(uploadData.s3Url)}`;
      }
      window.open(orderUrl, "_blank");
    } catch (e) {
      alert("Error uploading image: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="ai-app-bg">
      <div className="ai-app-container" style={{ display: "flex", gap: "36px" }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <h1>Pixx Prompt-to-Image</h1>
          <form className="ai-form" onSubmit={handleSubmit}>
            <select
              className="ai-shape-select"
              value={shape}
              onChange={e => setShape(e.target.value)}
              disabled={loading}
              style={{
                marginBottom: "12px",
                padding: "8px",
                borderRadius: "8px",
                fontSize: "1em"
              }}
            >
              <option value="square">Square</option>
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
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
            />
            <button className="ai-generate-btn" type="submit" disabled={loading || !prompt.trim()}>
              {loading ? "Generating..." : "Generate 4 Images"}
            </button>
          </form>
          {error && <div className="ai-error-box">{error}</div>}
          {!images.length && !error && !loading && (
            <div className="ai-instructions">
              Enter a prompt and click <b>Generate</b>!
            </div>
          )}
        </div>
        {/* Image Grid */}
        <div style={{ flex: 2, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
          {images.map((img, idx) => (
            <div key={img} className="ai-image-card" style={{ background: "#222", borderRadius: "14px", padding: "10px" }}>
              <img src={img} alt="AI Option" style={{ width: "100%", borderRadius: "12px" }} />
              <div style={{ margin: "10px 0" }}>
                <select
                  value={orderProduct[idx] || ""}
                  onChange={e => setOrderProduct(prev => ({ ...prev, [idx]: e.target.value }))}
                  style={{
                    borderRadius: "7px",
                    padding: "6px 12px",
                    fontSize: "1em",
                    marginBottom: "8px"
                  }}
                >
                  <option value="">Select product…</option>
                  {PRODUCT_OPTIONS.map(opt =>
                    <option value={opt.value} key={opt.value}>{opt.label}</option>
                  )}
                </select>
                <button
                  style={{
                    width: "100%", marginTop: "4px",
                    padding: "10px 0", borderRadius: "8px",
                    background: "#0094dd", color: "#fff",
                    border: "none", fontWeight: "bold", cursor: "pointer"
                  }}
                  onClick={() => handleOrder(img, idx)}
                  disabled={loading}
                >Order</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
