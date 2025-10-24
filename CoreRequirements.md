## Project Goal
To create a secure, resilient, and trustworthy platform that allows citizens and employees in Egypt to anonymously report misconduct, corruption, or other complaints, with cryptographic guarantees of data integrity and submission proof.

---

## 1. High-Level System Requirements

- **HLR-1: Anonymity & Pseudonymity**: The system must not require or store any Personally Identifiable Information (PII). A user's identity is solely a cryptographically generated pseudonym (wallet address).
- **HLR-2: Data Immutability**: Once a complaint is submitted, neither the raw data nor the record of its submission can be altered, deleted, or censored by any party, including system administrators.
- **HLR-3: Public Verifiability**: Any third party (e.g., journalists, NGOs, auditors) must be able to independently verify that a specific complaint was submitted by a specific pseudonym at a specific time, without relying on the system's own database.
- **HLR-4: Censorship Resistance**: The system's architecture must be distributed, making it technically and practically difficult for any single entity to shut it down or alter its contents.
- **HLR-5: User-Side Security**: The ultimate security of a user's anonymity and access to their submission history is their responsibility, managed through their private keys. The system must educate users on this critical point.

---

## 2. Functional & Technical Requirements by Component

### Engine Component 1: Persistence Layer (Decentralized Storage)

**Function**: To securely and permanently store the raw complaint data (text, documents, images, etc.) without any metadata that could identify the submitter.

| ID | Requirement |
|----|-------------|
| **PL-1** | The system **shall** use a content-addressable storage protocol (e.g., IPFS, Arweave) to store complaint data. |
| **PL-2** | Upon submission of a data payload, the Persistence Layer **shall** return a unique, cryptographically strong Content Identifier (CID/Hash). |
| **PL-3** | The raw data **shall** be encrypted client-side *before* being sent to the Persistence Layer to prevent storage node operators from viewing contents. |
| **PL-4** | The system **shall** implement a pinning/availability service to ensure the long-term resilience and accessibility of the stored data, preventing garbage collection. |
| **PL-5** | The Persistence Layer **must not** store any information linking the data payload to the user's IP address or browser fingerprint. |

### Engine Component 2: Identity & Authorization Layer (Wallet)

**Function**: To provide a pseudonymous identity for the user and to cryptographically authorize actions without revealing their real-world identity.

| ID | Requirement |
|----|-------------|
| **IAL-1** | The system **shall** provide a client-side wallet generation tool that creates a new, random public-private key pair for each new user session, with no registration. |
| **IAL-2** | The system **shall** operate as a "non-custodial" wallet, meaning the private key is **never** transmitted to or stored on any server. It remains only in the user's browser/memory. |
| **IAL-3** | The application **shall** clearly instruct the user to save their "Recovery Phrase" (private key) if they wish to access their submission history or identity in the future. |
| **IAL-4** | For every action requiring a blockchain transaction (e.g., submitting a complaint hash), the wallet **shall** create a digital signature using the user's private key. |
| **IAL-5** | The system **must** abstract away the complexity of acquiring cryptocurrency. It **shall** integrate a "gasless" or "sponsored transaction" mechanism, or a simple fiat-on-ramp, so the user does not need to own crypto to submit a complaint. |

### Engine Component 3: Verification Layer (Blockchain Ledger)

**Function**: To serve as the immutable, public, and tamper-proof registry that permanently links a user's pseudonym to the hash of their complaint.

| ID | Requirement |
|----|-------------|
| **VL-1** | The system **shall** deploy a smart contract on a public, permissionless blockchain (e.g., Ethereum, Polygon, Solana). |
| **VL-2** | The smart contract **shall** expose a function, `submitComplaint(bytes32 _complaintHash)`, which records the hash and the sender's address. |
| **VL-3** | The smart contract **must** emit an event for each submission, logging the `sender` (wallet address), `complaintHash`, and `blockTimestamp`. This enables efficient off-chain querying. |
| **VL-4** | The smart contract logic **shall be** open-source and verified on a block explorer, allowing anyone to audit its functionality. |
| **VL-5** | The ledger's data (transactions, events) **must** be publicly accessible and queryable by anyone with an internet connection, without requiring an API key or login. |

---

## 3. System Workflow & Integration Requirements

| ID | Requirement |
|----|-------------|
| **SW-1** | The user interface (web app) **shall** guide the user through a linear flow: **Write Complaint -> Encrypt & Store -> Get Hash -> Sign & Submit Hash -> View Receipt.** |
| **SW-2** | Upon final submission, the system **shall** present the user with a "Receipt" containing:<br>- Their Wallet Address (Pseudonym)<br>- The Complaint Hash (CID)<br>- The Blockchain Transaction ID<br>- A link to the transaction on a block explorer. |
| **SW-3** | The system **shall** provide a "Verification Portal" where anyone can enter a Transaction ID or Complaint Hash to independently verify the existence and details of a submission against the blockchain. |
| **SW-4** | All cryptographic operations (key generation, encryption, signing) **must** be performed client-side in the user's browser, not on a central server. |

---

## 4. Non-Functional & Operational Requirements

| ID | Requirement |
|----|-------------|
| **NFR-1: Usability** | The user interface **must** be simple, intuitive, and available in Arabic and English. It should mask the underlying cryptographic complexity. |
| **NFR-2: Accessibility** | The web application **shall** be accessible via the Tor network to protect users from network-level surveillance and blocking. |
| **NFR-3: Legal Defense** | The system's architecture **should be** legally defensible. Since the hosting organization does not possess the raw complaint data (it's decentralized and encrypted) or the identity of submitters, its liability and ability to comply with coercive requests is significantly reduced. |
| **NFR-4: Open Source** | The entire codebase for the web application and smart contracts **shall** be open-source to build trust, enable audits, and allow the community to verify its security claims. |
| **NFR-5: Documentation** | Comprehensive documentation **shall** be provided for both users (how to submit safely) and technical auditors (how the system works). |

---
