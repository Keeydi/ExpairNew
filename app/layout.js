import './globals.css';
import Head from 'next/head';
import ClientLayout from '../components/client-layout';

export const metadata = {
  title: 'Expair',
  description: 'Fair skill exchange platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter&display=swap"
        />
      </Head>
      <body className="bg-[#050015] text-white font-sans flex flex-col min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
