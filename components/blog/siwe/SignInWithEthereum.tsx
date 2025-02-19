"use client";

import { useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import axios from "axios";
import { generateNonce } from "siwe";

export default function SignInWithEthereum() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    console.log("SIWE isConnected: ", isConnected);
    if (isConnected) {
      axios.get<{ authenticated: boolean, address: string }>("/api/siwe").then(({ data }) => setAuthenticated(data.authenticated));
    }
  }, [isConnected]);

  const handleSignIn = async () => {
    try {
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to this app.",
        uri: window.location.origin,
        version: "1",
        chainId: 1,
        nonce: generateNonce(),
      });

      const signedMessage = await signMessageAsync({ message: message.prepareMessage() });

      const response = await axios.post("/api/siwe", { message: message.prepareMessage(), signature: signedMessage });

      console.log('siwe ok, ', response)
      if (response.data.success) {
        setAuthenticated(true);
      }
    } catch (error) {
      console.error("Sign-in failed", error);
    }
  };

  return (
    <div>
      {authenticated ? (
        <p>✅ Signed in with Ethereum</p>
      ) : (
        <button onClick={handleSignIn} disabled={!isConnected}>
          Sign in with Ethereum
        </button>
      )}
    </div>
  );
}
