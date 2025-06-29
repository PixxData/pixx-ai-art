import React, { useState } from "react";
import "./App.css";

const PRODUCT_OPTIONS = [
  { label: "Acrylic, Metal, Stretched Canvas", value: "print" },
  { label: "Paper print", value: "paper" },
  { label: "Framed print", value: "framed" },
];

function App() {
  const [prompt, setPrompt] = useState("");
  const [shape, setShape] = useState("horizontal");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderIdx, setOrderIdx] = useState(null);   // which image is being ordered
  const [orderProduct, setOrderProduct] = useState({});

  const sizeOptions = {
    square: "1024x1024",
    horizontal: "1792x1024",
    vertical: "1024x1792",
  };

  // Product URLs
  const PRODUCT_URLS = {
    print: "https://YOUR-APP-PRINT.com",
    paper: "https://YOUR-APP-PAPER.com",
    framed: "https://YOUR-APP-FRAMED.com"
  };

  // Generate images
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
  count: 2,
}),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error generating images.");
        setLoading(false);
        return;
      }

      setImages(data.images || []);
      setOrderIdx(null);
      setOrderProduct({});
    } catch (err) {
      setError("Network or server error.");
    }
    setLoading(false);
  };

  // Order flow
  const handleOrder = (idx) => {
    setOrderIdx(idx);
  };

  const handleOrderConfirm = async (idx) => {
    const imgUrl = images[idx];
    const product = orderProduct[idx];
    if (!product) {
      alert("Please select a product type.");
      return;
    }
    setLoading(true);

    try {
      // Upload image to S3 via your backend endpoint (replace with your code!)
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
      let orderUrl = PRODUCT_URLS[product];
      if (orderUrl) {
        orderUrl += `?img=${encodeURIComponent(uploadData.s3Url)}`;
        window.open(orderUrl, "_blank");
      }
      setOrderIdx(null);
    } catch (e) {
      alert("Error uploading image: " + e.message);
    }
    setLoading(false);
  };

  // UI layout
  return (
    <div className="ai-app-bg" style={{ minHeight: "100vh", background: "#181c22" }}>
      <div className="ai-app-container" style={{ display: "flex", alignItems: "flex-start", maxWidth: "100vw", width: "100vw", margin: "0 auto", gap: "60px" }}>
        <div style={{ flex: "0 0 340px", minWidth: 320, margin: "40px 0 0 40px" }}>
          <h1 style={{
            color: "#93d0ff",
            fontWeight: 800,
            fontSize: "2.2em",
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
            <div className="ai-instructions" style={{marginTop:"18px"}}>
              Enter a prompt and click <b>Generate</b>!
            </div>
          )}
        </div>
        {/* Image Grid, fill right */}
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
                  borderRadius: "2px",   // <--- 2px radius for the image
                  background: "#000"
                }}
              />
              <div style={{ margin: "24px 0 0 0" }}>
                {/* Order Button triggers dropdown */}
                {orderIdx !== idx ? (
                  <button
                    style={{
                      width: "100%",
                      padding: "13px 0",
                      borderRadius: "9px",
                      background: "#0094dd",
                      color: "#fff",
                      border: "none",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "1.12em",
                      letterSpacing: "0.02em",
                      marginTop: "12px"
                    }}
                    onClick={() => handleOrder(idx)}
                    disabled={loading}
                  >Order</button>
                ) : (
                  <div style={{ marginTop: "8px" }}>
                    <select
                      value={orderProduct[idx] || ""}
                      onChange={e => setOrderProduct(prev => ({ ...prev, [idx]: e.target.value }))}
                      style={{
                        borderRadius: "7px",
                        padding: "10px 12px",
                        fontSize: "1.08em",
                        marginBottom: "8px",
                        marginRight: "8px",
                        width: "70%",
                        background: "#f7fafd"
                      }}
                    >
                      <option value="">Select product…</option>
                      {PRODUCT_OPTIONS.map(opt =>
                        <option value={opt.value} key={opt.value}>{opt.label}</option>
                      )}
                    </select>
                    <button
                      style={{
                        padding: "10px 18px",
                        borderRadius: "7px",
                        background: "#52b7a7",
                        color: "#fff",
                        border: "none",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: "1.05em",
                        marginRight: "10px"
                      }}
                      onClick={() => handleOrderConfirm(idx)}
                      disabled={loading}
                    >Confirm Order</button>
                    <button
                      style={{
                        padding: "9px 13px",
                        borderRadius: "7px",
                        background: "#222",
                        color: "#fff",
                        border: "1px solid #444",
                        cursor: "pointer",
                        fontSize: "1em"
                      }}
                      onClick={() => setOrderIdx(null)}
                      type="button"
                    >Cancel</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
