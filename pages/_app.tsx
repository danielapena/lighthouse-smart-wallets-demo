import type { AppProps } from "next/app";
import {
  ThirdwebProvider,
  coinbaseWallet,
  metamaskWallet,
  smartWallet,
} from "@thirdweb-dev/react";
import "../styles/globals.css";
import { Mumbai } from "@thirdweb-dev/chains";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider
      activeChain={Mumbai}
      autoSwitch={true}
      clientId={process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}
      supportedChains={[Mumbai]}
      supportedWallets={[
        smartWallet({
          factoryAddress: process.env
            .NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS as string,
          gasless: true,
          personalWallets: [metamaskWallet(), coinbaseWallet()],
        }),
      ]}
    >
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

export default MyApp;
