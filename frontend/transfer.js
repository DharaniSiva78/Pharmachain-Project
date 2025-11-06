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

document.getElementById("transferBtn").addEventListener("click", async () => {
  const batchId = document.getElementById("transferBatchId").value.trim();
  const to = document.getElementById("transferTo").value.trim();

  if (!batchId || !to) {
    showResult("❌ Please fill in all fields.", "error");
    return;
  }

  // Validate Ethereum address
  if (!ethers.isAddress(to)) {
    showResult("❌ Invalid receiver address.", "error");
    return;
  }

  try {
    showResult("⏳ Checking batch ownership...", "loading");
    
    // Check if batch exists and current holder
    const batchDetails = await contract.getBatchDetails(batchId);
    const currentHolder = batchDetails[10];
    const userAddress = await signer.getAddress();
    
    if (currentHolder.toLowerCase() !== userAddress.toLowerCase()) {
      showResult("❌ You are not the current holder of this batch.", "error");
      return;
    }

    if (batchDetails[6]) { // expired
      showResult("❌ Cannot transfer expired batch.", "error");
      return;
    }

    if (batchDetails[7]) { // spoiled
      showResult("❌ Cannot transfer spoiled batch.", "error");
      return;
    }

    showResult("⏳ Transferring batch...", "loading");
    
    const tx = await contract.transferBatch(batchId, to);
    showResult("⏳ Transaction submitted. Waiting for confirmation...", "loading");
    
    await tx.wait();
    showResult(`✅ Batch transferred successfully to ${to.substring(0, 6)}...`, "success");
    
    // Clear form
    document.getElementById("transferBatchId").value = "";
    document.getElementById("transferTo").value = "";
    
  } catch (err) {
    console.error("Transfer error:", err);
    let errorMessage = "❌ Error transferring batch.";
    
    if (err.reason) {
      errorMessage = `❌ ${err.reason}`;
    } else if (err.message && err.message.includes("user rejected")) {
      errorMessage = "❌ Transaction rejected by user.";
    } else if (err.message && err.message.includes("Batch does not exist")) {
      errorMessage = "❌ Batch does not exist.";
    }
    
    showResult(errorMessage, "error");
  }
});

function showResult(message, type) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = message;
  resultDiv.className = "result";
  
  if (type === "success") {
    resultDiv.style.color = "#10b981";
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