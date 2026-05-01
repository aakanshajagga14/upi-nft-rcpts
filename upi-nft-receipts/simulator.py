import hashlib
import json
import random
import time

def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def generate_utr() -> str:
    return "".join(str(random.randint(0, 9)) for _ in range(12))

def main() -> None:
    sender_upi = "alice@upi"
    receiver_upi = "merchant@upi"
    amount = 1299
    category = "Shopping"
    timestamp = int(time.time())

    sender_hash = sha256_hex(sender_upi)
    receiver_hash = sha256_hex(receiver_upi)

    utr = generate_utr()
    utr_hash = sha256_hex(utr)

    payload = {
        "amount": amount,
        "utrHash": utr_hash,
        "senderHash": sender_hash,
        "receiverHash": receiver_hash,
        "category": category,
        "timestamp": timestamp,
        # zk_ready flags future zero-knowledge proof layer for selective amount disclosure
        "zk_ready": True,
    }

    with open("transaction.json", "w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2)

    print("=== Simulated UPI Transaction ===")
    print(f"Sender UPI (raw): {sender_upi}")
    print(f"Receiver UPI (raw): {receiver_upi}")
    print(f"Amount (INR): {amount}")
    print(f"Category: {category}")
    print(f"Timestamp (epoch): {timestamp}")
    print(f"UTR (raw): {utr}")
    print(f"Sender Hash (SHA-256): {sender_hash}")
    print(f"Receiver Hash (SHA-256): {receiver_hash}")
    print(f"UTR Hash (SHA-256): {utr_hash}")
    print("\nPrivacy note:")
    print(
        "This prototype stores amount and timestamp as plaintext on-chain. "
        "Hashed identity fields provide baseline privacy, while selective disclosure via "
        "zero-knowledge proofs is planned for a future layer."
    )
    print("\nSaved middleware-ready payload to transaction.json")


if __name__ == "__main__":
    main()
