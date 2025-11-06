let provider, signer, contract;

async function connectToBlockchain() {
  if (window.ethereum) {
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = await provider.getSigner();
      
      await loadConfig();
      contract = new ethers.Contract(CONFIG.contractAddress, CONFIG.contractABI, signer);
      console.log("✅ Connected to contract");
      
      const address = await signer.getAddress();
      document.getElementById('walletAddress').textContent = 
        `Connected: ${address.substring(0, 6)}...${address.substring(38)}`;
      document.getElementById('connectWallet').textContent = '✅ Connected';
      
      return true;
    } catch (error) {
      console.error("Connection error:", error);
      alert("❌ Error connecting to blockchain");
      return false;
    }
  } else {
    alert("Please install MetaMask!");
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await connectToBlockchain();
});

document.getElementById("connectWallet").addEventListener("click", connectToBlockchain);

document.getElementById("viewBtn").addEventListener("click", async () => {
  const batchId = document.getElementById("viewBatchId").value.trim();
  
  if (!batchId) {
    showResult("❌ Please enter a valid Batch ID.", "error");
    return;
  }

  try {
    showResult("⏳ Fetching batch details...", "loading");
    
    const data = await contract.getBatchDetails(batchId);
    
    const [
      batchIdResult,
      drugName,
      manufacturer,
      origin,
      manufactureDate,
      expiryDate,
      expired,
      spoiled,
      spoilReason,
      certificateHash,
      currentHolder
    ] = data;

    const manufactureDateFormatted = new Date(Number(manufactureDate) * 1000).toLocaleDateString();
    const expiryDateFormatted = new Date(Number(expiryDate) * 1000).toLocaleDateString();
    const currentTime = Math.floor(Date.now() / 1000);
    const isActuallyExpired = Number(expiryDate) <= currentTime;
    
    let status = "✅ Active";
    let statusColor = "#10b981";
    
    if (expired) {
      status = "⏰ Expired";
      statusColor = "#ef4444";
    } else if (spoiled) {
      status = "⚠️ Spoiled";
      statusColor = "#f59e0b";
    } else if (isActuallyExpired && !expired) {
      status = "⏰ Expired (Needs Update)";
      statusColor = "#f59e0b";
    }

    const resultHTML = `
      <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1rem;">
        <h3 style="color: ${statusColor}; margin-bottom: 0.5rem;">${status}</h3>
        <p><strong>Batch ID:</strong> ${batchIdResult}</p>
        <p><strong>Drug Name:</strong> ${drugName}</p>
        <p><strong>Manufacturer:</strong> ${manufacturer || "N/A"}</p>
        <p><strong>Origin:</strong> ${origin || "N/A"}</p>
      </div>
      
      <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1rem;">
        <p><strong>Manufacture Date:</strong> ${manufactureDateFormatted}</p>
        <p><strong>Expiry Date:</strong> ${expiryDateFormatted}</p>
        <p><strong>Expired:</strong> ${expired ? "✅ Yes" : "❌ No"}</p>
        <p><strong>Spoiled:</strong> ${spoiled ? "✅ Yes" : "❌ No"}</p>
        ${spoiled ? `<p><strong>Spoil Reason:</strong> ${spoilReason}</p>` : ''}
      </div>
      
      <div>
        <p><strong>Certificate Hash:</strong> <span style="font-family: monospace; font-size: 0.8rem;">${certificateHash}</span></p>
        <p><strong>Current Holder:</strong> <span style="font-family: monospace;">${currentHolder}</span></p>
      </div>
      
      ${isActuallyExpired && !expired ? `
      <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
        <p style="color: #f59e0b; margin: 0;">💡 This batch has expired but hasn't been marked as expired on blockchain. Use the Auto Expire function to update its status.</p>
      </div>
      ` : ''}
    `;

    showResult(resultHTML, "success");
    
  } catch (err) {
    console.error("View error:", err);
    let errorMessage = "❌ Batch not found or error fetching data.";
    
    if (err.message && err.message.includes("Batch does not exist")) {
      errorMessage = "❌ Batch does not exist.";
    } else if (err.message && err.message.includes("user rejected")) {
      errorMessage = "❌ Transaction rejected by user.";
    }
    
    showResult(errorMessage, "error");
  }
});

function showResult(message, type) {
  const resultDiv = document.getElementById("viewResult");
  resultDiv.innerHTML = message;
  resultDiv.className = "result";
  
  if (type === "success") {
    resultDiv.style.borderLeft = "4px solid #10b981";
  } else if (type === "error") {
    resultDiv.style.color = "#ef4444";
    resultDiv.style.borderLeft = "4px solid #ef4444";
  } else if (type === "loading") {
    resultDiv.style.color = "#f59e0b";
    resultDiv.style.borderLeft = "4px solid #f59e0b";
  }
  
  resultDiv.classList.remove("hidden");
}