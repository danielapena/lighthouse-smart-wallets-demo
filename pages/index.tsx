import {
  ConnectWallet,
  UserWallet,
  useConnectedWallet,
} from "@thirdweb-dev/react";
import lighthouse from "@lighthouse-web3/sdk";
import kavach from "@lighthouse-web3/kavach";
import styles from "../styles/Home.module.css";
import { NextPage } from "next";
import { useEffect, useState } from "react";

type AuthSignature = {
  publicKey: string;
  signedMessage: string;
};

const Home: NextPage = () => {
  const cid = process.env.NEXT_PUBLIC_CID_TO_DECRYPT as string;
  const wallet = useConnectedWallet();
  const [decryptedContentUrl, setDecryptedContentUrl] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    if (!wallet) {
      setDecryptedContentUrl(undefined);
      return;
    }
  }, [wallet]);

  const handleSignAndDecryptContent = async () => {
    if (!wallet) {
      return;
    }
    try {
      const address = await wallet.getAddress();

      const authSig: AuthSignature = await getSignature(address, wallet);

      const contentUrl = await decryptContent(cid, authSig);
      setDecryptedContentUrl(contentUrl);
    } catch (error) {
      console.error(error);
      alert(`We could not verify user has access to view this content`);
      setDecryptedContentUrl(undefined);
    }
  };

  async function getSignature(address: string, wallet: UserWallet) {
    const authMessage = await kavach.getAuthMessage(address);
    const signedMessage = await wallet.sign(authMessage.message);

    // TODO: Figure out how to do with SDK
    // const { JWT, error } = await kavach.getJWT(address, signedMessage);
    // if (error) {
    //   throw new Error(error.toString());
    // }
    // if (!JWT) {
    //   throw new Error("JWT not found");
    // }
    const { token } = await fetch(
      "https://encryption.lighthouse.storage/api/message/get-jwt",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          signature: signedMessage,
          chain: "mumbai",
        }),
      }
    ).then((res) => res.json());

    if (!token) throw new Error("Could not get JWT");

    const JWT = token;

    const authSig: AuthSignature = {
      publicKey: address,
      signedMessage: JWT,
    };
    return authSig;
  }

  const decryptContent = async (
    cid: string,
    authSig: AuthSignature
  ): Promise<any> => {
    const keyObject = await lighthouse.fetchEncryptionKey(
      cid,
      authSig.publicKey,
      authSig.signedMessage
    );

    if (!keyObject.data.key)
      throw new Error("User does not have access to this file");

    const decrypted = await lighthouse.decryptFile(cid, keyObject.data.key);

    const blob = new Blob([decrypted]);
    const url = URL.createObjectURL(blob);

    return url;
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Lighthouse + Thirdweb Smart Wallets Demo
          </h1>

          <p className={styles.description}>
            Connect your wallet to get started!
          </p>

          <div className={styles.connect}>
            <ConnectWallet
              dropdownPosition={{
                side: "bottom",
                align: "center",
              }}
            />
          </div>
        </div>

        <div className={styles.grid}>
          {wallet && (
            <a
              href="#"
              onClick={handleSignAndDecryptContent}
              className={styles.card}
              rel="noopener noreferrer"
            >
              <div className={styles.cardText}>
                <h2 className={styles.gradientText1}>Sign message ➜</h2>
                <p>
                  Open dev tools console to see the signed message and results
                </p>
              </div>
            </a>
          )}
          {decryptedContentUrl && (
            <a
              href={decryptedContentUrl}
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className={styles.cardText}>
                <h2 className={styles.gradientText1}>Decrypted content ➜</h2>
                <p>Click to view the decrypted content</p>
              </div>
            </a>
          )}
        </div>
      </div>
    </main>
  );
};

export default Home;
