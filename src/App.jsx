import React, { useState } from "react";
import "./App.css";

const PRODUCT_URLS = {
  print: "https://www.pixximaging.com/metal-prints-calgary",
  paper: "https://www.pixximaging.com/photo-prints-calgary",
  framed: "https://www.pixximaging.com/picture-framing-calgary"
};

function App() {
  const [prompt, setPrompt] = useState("");
  const [shape, setShape] = useState("horizontal");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    // Generate 2 images, 2 API calls (DALL-E 3 only allows n:1)
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
    } catch (e) {
      alert("Error uploading image: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="ai-app-bg" style={{ minHeight: "100vh", background: "#181c22" }}>
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
            <div className="ai-instructions" style={{marginTop:"18px"}}>
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
    </div>
  );
}

export default App;
