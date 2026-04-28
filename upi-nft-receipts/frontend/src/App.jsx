import { useMemo, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { QRCodeSVG } from "qrcode.react";
import abiJson from "./UPIReceipt.json";
import addressJson from "./contractAddress.json";

const CONTRACT_ADDRESS = addressJson.contractAddress;
const CONTRACT_ABI = abiJson.abi || [];

// Design system maps categories to disciplined accent tones used across the vault cards.
const categoryTone = (category = "") => {
  const key = category.toLowerCase();
  if (key.includes("food")) return { color: "var(--accent-amber)", bg: "rgba(245,158,11,0.15)" };
  if (key.includes("transport")) return { color: "var(--accent-blue)", bg: "rgba(59,130,246,0.15)" };
  if (key.includes("shopping")) return { color: "var(--accent-violet)", bg: "rgba(129,140,248,0.15)" };
  return { color: "var(--text-secondary)", bg: "rgba(139,148,158,0.15)" };
};

const truncateAddress = (address) => `${address.slice(0, 6)}…${address.slice(-4)}`;
const maskHash = (hash = "") => (hash.length < 10 ? hash : `${hash.slice(0, 4)}***${hash.slice(-4)}`);
const padToken = (tokenId) => `#${String(tokenId).padStart(4, "0")}`;

const formatDateIST = (timestamp) =>
  new Date(Number(timestamp) * 1000).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }) + " IST";

function SkeletonCard() {
  return <div className="skeleton-card shimmer" />;
}

export default function App() {
  const [wallet, setWallet] = useState("");
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState(null);

  const canLoad = useMemo(() => CONTRACT_ADDRESS && CONTRACT_ABI.length > 0, []);

  const fetchReceipts = async (userAddress) => {
    if (!window.ethereum || !canLoad) return;
    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const filter = contract.filters.ReceiptMinted(userAddress);
      const events = await contract.queryFilter(filter, 0, "latest");

      const all = await Promise.all(
        events.map(async (event) => {
          const tokenId = event.args.tokenId.toString();
          const data = await contract.getReceipt(tokenId);
          return {
            tokenId,
            amount: data.amount.toString(),
            utrHash: data.utrHash,
            category: data.category,
            timestamp: data.timestamp.toString(),
          };
        })
      );

      setReceipts(all.reverse());
    } catch (error) {
      console.error("Failed to fetch receipts", error);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is required.");
      return;
    }
    setConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const userAddress = accounts[0];
      setWallet(userAddress);
      await fetchReceipts(userAddress);
    } catch (error) {
      console.error("Wallet connection failed", error);
    } finally {
      setConnecting(false);
    }
  };

  const copyHash = async (value, tokenId) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedTokenId(tokenId);
      setTimeout(() => setCopiedTokenId(null), 1500);
    } catch (error) {
      console.error("Clipboard failed", error);
    }
  };

  return (
    <>
      <style>{`
        /* Midnight Vault design tokens + atmospheric layers for security-fintech feel. */
        :root { --bg-primary:#0A0C10; --bg-card:#111318; --bg-card-hover:#161B22; --border-subtle:#21262D; --border-accent:#30363D; --accent-blue:#3B82F6; --accent-green:#4ADE80; --accent-amber:#F59E0B; --accent-violet:#818CF8; --text-primary:#E6EDF3; --text-secondary:#8B949E; --text-muted:#484F58; --glass-bg:rgba(255,255,255,0.03); --glass-border:rgba(255,255,255,0.07); }
        *{box-sizing:border-box} body{margin:0;background:var(--bg-primary);color:var(--text-primary);font-family:"IBM Plex Mono",monospace}
        body::before{content:"";position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse 80% 40% at 50% -10%, rgba(129,140,248,0.12) 0%, transparent 70%)}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#21262D}::-webkit-scrollbar-thumb{background:#30363D;border-radius:999px}
        .app{min-height:100vh;padding-top:56px;padding-bottom:70px}
        .topbar{position:fixed;top:0;left:0;right:0;height:56px;padding:0 24px;display:flex;justify-content:space-between;align-items:center;background:rgba(10,12,16,.85);backdrop-filter:blur(20px);border-bottom:1px solid var(--border-subtle);z-index:20}
        .logo{font-weight:700;font-size:.9rem}.logo .hex{color:var(--accent-violet)}
        .net{display:flex;align-items:center;gap:8px;border:1px solid rgba(74,222,128,.2);background:rgba(74,222,128,.08);padding:6px 10px;border-radius:999px;font-size:.7rem;color:var(--accent-green)}
        .pulse{width:8px;height:8px;border-radius:999px;background:var(--accent-green);animation:pulse 1.8s infinite}
        .btn{border:1px solid var(--accent-blue);background:transparent;color:var(--accent-blue);padding:8px 16px;border-radius:6px;font-family:inherit;cursor:pointer;transition:all .2s ease}
        .btn:hover{background:var(--accent-blue);color:var(--bg-primary)}
        .addr{padding:8px 16px;border-radius:999px;border:1px solid rgba(74,222,128,.3);color:var(--accent-green)}
        .hero{padding:120px 24px 64px;text-align:center}
        .headline{font-family:"DM Serif Display",serif;font-size:3.5rem;line-height:1.1;margin:0 0 12px;animation:rise .6s ease-out forwards;opacity:0}
        .sub{max-width:480px;margin:0 auto;color:var(--text-secondary);font-size:.85rem;animation:rise .6s .15s ease-out forwards;opacity:0}
        .pills{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:18px;animation:rise .6s .3s ease-out forwards;opacity:0}
        .pill{border:1px solid var(--border-subtle);background:var(--bg-card);border-radius:999px;padding:8px 16px;font-size:.7rem}
        .section{max-width:1200px;margin:0 auto;padding:0 32px}
        .title-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
        .section-label{font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:#6B7A8D}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
        .empty{text-align:center;padding:72px 16px;color:var(--text-muted)}
        .empty h3{font-family:"DM Serif Display",serif;font-size:1.5rem;margin:16px 0 6px}
        .card{background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:12px;padding:24px;transition:all .25s ease;animation:cardIn .4s ease-out forwards;opacity:0}
        .card:hover{border-color:var(--border-accent);background:var(--bg-card-hover);transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.4)}
        .row{display:flex;justify-content:space-between;align-items:center;gap:10px}
        .badge{font-size:.6rem;padding:6px 10px;border-radius:999px;border:1px solid}
        .soul{font-size:.6rem;padding:6px 10px;border-radius:999px;border:1px solid rgba(74,222,128,.2);color:var(--accent-green);background:rgba(74,222,128,.08)}
        .amt{font-family:"DM Serif Display",serif;color:#E8F4E8;font-size:2.8rem;margin:14px 0 10px}
        .amt small{font-size:2rem}
        .rule{border-top:1px solid var(--border-subtle);margin:16px 0}
        .datarow{display:flex;justify-content:space-between;font-size:.75rem;padding:6px 0;gap:12px}
        .label{font-size:.65rem;letter-spacing:.12em;color:#6B7A8D}
        .utr{color:var(--accent-green)}
        .token{color:var(--accent-violet)}
        .status{display:flex;align-items:center;gap:6px;color:var(--accent-green)}
        .dot{width:7px;height:7px;border-radius:50%;background:var(--accent-green)}
        .qr-wrap{text-align:center;margin-top:12px}
        .qr-box{display:inline-block;background:var(--bg-primary);border:1px solid var(--border-subtle);border-radius:8px;padding:12px}
        .link{display:block;margin-top:8px;color:var(--accent-blue);font-size:.65rem;text-decoration:none}
        .foot{margin-top:16px;padding-top:12px;border-top:1px solid var(--border-subtle)}
        .copy{border:1px solid var(--border-subtle);background:transparent;color:var(--text-secondary);border-radius:6px;padding:4px 8px;font-size:.7rem;cursor:pointer;transition:all .2s ease}
        .copy:active{transform:scale(.95)} .copy:hover{transform:scale(1.05)}
        .skeleton-card{height:420px;border:1px solid var(--border-subtle);border-radius:12px;background:#111318}
        .shimmer{background:linear-gradient(110deg,#21262D 20%,#30363D 40%,#21262D 60%);background-size:200% 100%;animation:shimmer 1.5s linear infinite}
        .bottombar{position:fixed;left:0;right:0;bottom:0;height:44px;background:rgba(10,12,16,.9);border-top:1px solid var(--border-subtle);backdrop-filter:blur(12px);display:flex;justify-content:center;align-items:center;gap:12px;color:var(--text-muted);font-size:.65rem}
        .spark{color:var(--accent-violet)}
        .spinner{display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid rgba(59,130,246,.3);border-top-color:var(--accent-blue);animation:spin .7s linear infinite}
        @keyframes pulse{0%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.4}100%{transform:scale(1);opacity:1}}
        @keyframes rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cardIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="app">
        <nav className="topbar">
          <div className="logo"><span className="hex">⬡</span> UPI·NFT</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="net"><span className="pulse" /> Sepolia Testnet</div>
            {!wallet ? (
              <button className="btn" onClick={connectWallet} disabled={connecting}>
                {connecting ? <span className="spinner" /> : "Connect Wallet"}
              </button>
            ) : (
              <div className="addr">{truncateAddress(wallet)}</div>
            )}
          </div>
        </nav>

        <section className="hero">
          <h1 className="headline">Your Financial Proof,<br />On-Chain Forever</h1>
          <p className="sub">
            Soulbound NFT receipts for every UPI transaction. Tamper-proof. Self-sovereign. ERC-5192.
          </p>
          <div className="pills">
            <span className="pill">⬡ ERC-5192 Soulbound</span>
            <span className="pill">🔒 SHA-256 Privacy</span>
            <span className="pill">◎ Sepolia Testnet</span>
          </div>
        </section>

        <section className="section">
          <div className="title-row">
            <div className="section-label">Receipt Vault</div>
            <div className="pill">{receipts.length} receipts</div>
          </div>

          {/* Loading skeletons preserve layout density and avoid visual jump after wallet connect. */}
          {loading ? (
            <div className="grid">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : !wallet || receipts.length === 0 ? (
            <div className="empty">
              <div style={{ fontSize: "2.8rem", opacity: 0.35 }}>⬡</div>
              <h3>No receipts found</h3>
              <div style={{ fontSize: ".75rem" }}>
                Connect your wallet and mint a receipt to get started
                {!canLoad && <div style={{ marginTop: 8 }}>Contract config missing from deploy/ABI step.</div>}
              </div>
            </div>
          ) : (
            <div className="grid">
              {receipts.map((item, index) => {
                const tone = categoryTone(item.category);
                const verifyUrl = `https://sepolia.etherscan.io/token/${CONTRACT_ADDRESS}?a=${item.tokenId}`;
                return (
                  <article className="card" key={item.tokenId} style={{ animationDelay: `${index * 80}ms` }}>
                    <div className="row">
                      <div
                        className="badge"
                        style={{ color: tone.color, background: tone.bg, borderColor: `${tone.color}55`, filter: "brightness(1)" }}
                      >
                        {item.category.toUpperCase()}
                      </div>
                      <div className="soul">🔒 SOULBOUND</div>
                    </div>

                    <div className="amt"><small>₹</small>{item.amount}</div>
                    <div className="rule" />

                    <div className="datarow"><span className="label">UTR HASH</span><span className="utr">{maskHash(item.utrHash)}</span></div>
                    <div className="datarow"><span className="label">DATE</span><span>{formatDateIST(item.timestamp)}</span></div>
                    <div className="datarow"><span className="label">TOKEN ID</span><span className="token">{padToken(item.tokenId)}</span></div>
                    <div className="datarow"><span className="label">STATUS</span><span className="status"><span className="dot" />CONFIRMED ON-CHAIN</span></div>

                    <div className="qr-wrap">
                      <div className="qr-box">
                        <QRCodeSVG value={verifyUrl} size={80} bgColor="#0A0C10" fgColor="#E6EDF3" />
                      </div>
                      <a href={verifyUrl} target="_blank" rel="noreferrer" className="link">Verify on Etherscan ↗</a>
                    </div>

                    <div className="foot row">
                      <span style={{ fontSize: ".7rem", color: "var(--text-secondary)" }}>⬡ Ethereum Sepolia</span>
                      <button className="copy" onClick={() => copyHash(item.utrHash, item.tokenId)}>
                        {copiedTokenId === item.tokenId ? "Copied!" : "Copy UTR"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Footer states plaintext fields and future ZK selective disclosure scope. */}
      <footer className="bottombar">
        <span>Amount and timestamp stored on-chain in plaintext.</span>
        <span>•</span>
        <span className="spark">✦ ZK selective disclosure — coming in v2</span>
      </footer>
    </>
  );
}
