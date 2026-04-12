# Product Requirements Document: Sawtak Blockchain

## Overview
Sawtak is a secure, decentralized platform intended for logging and managing complaints (e.g., whistleblowing or institutional feedback). To ensure security, privacy, and system integrity, we require a custom, permissioned blockchain architecture.

## 1. Technical Architecture Requirements
*   **Framework:** The blockchain must be built as a custom AppChain using the Cosmos SDK framework to ensure scalability and future interoperability.
*   **Consensus Mechanism:** We must use a **Proof of Authority (PoA)** model rather than the default Proof of Stake (PoS).
    *   *Reasoning:* Sawtak handles highly sensitive information. It should only be maintained and validated by trusted, admin-approved institutional nodes rather than anyone who purchases tokens.
    *   *Action:* Disable or remove the standard Cosmos SDK public staking/minting modules and build a custom `poa` validation module.

## 2. Core Feature Requirements (The Complaint System)
The primary function of the network is to act as an immutable ledger for complaints. We must build a custom `sawtak` module that supports three primary operations:

### 2.1 Public & Identified Complaints
*   Users must be able to submit complaints tied to their blockchain identity.
*   The data model must capture the following fields: Title, Description, Tracking ID, Category, Area/Location, Target (Directed To), Incident Date, and Evidence.

### 2.2 Anonymous & Protected Complaints
*   Users must have the ability to report issues entirely anonymously to protect whistleblowers.
*   This flow must capture the exact same data as identified complaints but require an additional cryptographic `proof` field.
*   *Implementation focus:* This will likely integrate Zero-Knowledge (ZK) proofs, allowing users to prove they are authorized to submit the complaint without revealing their underlying identity or address.

### 2.3 Auditing & Status Management
*   There must be an administrative workflow that allows authorized roles to update the state of a complaint.
*   Administrators must be able to transition the `status` (e.g., Pending, In Review, Resolved) and append `public_notes` as the investigation develops.

## 3. High-Level Objectives
*   **Immutability:** Once a complaint is filed, it can never be deleted or altered, ensuring total transparency.
*   **Privacy:** At-risk individuals must be fully protected through robust cryptography when using the anonymous reporting flow.
*   **Controlled Environment:** By using PoA, we guarantee the network is governed and secured solely by vetted authorities, eliminating the risks and token-volatility associated with public blockchains.
