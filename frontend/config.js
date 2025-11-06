// Contract ABI for PharmaChain
const PharmaChainABI = [
    "function registerBatch(string, string, string, string, uint256, uint256, string) external",
    "function transferBatch(string, address) external",
    "function markAsSpoiled(string, string) external",
    "function autoExpire(string) external",
    "function updateCertificateHash(string, string) external",
    "function getBatchDetails(string) external view returns (string, string, string, string, uint256, uint256, bool, bool, string, string, address)",
    "function checkBatchValidity(string) external view returns (bool)",
    "function batches(string) external view returns (string, string, string, string, uint256, uint256, bool, bool, string, string, address)",
    "function batchExists(string) external view returns (bool)",
    "event BatchRegistered(string batchId, string drugName, address holder)",
    "event BatchTransferred(string batchId, address from, address to)",
    "event BatchSpoiled(string batchId, string reason)",
    "event BatchExpired(string batchId)",
    "event CertificateUpdated(string batchId, string newHash)"
];

// Contract configuration
const CONFIG = {
    contractAddress: "",
    contractABI: PharmaChainABI
};

// Load contract addresses
async function loadConfig() {
    try {
        const response = await fetch('./contracts.json');
        const contracts = await response.json();
        CONFIG.contractAddress = contracts.pharmaChain;
        console.log("✅ Contract config loaded:", CONFIG.contractAddress);
    } catch (error) {
        console.error("❌ Error loading contract config:", error);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', loadConfig);